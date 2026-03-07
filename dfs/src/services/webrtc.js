const CHUNK_SIZE = 64 * 1024; // 64KB chunks for DataChannel

const RTC_CONFIG = {
    iceServers: [] // Empty array forces strictly local network transfers (no STUN/TURN)
};

export class WebRTCService {
    constructor() {
        this.pc = null;
        this.dataChannel = null;
        this.onProgress = null;
        this.onFileReceived = null;
        this.onConnectionStateChange = null;
        this.onError = null;
        this._receiveBuffer = [];
        this._receivedSize = 0;
        this._incomingFile = null;
        this._sendQueue = [];
        this._isSending = false;
        // ICE candidate buffer — holds candidates that arrive before remote description is set
        this._pendingCandidates = [];
        this._remoteDescriptionSet = false;
    }

    createPeerConnection(signalingService, remoteId) {
        this.pc = new RTCPeerConnection(RTC_CONFIG);
        this._remoteId = remoteId;
        this._signalingService = signalingService;
        this._remoteDescriptionSet = false;
        this._pendingCandidates = [];

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                signalingService.sendIceCandidate(remoteId, event.candidate);
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', this.pc.iceConnectionState);
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            console.log('[WebRTC] Connection state:', state);
            if (state === 'connected') {
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange('connected');
                }
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                if (this.onConnectionStateChange) {
                    this.onConnectionStateChange(state);
                }
            }
        };

        this.pc.ondatachannel = (event) => {
            console.log('[WebRTC] Received data channel');
            this.dataChannel = event.channel;
            this._setupDataChannel();
        };

        return this.pc;
    }

    createDataChannel() {
        this.dataChannel = this.pc.createDataChannel('fileTransfer', {
            ordered: true
        });
        this._setupDataChannel();
        return this.dataChannel;
    }

    _setupDataChannel() {
        this.dataChannel.binaryType = 'arraybuffer';

        this.dataChannel.onopen = () => {
            console.log('[WebRTC] DataChannel open');
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange('connected');
            }
        };

        this.dataChannel.onclose = () => {
            console.log('[WebRTC] DataChannel closed');
        };

        this.dataChannel.onerror = (err) => {
            console.error('[WebRTC] DataChannel error:', err);
            if (this.onError) this.onError(err);
        };

        this.dataChannel.onmessage = (event) => {
            this._handleMessage(event.data);
        };
    }

    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    async handleOffer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        this._remoteDescriptionSet = true;
        // Flush any buffered ICE candidates
        await this._flushPendingCandidates();
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
        this._remoteDescriptionSet = true;
        // Flush any buffered ICE candidates
        await this._flushPendingCandidates();
    }

    async addIceCandidate(candidate) {
        if (!this._remoteDescriptionSet) {
            // Buffer the candidate until remote description is set
            console.log('[WebRTC] Buffering ICE candidate (remote description not set yet)');
            this._pendingCandidates.push(candidate);
            return;
        }
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('[WebRTC] Error adding ICE candidate:', e);
        }
    }

    async _flushPendingCandidates() {
        console.log(`[WebRTC] Flushing ${this._pendingCandidates.length} buffered ICE candidates`);
        for (const candidate of this._pendingCandidates) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('[WebRTC] Error adding buffered ICE candidate:', e);
            }
        }
        this._pendingCandidates = [];
    }

    // ============ File Sending ============

    async sendFile(file) {
        return new Promise((resolve, reject) => {
            if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
                return reject(new Error('DataChannel not open'));
            }

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const startTime = Date.now();

            // Set the low watermark to 2MB - when buffer drops below this, we'll resume reading
            this.dataChannel.bufferedAmountLowThreshold = 2 * 1024 * 1024;

            // Send metadata first
            const metadata = JSON.stringify({
                type: 'file-meta',
                name: file.name,
                size: file.size,
                mimeType: file.type,
                totalChunks
            });
            this.dataChannel.send(metadata);

            let offset = 0;
            let chunkIndex = 0;

            const sendNextChunk = () => {
                // If buffer is over 12MB, pause and wait for it to drain
                if (this.dataChannel.bufferedAmount > 12 * 1024 * 1024) {
                    this.dataChannel.onbufferedamountlow = () => {
                        this.dataChannel.onbufferedamountlow = null;
                        sendNextChunk();
                    };
                    return;
                }

                // Prepare next chunk
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                slice.arrayBuffer().then((buffer) => {
                    if (this.dataChannel.readyState !== 'open') {
                        return reject(new Error('DataChannel closed mid-transfer'));
                    }

                    try {
                        this.dataChannel.send(buffer);
                        offset += buffer.byteLength;
                        chunkIndex++;

                        if (this.onProgress) {
                            const elapsed = (Date.now() - startTime) / 1000;
                            const speed = offset / elapsed;
                            this.onProgress({
                                direction: 'send',
                                fileName: file.name,
                                loaded: offset,
                                total: file.size,
                                percentage: Math.round((offset / file.size) * 100),
                                speed,
                                chunkIndex,
                                totalChunks
                            });
                        }

                        if (offset < file.size) {
                            // Yield briefly to event loop to keep UI responsive
                            setTimeout(sendNextChunk, 0);
                        } else {
                            this.dataChannel.send(JSON.stringify({ type: 'file-complete' }));
                            const duration = Date.now() - startTime;
                            resolve({ duration, size: file.size });
                        }
                    } catch (err) {
                        reject(err);
                    }
                }).catch(reject);
            };

            // Start sending
            try {
                sendNextChunk();
            } catch (err) {
                reject(err);
            }
        });
    }

    // ============ File Receiving ============

    _handleMessage(data) {
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'file-meta') {
                    console.log('[WebRTC] Receiving file:', msg.name, 'Size:', msg.size);
                    this._incomingFile = {
                        name: msg.name,
                        size: msg.size,
                        mimeType: msg.mimeType,
                        totalChunks: msg.totalChunks
                    };
                    this._receiveBuffer = [];
                    this._receivedSize = 0;
                    this._startTime = Date.now();
                    return;
                }
                if (msg.type === 'file-complete') {
                    this._assembleFile();
                    return;
                }
            } catch (e) {
                // Not JSON
            }
        }

        if (data instanceof ArrayBuffer && this._incomingFile) {
            this._receiveBuffer.push(data);
            this._receivedSize += data.byteLength;

            if (this.onProgress) {
                const elapsed = (Date.now() - this._startTime) / 1000;
                const speed = this._receivedSize / elapsed;
                this.onProgress({
                    direction: 'receive',
                    fileName: this._incomingFile.name,
                    loaded: this._receivedSize,
                    total: this._incomingFile.size,
                    percentage: Math.round((this._receivedSize / this._incomingFile.size) * 100),
                    speed,
                    chunkIndex: this._receiveBuffer.length,
                    totalChunks: this._incomingFile.totalChunks
                });
            }
        }
    }

    _assembleFile() {
        if (!this._incomingFile) return;

        const blob = new Blob(this._receiveBuffer, { type: this._incomingFile.mimeType });
        const duration = Date.now() - this._startTime;

        if (this.onFileReceived) {
            this.onFileReceived({
                name: this._incomingFile.name,
                size: this._incomingFile.size,
                mimeType: this._incomingFile.mimeType,
                blob,
                url: URL.createObjectURL(blob),
                duration
            });
        }

        this._receiveBuffer = [];
        this._receivedSize = 0;
        this._incomingFile = null;
    }

    // ============ Cleanup ============

    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this._pendingCandidates = [];
        this._remoteDescriptionSet = false;
    }
}

export default WebRTCService;
