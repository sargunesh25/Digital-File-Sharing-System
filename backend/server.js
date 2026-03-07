const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const authRoutes = require('./routers/auth.routes');
const fileRoutes = require('./routers/file.routes');
const userRoutes = require('./routers/user.routes');
const transferRoutes = require('./routers/transfer.routes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transfers', transferRoutes);

const db = require('./models');

// Basic Route
app.get('/', (req, res) => {
    res.send('DFS Backend is running!');
});

// ============ Socket.IO Signaling Server ============

// Room storage: { roomCode: { hostSocketId, peers: Set, hostDeviceName } }
const rooms = new Map();

function generateRoomCode() {
    return Math.floor(Math.random() * 1000000).toString();
}

io.on('connection', (socket) => {
    console.log(`[Socket] Peer connected: ${socket.id}`);

    // Create a new room
    socket.on('create-room', (data, callback) => {
        let roomCode = generateRoomCode();
        // Ensure uniqueness
        while (rooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        rooms.set(roomCode, {
            hostSocketId: socket.id,
            hostDeviceName: data?.deviceName || 'Unknown Device',
            peers: new Set([socket.id])
        });

        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.deviceName = data?.deviceName || 'Unknown Device';

        console.log(`[Socket] Room ${roomCode} created by ${socket.id}`);
        callback({ success: true, roomCode });
    });

    // Join an existing room
    socket.on('join-room', (data, callback) => {
        const { roomCode, deviceName } = data;
        const room = rooms.get(roomCode);

        if (!room) {
            return callback({ success: false, error: 'Room not found. Check the code and try again.' });
        }

        if (room.peers.size >= 2) {
            return callback({ success: false, error: 'Room is full. Only 2 devices can connect at a time.' });
        }

        room.peers.add(socket.id);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.deviceName = deviceName || 'Unknown Device';

        console.log(`[Socket] ${socket.id} joined room ${roomCode}`);

        // Notify host that a peer joined
        io.to(room.hostSocketId).emit('peer-joined', {
            peerId: socket.id,
            deviceName: socket.deviceName
        });

        callback({
            success: true,
            hostId: room.hostSocketId,
            hostDeviceName: room.hostDeviceName
        });
    });

    // WebRTC signaling: relay offer
    socket.on('offer', (data) => {
        console.log(`[Socket] Relaying offer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('offer', {
            offer: data.offer,
            sender: socket.id
        });
    });

    // WebRTC signaling: relay answer
    socket.on('answer', (data) => {
        console.log(`[Socket] Relaying answer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    // WebRTC signaling: relay ICE candidate
    socket.on('ice-candidate', (data) => {
        io.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`[Socket] Peer disconnected: ${socket.id}`);
        const roomCode = socket.roomCode;
        if (roomCode && rooms.has(roomCode)) {
            const room = rooms.get(roomCode);
            room.peers.delete(socket.id);

            // Notify remaining peers
            socket.to(roomCode).emit('peer-disconnected', {
                peerId: socket.id,
                deviceName: socket.deviceName
            });

            // Clean up empty rooms
            if (room.peers.size === 0) {
                rooms.delete(roomCode);
                console.log(`[Socket] Room ${roomCode} deleted (empty)`);
            }
        }
    });
});

// ============ Start Server ============

db.sequelize.authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
        // Sync all models (creates tables if they don't exist)
        return db.sequelize.sync({ alter: false });
    })
    .then(() => {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT} (all interfaces)`);
            console.log(`Socket.IO signaling server ready`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });
