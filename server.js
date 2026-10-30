const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store messages and active users in memory
let messages = [];
let onlineUsers = new Set();

// Helper to get local network IP address
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API to get server connection details (useful for QR code generation)
app.get('/api/server-info', (req, res) => {
  const localIps = getLocalIpAddresses();
  res.json({
    port: PORT,
    publicUrl: process.env.PUBLIC_URL || null,
    localIps: localIps,
    recommendedLanUrl: localIps.length > 0 ? `http://${localIps[0]}:${PORT}/login` : null
  });
});

// Socket.IO real-time communications
io.on('connection', (socket) => {
  let currentUser = null;

  // Send current message list and stats to newly connected client/dashboard
  socket.emit('init_data', {
    messages: messages,
    onlineCount: onlineUsers.size
  });

  // When a user logs in from the mobile interface
  socket.on('user_login', (data) => {
    const username = (data && data.username ? data.username.trim() : '').slice(0, 50);
    if (username) {
      currentUser = username;
      onlineUsers.add(socket.id);
      
      // Notify all dashboards of new login activity
      io.emit('stats_update', {
        onlineCount: onlineUsers.size,
        lastActiveUser: username
      });
      
      socket.emit('login_success', { username });
    }
  });

  // When a user submits a message
  socket.on('send_message', (data) => {
    const username = (data && data.username ? data.username.trim() : (currentUser || 'ผู้เยี่ยมชม')).slice(0, 50);
    const text = (data && data.text ? data.text.trim() : '').slice(0, 1000);

    if (!text) {
      socket.emit('error_message', { message: 'กรุณากรอกข้อความก่อนส่ง' });
      return;
    }

    const newMessage = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6),
      username: username || 'ผู้เยี่ยมชม',
      text: text,
      timestamp: new Date().toISOString()
    };

    // Prepend to show latest first
    messages.unshift(newMessage);

    // Limit memory to latest 200 messages
    if (messages.length > 200) {
      messages = messages.slice(0, 200);
    }

    // Broadcast new message to all clients/dashboards
    io.emit('new_message', newMessage);

    // Confirm to sender
    socket.emit('send_success', { messageId: newMessage.id });
  });

  // When dashboard deletes a specific message
  socket.on('delete_message', (data) => {
    if (!data || !data.id) return;
    const initialLen = messages.length;
    messages = messages.filter((m) => m.id !== data.id);

    if (messages.length < initialLen) {
      io.emit('message_deleted', { id: data.id });
    }
  });

  // When dashboard clears all messages
  socket.on('clear_all_messages', () => {
    messages = [];
    io.emit('all_messages_cleared');
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    if (onlineUsers.has(socket.id)) {
      onlineUsers.delete(socket.id);
      io.emit('stats_update', {
        onlineCount: onlineUsers.size
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log('====================================================');
  console.log(`🚀 Dashboard Server started on port ${PORT}`);
  console.log(`💻 Dashboard URL: http://localhost:${PORT}`);
  if (localIps.length > 0) {
    console.log(`📱 Mobile Login URL (Local LAN): http://${localIps[0]}:${PORT}/login`);
  }
  console.log('====================================================');
});
