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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 animate-fade-in">
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-gradient-to-br from-yellow-100 to-amber-50 rounded-xl shadow-sm">
                            <Zap className="w-6 h-6 text-yellow-500" />
                        </div>
                        P2P File Transfer
                    </h2>
                    <p className="text-sm font-medium text-surface-500 mt-2 ml-1">Transfer files directly between devices — no server upload needed</p>
                </div>
                <div className="flex items-center gap-2 text-sm mt-4 md:mt-0 px-4 py-2 bg-green-50/80 text-green-700 rounded-full font-medium border border-green-100 shadow-sm backdrop-blur-sm">
                    <Shield className="w-4 h-4" />
                    <span>End-to-end encrypted</span>
                </div>
            </div>

            {/* Connection Section */}
            <div className="glass-card rounded-2xl animate-slide-up overflow-hidden">
                {!isConnected && connectionState !== 'waiting' ? (
                    <div className="p-8 text-center max-w-2xl mx-auto">
                        {!transferRole ? (
                            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                <button
                                    onClick={() => { setTransferRole('sender'); handleCreateRoom(); }}
                                    className="p-10 border border-surface-200 bg-white/50 backdrop-blur-sm rounded-3xl hover:border-brand-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center justify-center gap-5 group"
                                >
                                    <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                                        <Send className="w-12 h-12 text-brand-600 drop-shadow-sm" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-surface-900 group-hover:text-brand-700 transition-colors">Send</h3>
                                        <p className="text-sm text-surface-500 mt-2 max-w-[250px] mx-auto">Generate a secure code to instantly transmit files to another device.</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setTransferRole('receiver')}
                                    className="p-10 border border-surface-200 bg-white/50 backdrop-blur-sm rounded-3xl hover:border-teal-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center justify-center gap-5 group"
                                >
                                    <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                                        <Download className="w-12 h-12 text-teal-600 drop-shadow-sm" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-surface-900 group-hover:text-teal-700 transition-colors">Receive</h3>
                                        <p className="text-sm text-surface-500 mt-2 max-w-[250px] mx-auto">Enter a 6-digit access code from the sender to get files directly.</p>
                                    </div>
                                </button>
                            </div>
                        ) : transferRole === 'receiver' ? (
                            <div className="max-w-md mx-auto space-y-6 pt-6">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Smartphone className="w-10 h-10 text-teal-600 drop-shadow-sm" />
                                </div>
                                <h3 className="text-2xl font-bold text-surface-900">Receive Files</h3>
                                <p className="text-sm font-medium text-surface-500">Enter the 6-digit room code shown on the sending device</p>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={inputCode}
                                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="flex-1 px-4 py-4 bg-white/80 border border-surface-200 rounded-xl text-center text-3xl font-mono tracking-widest focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all shadow-inner text-surface-800 placeholder-surface-300"
                                    />
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={connectionState === 'joining' || inputCode.length !== 6}
                                        className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none min-w-[120px]"
                                    >
                                        {connectionState === 'joining' ? 'Joining...' : 'Join'}
                                    </button>
                                </div>
                                <button onClick={() => setTransferRole(null)} className="text-sm font-semibold text-surface-500 hover:text-surface-800 transition-colors pt-4">Start Over</button>
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
                    <div className="p-12 text-center space-y-6 relative z-10 bg-white/50 backdrop-blur-sm">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-100 to-brand-50 rounded-full flex items-center justify-center shadow-inner relative">
                            <div className="absolute inset-0 bg-brand-400 rounded-full animate-ping opacity-20"></div>
                            <Wifi className="w-12 h-12 text-brand-600 relative z-10" />
                        </div>
                        <div>
                            <p className="text-surface-600 mb-6 font-medium text-lg">Ready to send! Share this code with the receiver:</p>
                            <div className="inline-flex items-center gap-4 bg-gradient-to-br from-white to-surface-50 border-2 border-dashed border-brand-300 rounded-3xl px-12 py-6 shadow-sm">
                                <span className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-700 to-teal-600 tracking-[0.2em]">{roomCode}</span>
                                <button onClick={copyCode} className="p-3 ml-4 bg-white shadow-sm hover:shadow-md border border-surface-200 hover:border-brand-300 hover:bg-brand-50 rounded-2xl transition-all group">
                                    {copied ? <Check className="w-7 h-7 text-green-500" /> : <Copy className="w-7 h-7 text-brand-400 group-hover:text-brand-600" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-surface-400 mt-8">Waiting for the receiving device to connect to the local network...</p>
                        <button onClick={handleDisconnect} className="mt-6 px-8 py-3 bg-red-50 text-red-600 font-semibold hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors min-w-[200px]">
                            Cancel Transfer
                        </button>
                    </div>
                ) : (
                    /* Connected */
                    <div className="p-6 md:p-10 relative z-10 bg-white/50 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-surface-200">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shadow-inner border border-green-200/50">
                                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                                </div>
                                <div>
                                    <div className="text-sm text-surface-500 font-semibold mb-1 uppercase tracking-wide">
                                        {transferRole === 'sender' ? 'Connected to Receiver' : 'Connected to Sender'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold text-surface-900">{peerDevice?.deviceName || 'Unknown Device'}</span>
                                        <span className="px-2.5 py-1 bg-surface-100 text-surface-600 rounded-md text-xs font-mono font-medium border border-surface-200">Room: {roomCode}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleDisconnect} className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors min-w-[140px]">
                                <WifiOff className="w-5 h-5" />
                                Disconnect
                            </button>
                        </div>

                        {/* Send File Area (Only for Sender) */}
                        {transferRole === 'sender' && (
                            <div
                                className="border-2 border-dashed border-brand-300 bg-gradient-to-br from-brand-50/50 to-white rounded-3xl p-12 text-center hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleSendFile} multiple className="hidden" />
                                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-brand-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <Send className="w-10 h-10 text-brand-500 drop-shadow-sm" />
                                </div>
                                <h3 className="text-2xl font-bold text-surface-900 mb-2 group-hover:text-brand-700 transition-colors">Select files to send</h3>
                                <p className="text-surface-500 font-medium max-w-md mx-auto">Files are transferred securely at lightning speed over the local network.</p>
                            </div>
                        )}

                        {/* Receiving Area (Only for Receiver) */}
                        {transferRole === 'receiver' && (
                            <div className="text-center py-12 bg-gradient-to-br from-teal-50/50 to-white rounded-3xl border-2 border-dashed border-teal-300">
                                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-teal-100 flex items-center justify-center mb-6">
                                    <Download className="w-10 h-10 text-teal-500 animate-bounce drop-shadow-sm" />
                                </div>
                                <h3 className="text-2xl font-bold text-surface-900 mb-2">Ready to Receive</h3>
                                <p className="text-surface-500 font-medium">Waiting for the sender to transmit files...</p>
                            </div>
                        )}

                        {/* Transfer Progress Container */}
                        {transferProgress && (
                            <div className="mt-8 bg-white rounded-3xl p-8 border border-surface-200 shadow-lg relative overflow-hidden animate-slide-up">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-surface-100">
                                    <div className={`h-full ${transferProgress.direction === 'send' ? 'bg-gradient-to-r from-brand-500 to-blue-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'} transition-all duration-300 relative`} style={{ width: `${transferProgress.percentage}%` }}>
                                        <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/50 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-2 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${transferProgress.direction === 'send' ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'bg-teal-50 text-teal-600 border border-teal-100'} shadow-sm`}>
                                            <ArrowUpDown className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-surface-900 truncate max-w-[200px] sm:max-w-[300px]">{transferProgress.fileName}</div>
                                            <div className="text-sm text-surface-500 font-medium mt-1">{transferProgress.direction === 'send' ? 'Sending securely...' : 'Receiving securely...'}</div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right bg-surface-50 p-3 rounded-xl border border-surface-100">
                                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600">{transferProgress.percentage}%</div>
                                        <div className="text-sm text-surface-500 font-semibold mt-1">{formatSpeed(transferProgress.speed || 0)}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-surface-500 font-semibold bg-surface-50 border border-surface-100 rounded-xl p-3 px-4">
                                    <span>Transferred: <span className="text-surface-900">{formatSize(transferProgress.loaded)}</span></span>
                                    <span>Total: <span className="text-surface-900">{formatSize(transferProgress.total)}</span></span>
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
