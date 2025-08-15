const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000
});

// Debugging listeners
socket.on('connect', () => console.log('✅ Connected to server'));
socket.on('disconnect', () => console.log('❌ Disconnected from server'));
socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

const form = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const messageContainer = document.querySelector(".container");
const audio = new Audio('ting.mp3');

const append = (message, position) => {
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  messageElement.classList.add('message', position);
  messageContainer.append(messageElement);
  
  if(position === 'left') {
    audio.play();
  }
  
  // Auto-scroll to bottom
  messageContainer.scrollTop = messageContainer.scrollHeight;
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  
  if(message) {
    append(`You: ${message}`, 'right');
    socket.emit('send', message);
    messageInput.value = '';
  }
});

const name = prompt("Enter your name to join:");
if(name) {
  socket.emit('new-user-joined', name);
} else {
  alert("Name is required to join the chat");
  window.location.reload();
}

socket.on('currently-online', (onlineUsers) => {
  onlineUsers.forEach(user => {
    append(`${user} is online`, 'center');
  });
});

socket.on('user-joined', (name) => {
  append(`${name} joined the chat`, 'center');
});

socket.on('receive', (data) => {
  append(`${data.name}: ${data.message}`, 'left');
});

socket.on('left', (name) => {
  append(`${name} left the chat`, 'center');
});