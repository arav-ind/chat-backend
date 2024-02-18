const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const {notFound, errorHandler} = require('./middleware/errorHandlers');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();
connectDB();

const app = express();

app.use(cors(
  {credentials: true, origin: true}
));  
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
    res.send('API is running!');
});


app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);


app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running at PORT ${PORT}`));

// Socket Implementation
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
      origin: 'http://localhost:3000',
      // credentials: true,
    },
  });
  
  io.on('connection', (socket) => {
    console.log('Connected to socket.io');
    socket.on('setup', (userData) => {
      const id = JSON.parse(userData)?._id
      socket.join(id);
      socket.emit('connected');
    });
  
    socket.on('join chat', (room) => {
      socket.join(room);
      console.log('User Joined Room: ' + room);
    });
    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));
  
    socket.on('new message', (newMessageRecieved) => {
      const chat = newMessageRecieved.chat;
  
      if (!chat.users) return console.log('chat.users not defined');
  
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
  
        socket.in(user._id).emit('message received', newMessageRecieved);
      });
    });
  
    socket.off('setup', () => {
      console.log('USER DISCONNECTED');
      socket.leave(userData._id);
    });
  });