import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Serve compiled client assets
app.use(express.static(path.join(__dirname, "client/dist")));
// Serve raw resources (sprites, audio, backgrounds)
app.use("/resources", express.static(path.join(__dirname, "client/resources")));
app.use(
  "/assets/resources",
  express.static(path.join(__dirname, "client/resources")),
);

// In-memory active room storage
const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function findRoomBySocket(socketId) {
  for (const [code, room] of rooms.entries()) {
    if (room.host === socketId || room.guest === socketId) {
      return { code, room };
    }
  }
  return null;
}

io.on("connection", (socket) => {
  // 1. Create Room
  socket.on("create-room", () => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = {
      code,
      host: socket.id,
      guest: null,
      fighters: { host: null, guest: null },
      ready: { host: false, guest: false },
      rematch: { host: false, guest: false },
    };

    rooms.set(code, room);
    socket.join(code);
    socket.emit("room-created", { roomCode: code, role: "host" });
  });

  // 2. Join Room
  socket.on("join-room", (rawCode) => {
    const code = String(rawCode || "")
      .trim()
      .toUpperCase();
    if (!code || !rooms.has(code)) {
      socket.emit(
        "room-error",
        "Room not found. Please verify the 5-character code.",
      );
      return;
    }

    const room = rooms.get(code);
    if (room.guest) {
      socket.emit("room-error", "Room is already full (2/2 players).");
      return;
    }

    room.guest = socket.id;
    socket.join(code);
    socket.emit("room-joined", { roomCode: code, role: "guest" });
    io.to(code).emit("room-ready", {
      roomCode: code,
      host: room.host,
      guest: room.guest,
    });
  });

  // 3. Select Fighter
  socket.on("select-fighter", (data) => {
    const { roomCode, fighter, role } = data || {};
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    if (room.fighters) {
      room.fighters[role] = fighter;
    }

    socket.to(roomCode).emit("opponent-selected-fighter", { fighter, role });
  });

  // 4. Player Ready
  socket.on("player-ready", (data) => {
    const { roomCode, role } = data || {};
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    room.ready[role] = true;
    socket.to(roomCode).emit("opponent-ready", { role });

    if (room.ready.host && room.ready.guest) {
      room.ready.host = false;
      room.ready.guest = false;
      io.to(roomCode).emit("game-start", {
        fighters: [room.fighters.host, room.fighters.guest],
        countdownMs: 3000,
      });
    }
  });

  // 5. Input Relay
  socket.on("player-input", (data) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    socket.to(roomCode).emit("opponent-input", data);
  });

  // 6. State Sync
  socket.on("sync-state", (data) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    socket.to(roomCode).emit("opponent-sync-state", data);
  });

  // 7. Rematch Request
  socket.on("rematch", (data) => {
    const { roomCode, role } = data || {};
    if (!roomCode || !rooms.has(roomCode)) return;

    const room = rooms.get(roomCode);
    room.rematch[role] = true;
    socket.to(roomCode).emit("opponent-rematch-requested", { role });

    if (room.rematch.host && room.rematch.guest) {
      room.rematch.host = false;
      room.rematch.guest = false;
      io.to(roomCode).emit("rematch-start");
    }
  });

  // 8. Leave Room
  socket.on("leave-room", (data) => {
    const { roomCode } = data || {};
    if (!roomCode) return;
    socket.to(roomCode).emit("opponent-disconnected");
    socket.leave(roomCode);
    rooms.delete(roomCode);
  });

  // 9. Disconnect Cleanup
  socket.on("disconnect", () => {
    const found = findRoomBySocket(socket.id);
    if (found) {
      socket.to(found.code).emit("opponent-disconnected");
      rooms.delete(found.code);
    }
  });
});

// SPA fallback route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Arena Clash Server] Running on http://0.0.0.0:${PORT}`);
});
