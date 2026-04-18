import { io } from 'socket.io-client';
import { getBackendBaseUrl } from '../api/backendUrl';

class SignalingService {
    constructor() {
        this.socket = null;
        this.connectPromise = null;
        this.callbacks = {};
    }

    async connect() {
        if (this.socket?.connected) {
            return Promise.resolve();
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        if (!this.socket) {
            const signalingUrl = await getBackendBaseUrl();
            this.socket = io(signalingUrl, {
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                timeout: 10000,
                autoConnect: false
            });

            // Relay events to callbacks
            this.socket.on('peer-joined', (data) => this._emit('peer-joined', data));
            this.socket.on('peer-disconnected', (data) => this._emit('peer-disconnected', data));
            this.socket.on('offer', (data) => this._emit('offer', data));
            this.socket.on('answer', (data) => this._emit('answer', data));
            this.socket.on('ice-candidate', (data) => this._emit('ice-candidate', data));
        }

        this.connectPromise = new Promise((resolve, reject) => {
            let settled = false;
            let lastError = null;

            const cleanup = () => {
                this.socket.off('connect', onConnect);
                this.socket.off('connect_error', onConnectError);
                clearTimeout(timeoutId);
                this.connectPromise = null;
            };

            const onConnect = () => {
                if (settled) return;
                settled = true;
                console.log('[Signal] Connected:', this.socket.id);
                cleanup();
                resolve();
            };

            const onConnectError = (err) => {
                // Keep trying until timeout/reconnection attempts are exhausted.
                lastError = err;
                console.warn('[Signal] Connection attempt failed:', err?.message || err);
            };

            const timeoutId = setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(lastError || new Error('Unable to connect to signaling server'));
            }, 12000);

            this.socket.on('connect', onConnect);
            this.socket.on('connect_error', onConnectError);
            this.socket.connect();
        });

        return this.connectPromise;
    }

    createRoom(deviceName) {
        if (!this.socket?.connected) {
            return Promise.reject(new Error('Signaling socket is not connected'));
        }

        return new Promise((resolve, reject) => {
            this.socket.timeout(10000).emit('create-room', { deviceName }, (err, response) => {
                if (err) {
                    reject(new Error('Create room request timed out'));
                    return;
                }

                if (response.success) {
                    resolve(response.roomCode);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    joinRoom(roomCode, deviceName) {
        if (!this.socket?.connected) {
            return Promise.reject(new Error('Signaling socket is not connected'));
        }

        return new Promise((resolve, reject) => {
            this.socket.timeout(10000).emit('join-room', { roomCode, deviceName }, (err, response) => {
                if (err) {
                    reject(new Error('Join room request timed out'));
                    return;
                }

                if (response.success) {
                    resolve({ hostId: response.hostId, hostDeviceName: response.hostDeviceName });
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    sendOffer(target, offer) {
        this.socket.emit('offer', { target, offer });
    }

    sendAnswer(target, answer) {
        this.socket.emit('answer', { target, answer });
    }

    sendIceCandidate(target, candidate) {
        this.socket.emit('ice-candidate', { target, candidate });
    }

    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }

    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    _emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }

    disconnect() {
        this.connectPromise = null;
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.callbacks = {};
    }
}

const signalingService = new SignalingService();
export default signalingService;
