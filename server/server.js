const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoomState(roomCode) {
  return {
    roomId: roomCode,
    roomCode,
    players: [],
    player1: null,
    player2: null,
    boxes: [3, 5, 7],
    currentPlayer: 1,
    gameStarted: false,
    winner: null,
    restartRequests: [],
    playAgainVotes: [],
    status: 'waiting'
  };
}

function getRoomPayload(room) {
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    players: room.players.map((player) => ({
      id: player.socketId,
      playerNumber: player.playerNumber,
      isHost: player.isHost,
      name: player.name
    })),
    player1: room.player1 ? {
      id: room.player1.socketId,
      playerNumber: room.player1.playerNumber,
      isHost: room.player1.isHost,
      name: room.player1.name
    } : null,
    player2: room.player2 ? {
      id: room.player2.socketId,
      playerNumber: room.player2.playerNumber,
      isHost: room.player2.isHost,
      name: room.player2.name
    } : null,
    boxes: room.boxes,
    currentPlayer: room.currentPlayer,
    gameStarted: room.gameStarted,
    winner: room.winner,
    status: room.status,
    playAgainVotes: room.playAgainVotes
  };
}

function broadcastRoom(room, event, payload) {
  if (!room) return;
  const roomSockets = room.players.map((player) => player.socketId);
  if (roomSockets.length) {
    io.to(roomSockets).emit(event, payload);
  }
}

function emitGameStart(room) {
  const payload = {
    roomCode: room.roomCode,
    room: getRoomPayload(room)
  };
  room.players.forEach((player) => {
    io.to(player.socketId).emit('game-start', {
      ...payload,
      playerNumber: player.playerNumber
    });
  });
}

function buildGameOverPayload(room) {
  const winnerPlayer = room.players.find((player) => player.playerNumber === room.winner);
  const loserPlayer = room.players.find((player) => player.playerNumber !== room.winner);
  return {
    winnerId: winnerPlayer?.socketId || null,
    winnerName: winnerPlayer?.name || `Player ${room.winner}`,
    loserId: loserPlayer?.socketId || null,
    loserName: loserPlayer?.name || `Player ${3 - room.winner}`,
    winner: room.winner,
    boxes: room.boxes,
    status: room.status
  };
}

