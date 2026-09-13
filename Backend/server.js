const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const roomRoutes = require("./routes/roomRoutes");
const setupRoomSocket = require("./Socket/roomSocket");

dotenv.config();


connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

// Routes
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🎉 YouTube Watch Party API & WebSocket Server Running",
    endpoints: {
      createRoom: "POST /api/rooms/create",
      getRoom: "GET /api/rooms/:roomId",
      activeRooms: "GET /api/rooms/active",
    },
  });
});

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Setup Watch Party Real-time events
setupRoomSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(` Watch Party Server running on http://localhost:${PORT}`);
});
