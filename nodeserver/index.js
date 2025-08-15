const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '../')));

// Serve Socket.IO client library
app.get('/socket.io/socket.io.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(
    path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.js')
  );
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 8000;

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

const users = {};

io.on('connection', socket => {
  console.log('A user connected');
  
  socket.on('new-user-joined', name => {
    console.log(`${name} joined the chat`);
    users[socket.id] = name;
    socket.broadcast.emit('user-joined', name);
    
    // Send list of online users (excluding current user)
    const otherUsers = Object.values(users).filter(n => n !== name);
    socket.emit('currently-online', otherUsers);
  });

  socket.on('send', message => {
    socket.broadcast.emit('receive', {
      message: message,
      name: users[socket.id],
    });
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      socket.broadcast.emit('left', users[socket.id]);
      delete users[socket.id];
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).send('Something went wrong!');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});