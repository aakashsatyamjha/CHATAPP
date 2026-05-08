const express = require('express');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');

dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // We will set this in Render
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Connect to MongoDB
connectDB();

// ─── Socket.io ───────────────────────────────────────────────
const onlineUsers = new Map();

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'chat-app-super-secret-key-change-in-production'
    );
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.username}`);

  // Add to online users
  onlineUsers.set(socket.userId, {
    id: socket.userId,
    username: socket.username,
    socketId: socket.id,
  });
  userSockets.set(socket.userId, socket.id);
  io.emit('onlineUsers', Array.from(onlineUsers.values()));

  // Handle sending message
  socket.on('sendMessage', async (data) => {
    try {
      const { content, image, recipientId } = data;
      const newMessage = new Message({
        sender: socket.userId,
        senderName: socket.username,
        recipient: recipientId || null,
        content,
        image,
      });

      await newMessage.save();

      if (recipientId) {
        // Private message: emit only to sender and recipient
        const recipientSocketId = userSockets.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newMessage', newMessage);
        }
        // Also send back to the sender so they see their own message
        socket.emit('newMessage', newMessage);
      } else {
        // Public message: broadcast to all
        io.emit('newMessage', newMessage);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', () => {
    socket.broadcast.emit('userTyping', { username: socket.username });
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('userStopTyping', { username: socket.username });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.username}`);
    onlineUsers.delete(socket.userId);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
