import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Send, Download, FileIcon, Smartphone, Monitor, Copy, Check, ArrowUpDown, Zap, Shield, X, Plus } from 'lucide-react';
import signalingService from '../services/socket';
import WebRTCService from '../services/webrtc';
import api from '../api/axios';

const P2PTransfer = () => {
    // Connection state
    const [connectionState, setConnectionState] = useState('idle');
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [peerDevice, setPeerDevice] = useState(null);
    const [transferRole, setTransferRole] = useState(null); // 'sender' | 'receiver'
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState(false);

    // Transfer state
    const [transferProgress, setTransferProgress] = useState(null);
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [sentFiles, setSentFiles] = useState([]);
    const [transferHistory, setTransferHistory] = useState([]);

    // Refs to hold mutable values in callbacks
    const webrtcRef = useRef(null);
    const fileInputRef = useRef(null);
    const peerDeviceRef = useRef(null);
    const deviceName = useRef(getDeviceName());

    // Keep ref in sync with state
    useEffect(() => {
        peerDeviceRef.current = peerDevice;
    }, [peerDevice]);

    function getDeviceName() {
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) return 'Android Device';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device';
        if (/Windows/i.test(ua)) return 'Windows PC';
        if (/Mac/i.test(ua)) return 'Mac';
        if (/Linux/i.test(ua)) return 'Linux PC';
        return 'Unknown Device';
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (webrtcRef.current) webrtcRef.current.close();
            signalingService.disconnect();
        };
    }, []);

    // Fetch transfer history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/transfers');
                setTransferHistory(res.data);
            } catch (e) { /* silent */ }
        };
        fetchHistory();
    }, [sentFiles, receivedFiles]);

    function setupWebRTC(remoteId, isInitiator) {
        const rtc = new WebRTCService();
        webrtcRef.current = rtc;

        rtc.createPeerConnection(signalingService, remoteId);

        rtc.onConnectionStateChange = (state) => {
            console.log('[P2P] Connection state changed to:', state);
            if (state === 'connected') {
                setConnectionState('connected');
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                setConnectionState('idle');
                setPeerDevice(null);
                setTransferProgress(null);
            }
        };

        rtc.onProgress = (progress) => {
            setTransferProgress(progress);
            if (progress.percentage >= 100 && progress.direction === 'send') {
                setTimeout(() => setTransferProgress(null), 2000);
            }
        };

        rtc.onFileReceived = (file) => {
            setReceivedFiles(prev => [...prev, file]);
            setTransferProgress(null);
            setConnectionState('connected');

            // Log transfer
            try {
                api.post('/transfers', {
                    filename: file.name,
                    size: file.size,
                    senderDevice: peerDeviceRef.current?.deviceName || 'Unknown',
                    receiverDevice: deviceName.current,
                    method: 'p2p',
                    status: 'completed',
                    duration: file.duration
                });
            } catch (e) { /* silent */ }
        };

        rtc.onError = (err) => {
            console.error('[P2P] WebRTC error:', err);
            setErrorMsg(err.message || 'WebRTC error');
        };

        if (isInitiator) {
            rtc.createDataChannel();
        }

        return rtc;
    }

    // CREATE ROOM
    const handleCreateRoom = async () => {
        try {
            setConnectionState('creating');
            setErrorMsg('');

            // Clean up any old listeners
            signalingService.disconnect();

            await signalingService.connect();
            const code = await signalingService.createRoom(deviceName.current);
            setRoomCode(code);
            setConnectionState('waiting');

            // When peer joins, initiate WebRTC
            signalingService.on('peer-joined', async (data) => {
                console.log('[P2P] Peer joined:', data.deviceName);
                setPeerDevice(data);

                const rtc = setupWebRTC(data.peerId, true);

                // Register signaling handlers for this connection
                signalingService.on('answer', async (sigData) => {
                    console.log('[P2P] Received answer');
                    await rtc.handleAnswer(sigData.answer);
                });

                signalingService.on('ice-candidate', async (sigData) => {
                    await rtc.addIceCandidate(sigData.candidate);
                });

                // Create and send offer
                const offer = await rtc.createOffer();
                console.log('[P2P] Sending offer to peer');
                signalingService.sendOffer(data.peerId, offer);
            });

            signalingService.on('peer-disconnected', () => {
                setConnectionState('waiting');
                setPeerDevice(null);
                setTransferProgress(null);
                if (webrtcRef.current) {
                    webrtcRef.current.close();
                    webrtcRef.current = null;
                }
            });

        } catch (err) {
            console.error('[P2P] Create room error:', err);
            setErrorMsg(err.message);
            setConnectionState('error');
        }
    };

    // JOIN ROOM
    const handleJoinRoom = async () => {
        if (!inputCode || inputCode.length !== 6) {
            setErrorMsg('Please enter a valid 6-digit code');
            return;
        }
        try {
            setConnectionState('joining');
            setErrorMsg('');

            // Clean up any old listeners
            signalingService.disconnect();

            await signalingService.connect();
            const { hostId, hostDeviceName } = await signalingService.joinRoom(inputCode, deviceName.current);
            console.log('[P2P] Joined room, host:', hostDeviceName);
            setPeerDevice({ peerId: hostId, deviceName: hostDeviceName });
            setRoomCode(inputCode);

            const rtc = setupWebRTC(hostId, false);

            // Register signaling handlers BEFORE the host sends the offer
            signalingService.on('offer', async (sigData) => {
                console.log('[P2P] Received offer, creating answer');
                const answer = await rtc.handleOffer(sigData.offer);
                signalingService.sendAnswer(sigData.sender, answer);
            });

            signalingService.on('ice-candidate', async (sigData) => {
                await rtc.addIceCandidate(sigData.candidate);
            });

            signalingService.on('peer-disconnected', () => {
                setConnectionState('idle');
                setPeerDevice(null);
                setRoomCode('');
                setTransferProgress(null);
                if (webrtcRef.current) {
                    webrtcRef.current.close();
                    webrtcRef.current = null;
                }
            });

        } catch (err) {
            console.error('[P2P] Join room error:', err);
            setErrorMsg(err.message);
            setConnectionState('error');
        }
    };

    // SEND FILE
    const handleSendFile = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            try {
                setConnectionState('transferring');
                const result = await webrtcRef.current.sendFile(file);
                setSentFiles(prev => [...prev, { name: file.name, size: file.size, duration: result.duration }]);
                setConnectionState('connected');

                try {
                    await api.post('/transfers', {
                        filename: file.name,
                        size: file.size,
                        senderDevice: deviceName.current,
                        receiverDevice: peerDeviceRef.current?.deviceName || 'Unknown',
                        method: 'p2p',
                        status: 'completed',
                        duration: result.duration
                    });
                } catch (e) { /* silent */ }

            } catch (err) {
                setErrorMsg(`Failed to send ${file.name}: ${err.message}`);
                setConnectionState('connected');
            }
        }
        e.target.value = '';
    };

    // DISCONNECT
    const handleDisconnect = () => {
        if (webrtcRef.current) {
            webrtcRef.current.close();
            webrtcRef.current = null;
        }
        signalingService.disconnect();
        setConnectionState('idle');
        setRoomCode('');
        setInputCode('');
        setPeerDevice(null);
        setTransferProgress(null);
        setErrorMsg('');
        setTransferRole(null);
    };

    // Copy room code
    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatSpeed = (bytesPerSec) => {
        if (bytesPerSec > 1024 * 1024) return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
        if (bytesPerSec > 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
        return bytesPerSec.toFixed(0) + ' B/s';
    };

    const isConnected = connectionState === 'connected' || connectionState === 'transferring';

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        P2P File Transfer
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Transfer files directly between devices — no server upload needed</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-gray-500">End-to-end encrypted</span>
                </div>
            </div>

            {/* Connection Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {!isConnected && connectionState !== 'waiting' ? (
                    <div className="p-8 text-center max-w-2xl mx-auto">
                        {!transferRole ? (
                            <div className="grid md:grid-cols-2 gap-8">
                                <button
                                    onClick={() => { setTransferRole('sender'); handleCreateRoom(); }}
                                    className="p-8 border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center flex flex-col items-center justify-center gap-4 group"
                                >
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Send className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Send</h3>
                                        <p className="text-sm text-gray-500 mt-2">Generate a code to transfer files to another device safely.</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setTransferRole('receiver')}
                                    className="p-8 border-2 border-gray-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center flex flex-col items-center justify-center gap-4 group"
                                >
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Download className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Receive</h3>
                                        <p className="text-sm text-gray-500 mt-2">Enter a 6-digit code from the sender to get files.</p>
                                    </div>
                                </button>
                            </div>
                        ) : transferRole === 'receiver' ? (
                            <div className="max-w-md mx-auto space-y-6">
                                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <Smartphone className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Receive Files</h3>
                                <p className="text-sm text-gray-500">Enter the 6-digit room code shown on the sending device</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={connectionState === 'joining' || inputCode.length !== 6}
                                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {connectionState === 'joining' ? 'Joining...' : 'Join'}
                                    </button>
                                </div>
                                <button onClick={() => setTransferRole(null)} className="text-sm text-gray-500 hover:text-gray-700 underline pt-4">Start Over</button>
                            </div>
                        ) : (
                            <div className="py-12">
                                <svg className="animate-spin w-8 h-8 mx-auto text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                <p className="mt-4 text-gray-500 font-medium">Preparing secure sender room...</p>
                            </div>
                        )}
                    </div>
                ) : connectionState === 'waiting' ? (
                    /* Waiting for peer (Sender Only) */
                    <div className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                            <Wifi className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-gray-600 mb-4 font-medium">Ready to send! Share this code with the receiver:</p>
                            <div className="inline-flex items-center gap-3 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-2xl px-10 py-5">
                                <span className="text-5xl font-mono font-bold text-indigo-700 tracking-[0.2em]">{roomCode}</span>
                                <button onClick={copyCode} className="p-2 ml-2 bg-white shadow-sm hover:shadow border border-indigo-100 hover:bg-indigo-50 rounded-xl transition-all">
                                    {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-indigo-400" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-6">Waiting for the receiving device to connect to the local network...</p>
                        <button onClick={handleDisconnect} className="mt-4 px-6 py-2 bg-red-50 text-red-600 font-medium hover:bg-red-100 rounded-xl transition-colors">
                            Cancel Transfer
                        </button>
                    </div>
                ) : (
                    /* Connected */
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium mb-1">
                                        {transferRole === 'sender' ? 'Connected to Receiver' : 'Connected to Sender'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-gray-800">{peerDevice?.deviceName || 'Unknown Device'}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-mono">Room: {roomCode}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleDisconnect} className="flex items-center gap-2 px-4 py-2 font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200">
                                <WifiOff className="w-5 h-5" />
                                Disconnect
                            </button>
                        </div>

                        {/* Send File Area (Only for Sender) */}
                        {transferRole === 'sender' && (
                            <div
                                className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleSendFile} multiple className="hidden" />
                                <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Send className="w-8 h-8 text-indigo-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Select files to send</h3>
                                <p className="text-gray-500">Files are transferred securely at lightning speed over the local network.</p>
                            </div>
                        )}

                        {/* Receiving Area (Only for Receiver) */}
                        {transferRole === 'receiver' && (
                            <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                    <Download className="w-8 h-8 text-emerald-500 animate-bounce" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Receive</h3>
                                <p className="text-gray-500 font-medium">Waiting for the sender to transmit files...</p>
                            </div>
                        )}

                        {/* Transfer Progress Container */}
                        {transferProgress && (
                            <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                                    <div className={`h-full ${transferProgress.direction === 'send' ? 'bg-indigo-500' : 'bg-emerald-500'} transition-all duration-300`} style={{ width: `${transferProgress.percentage}%` }}></div>
                                </div>
                                <div className="flex items-center justify-between mb-4 mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${transferProgress.direction === 'send' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <ArrowUpDown className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800 truncate max-w-[250px]">{transferProgress.fileName}</div>
                                            <div className="text-xs text-gray-500 font-medium mt-0.5">{transferProgress.direction === 'send' ? 'Sending...' : 'Receiving...'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-800">{transferProgress.percentage}%</div>
                                        <div className="text-xs text-gray-500 font-medium mt-0.5">{formatSpeed(transferProgress.speed || 0)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400 font-medium bg-gray-50 rounded-lg p-2 px-3">
                                    <span>Transferred: {formatSize(transferProgress.loaded)}</span>
                                    <span>Total: {formatSize(transferProgress.total)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {errorMsg && (
                    <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                            <X className="w-5 h-5 p-0.5 bg-red-200 rounded-full text-red-600" />
                            {errorMsg}
                        </div>
                        <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                )}
            </div>

            {/* Received Files */}
            {transferRole === 'receiver' && receivedFiles.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-emerald-500" />
                        Received Files
                    </h3>
                    <div className="space-y-3">
                        {receivedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <FileIcon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatSize(file.size)} • {(file.duration / 1000).toFixed(1)}s</p>
                                    </div>
                                </div>
                                <a
                                    href={file.url}
                                    download={file.name}
                                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    Save
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sent Files */}
            {transferRole === 'sender' && sentFiles.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5 text-indigo-500" />
                        Sent Files
                    </h3>
                    <div className="space-y-3">
                        {sentFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FileIcon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatSize(file.size)} • {(file.duration / 1000).toFixed(1)}s</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">Sent ✓</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transfer History */}
            {transferHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-medium">File</th>
                                    <th className="pb-3 font-medium">Size</th>
                                    <th className="pb-3 font-medium">From</th>
                                    <th className="pb-3 font-medium">To</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transferHistory.slice(0, 10).map((t, idx) => (
                                    <tr key={idx} className="border-b border-gray-50">
                                        <td className="py-3 text-gray-700">{t.filename}</td>
                                        <td className="py-3 text-gray-500">{formatSize(t.size)}</td>
                                        <td className="py-3 text-gray-500">{t.senderDevice}</td>
                                        <td className="py-3 text-gray-500">{t.receiverDevice}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default P2PTransfer;
