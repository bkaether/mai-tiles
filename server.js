const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

function getRandomTile() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
}

function generateInitialTiles() {
  const tiles = [];
  for (let i = 0; i < 21; i++) {
    tiles.push(getRandomTile());
  }
  return tiles;
}

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.emit('initial-tiles', generateInitialTiles());

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('peel', () => {
    const newTile = getRandomTile();
    io.emit('new-tile', newTile);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
