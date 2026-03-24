import { io } from 'socket.io-client';

const rawSignalingUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
const SIGNALING_URL = rawSignalingUrl.replace(/\/$/, '');

class SignalingService {
    constructor() {
        this.socket = null;
        this.callbacks = {};
    }

    connect() {
        if (this.socket?.connected) return Promise.resolve();

        return new Promise((resolve, reject) => {
            this.socket = io(SIGNALING_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('[Signal] Connected:', this.socket.id);
                resolve();
            });

            this.socket.on('connect_error', (err) => {
                console.error('[Signal] Connection error:', err);
                reject(err);
            });

            // Relay events to callbacks
            this.socket.on('peer-joined', (data) => this._emit('peer-joined', data));
            this.socket.on('peer-disconnected', (data) => this._emit('peer-disconnected', data));
            this.socket.on('offer', (data) => this._emit('offer', data));
            this.socket.on('answer', (data) => this._emit('answer', data));
            this.socket.on('ice-candidate', (data) => this._emit('ice-candidate', data));
        });
    }

    createRoom(deviceName) {
        return new Promise((resolve, reject) => {
            this.socket.emit('create-room', { deviceName }, (response) => {
                if (response.success) {
                    resolve(response.roomCode);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    joinRoom(roomCode, deviceName) {
        return new Promise((resolve, reject) => {
            this.socket.emit('join-room', { roomCode, deviceName }, (response) => {
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
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.callbacks = {};
    }
}

const signalingService = new SignalingService();
export default signalingService;
