const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  },
});

// --- State ---
let currentPoll = null; 
let pollHistory = []; 
let users = []; 
let timerInterval = null;

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. JOIN USER
  socket.on('join_user', ({ name, role }) => {
    // Remove if user already exists
    users = users.filter(u => u.id !== socket.id); 
    users.push({ id: socket.id, name, role });
    
    // Broadcast updated user list
    io.emit('update_users', users);
    
    // If a poll is currently running, send it to the new user
    if (currentPoll && currentPoll.isActive) {
      socket.emit('new_poll', currentPoll);
      socket.emit('timer_update', currentPoll.timeLeft);
    }
  });

  // 2. CREATE POLL
  socket.on('create_poll', (pollData) => {
    // Safety: If a poll is running and we force create a new one, archive the old one
    if(currentPoll) {
        pollHistory.push({...currentPoll, isActive: false});
    }
    
    clearInterval(timerInterval);

    currentPoll = {
      ...pollData, 
      id: Date.now(),
      options: pollData.options.map((opt, idx) => ({ 
        id: idx, 
        text: opt, 
        count: 0 
      })),
      isActive: true,
      timeLeft: pollData.duration,
      totalVotes: 0
    };

    io.emit('new_poll', currentPoll);

    // Start Timer
    timerInterval = setInterval(() => {
      if (currentPoll && currentPoll.timeLeft > 0) {
        currentPoll.timeLeft--;
        io.emit('timer_update', currentPoll.timeLeft);
      } else {
        // Time Up Logic
        clearInterval(timerInterval);
        if(currentPoll) {
            currentPoll.isActive = false;
            io.emit('poll_ended', currentPoll);
            
            // Save to history
            pollHistory.push({...currentPoll});
            
            // Reset currentPoll so students see "Wait" message
            currentPoll = null; 
        }
      }
    }, 1000);
  });

  // 3. STOP POLL (Crucial for "Finish Early" / Manual Stop)
  socket.on('stop_poll', () => {
    if (currentPoll && currentPoll.isActive) {
        clearInterval(timerInterval);
        currentPoll.isActive = false;
        
        io.emit('poll_ended', currentPoll);
        pollHistory.push({...currentPoll}); // Save to history immediately
        
        currentPoll = null; 
    }
  });

  // 4. SUBMIT VOTE
  socket.on('submit_vote', (optionId) => {
    if (currentPoll && currentPoll.isActive) {
      const option = currentPoll.options.find(o => o.id === optionId);
      if (option) {
        option.count++;
        currentPoll.totalVotes++;
        io.emit('update_results', currentPoll);
      }
    }
  });

  // 5. FETCH HISTORY
  socket.on('get_history', () => {
    socket.emit('history_data', pollHistory);
  });

  // 6. CHAT
  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  // 7. KICK USER
  socket.on('kick_user', (socketId) => {
    io.to(socketId).emit('kicked');
    io.sockets.sockets.get(socketId)?.disconnect(true);
    users = users.filter(u => u.id !== socketId);
    io.emit('update_users', users);
  });

  // 8. DISCONNECT
  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit('update_users', users);
  });
});

app.get("/", (req, res) => {
  res.send("LivePolling backend is running 🚀");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));