function resetRoomBoard(room) {
  room.boxes = [3, 5, 7];
  room.currentPlayer = 1;
  room.winner = null;
  room.restartRequests = [];
  room.playAgainVotes = [];
  room.status = 'playing';
  room.gameStarted = true;
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ name = 'Player' } = {}) => {
    const roomCode = generateRoomCode();
    const room = createRoomState(roomCode);
    const host = {
      socketId: socket.id,
      name,
      isHost: true,
      playerNumber: 1
    };
    room.players.push(host);
    room.player1 = host;
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerNumber = 1;
    socket.emit('room-created', {
      roomCode,
      playerNumber: 1,
      isHost: true,
      room: getRoomPayload(room)
    });
    socket.emit('room-joined', {
      roomCode,
      playerNumber: 1,
      isHost: true,
      room: getRoomPayload(room)
    });
  });

  socket.on('join-room', ({ roomCode, name = 'Player' } = {}) => {
    const normalizedCode = roomCode?.toUpperCase();
    const room = rooms.get(normalizedCode);
    if (!room) {
      socket.emit('room-error', 'Room not found.');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('room-error', 'Room is full.');
      return;
    }

    const playerNumber = room.players.length + 1;
    const player = {
      socketId: socket.id,
      name,
      isHost: false,
      playerNumber
    };
    room.players.push(player);
    if (playerNumber === 1) {
      room.player1 = player;
    } else {
      room.player2 = player;
    }
    socket.join(normalizedCode);
    socket.data.roomCode = normalizedCode;
    socket.data.playerNumber = playerNumber;

    socket.emit('room-joined', {
      roomCode: room.roomCode,
      playerNumber,
      isHost: false,
      room: getRoomPayload(room)
    });

    broadcastRoom(room, 'player-joined', {
      roomCode: room.roomCode,
      playerNumber,
      room: getRoomPayload(room)
    });

    if (room.players.length < 2) {
      room.status = 'waiting';
      room.gameStarted = false;
      return;
    }

    room.status = 'playing';
    room.gameStarted = true;
    room.boxes = [3, 5, 7];
    room.currentPlayer = 1;
    room.winner = null;
    room.restartRequests = [];
    room.playAgainVotes = [];
    emitGameStart(room);
  });

  socket.on('move', ({ roomCode, selectedMap = {} }) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return;
    const player = room.players.find((item) => item.socketId === socket.id);
    if (!player) return;

    if (!room.gameStarted) {
      socket.emit('room-error', 'The game has not started yet.');
      return;
    }

    if (room.winner) {
      socket.emit('room-error', 'The game is already over.');
      return;
    }

    if (player.playerNumber !== room.currentPlayer) {
      socket.emit('room-error', 'It is not your turn.');
      return;
    }

    const keys = Object.keys(selectedMap);
    if (keys.length === 0) {
      socket.emit('room-error', 'Please select at least one coin.');
      return;
    }

    const boxIndex = parseInt(keys[0].split('-')[0], 10);
    if (!keys.every((key) => parseInt(key.split('-')[0], 10) === boxIndex)) {
      socket.emit('room-error', 'Select coins from only one box.');
      return;
    }

    const removeCount = keys.length;
    if (removeCount > room.boxes[boxIndex]) {
      socket.emit('room-error', 'That move is not valid.');
      return;
    }

    const nextBoard = [...room.boxes];
    nextBoard[boxIndex] = Math.max(0, nextBoard[boxIndex] - removeCount);
    room.boxes = nextBoard;

    const total = nextBoard.reduce((sum, value) => sum + value, 0);
    if (total === 1) {
      room.winner = room.currentPlayer;
      room.status = 'finished';
    } else if (total === 0) {
      room.winner = 3 - room.currentPlayer;
      room.status = 'finished';
    } else {
      room.currentPlayer = 3 - room.currentPlayer;
      room.status = 'playing';
    }

    const overPayload = room.winner ? buildGameOverPayload(room) : {};

    broadcastRoom(room, 'board-update', {
      roomCode: room.roomCode,
      boxes: room.boxes,
      currentPlayer: room.currentPlayer,
      winner: room.winner,
      status: room.status,
      ...overPayload
    });

    broadcastRoom(room, 'turn-update', {
      roomCode: room.roomCode,
      currentPlayer: room.currentPlayer,
      winner: room.winner,
      status: room.status,
      ...overPayload
    });

    if (room.winner) {
      broadcastRoom(room, 'game-over', {
        roomCode: room.roomCode,
        ...overPayload
      });
    }
  });

  socket.on('play-again', ({ roomCode }) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return;
    const player = room.players.find((item) => item.socketId === socket.id);
    if (!player) return;

    if (!room.playAgainVotes.includes(player.playerNumber)) {
      room.playAgainVotes.push(player.playerNumber);
    }

    const otherPlayer = room.players.find((item) => item.playerNumber !== player.playerNumber);
    if (room.playAgainVotes.length === 1) {
      if (otherPlayer) {
        io.to(otherPlayer.socketId).emit('play-again-request', {
          roomCode: room.roomCode,
          message: 'Opponent wants to play again.'
        });
      }
      return;
    }

    if (room.playAgainVotes.length >= 2) {
      resetRoomBoard(room);
      broadcastRoom(room, 'game-reset', {
        roomCode: room.roomCode,
        boxes: room.boxes,
        currentPlayer: room.currentPlayer,
        gameOver: false,
        winner: null,
        status: room.status
      });
    }
  });

  socket.on('restart-rejected', ({ roomCode }) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return;
    broadcastRoom(room, 'restart-rejected', {
      roomCode: room.roomCode,
      message: 'Restart was rejected.'
    });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter((player) => player.socketId !== socket.id);
    if (room.player1?.socketId === socket.id) {
      room.player1 = null;
    }
    if (room.player2?.socketId === socket.id) {
      room.player2 = null;
    }
    if (room.players.length === 0) {
      rooms.delete(roomCode);
      return;
    }

    if (room.players.length === 1) {
      room.players[0].isHost = true;
      room.players[0].playerNumber = 1;
      room.player1 = room.players[0];
      room.player2 = null;
      room.status = 'waiting';
      room.gameStarted = false;
      room.currentPlayer = 1;
      room.winner = null;
      room.boxes = [3, 5, 7];
      room.restartRequests = [];
      room.playAgainVotes = [];
    }

    broadcastRoom(room, 'player-disconnected', {
      roomCode: room.roomCode,
      message: 'Opponent disconnected.'
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
