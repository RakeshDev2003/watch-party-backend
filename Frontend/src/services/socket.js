import { io } from "socket.io-client";

// Robust backend URL resolution for localhost, 127.0.0.1, LAN IPs, and production
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  const hostname = window.location.hostname || "localhost";
  // In development (when running frontend on Vite port 5173 etc)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    window.location.port === "5173" ||
    window.location.port === "3000"
  ) {
    return `http://${hostname}:5000`;
  }
  return window.location.origin;
};

const BACKEND_URL = getBackendUrl();
console.log("🔗 Socket.IO Connecting to:", BACKEND_URL);

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket || this.socket.disconnected) {
      if (this.socket) {
        this.socket.disconnect();
      }
      this.socket = io(BACKEND_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 500,
        timeout: 10000,
      });

      this.socket.on("connect", () => {
        console.log("🟢 Socket.IO Connected successfully! ID:", this.socket.id);
      });

      this.socket.on("connect_error", (err) => {
        console.warn("🔴 Socket.IO Connection Error:", err.message, "Target:", BACKEND_URL);
      });
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emitter Helpers
  joinRoom(roomId, username, userId) {
    console.log(`📤 Emitting join_room: [${roomId}] as "${username}" (UID: ${userId})`);
    this.getSocket().emit("join_room", { roomId, username, userId });
  }

  leaveRoom(roomId) {
    this.getSocket().emit("leave_room", { roomId });
  }

  sendPlay(roomId, currentTime) {
    this.getSocket().emit("play", { roomId, currentTime });
  }

  sendPause(roomId, currentTime) {
    this.getSocket().emit("pause", { roomId, currentTime });
  }

  sendSeek(roomId, time) {
    this.getSocket().emit("seek", { roomId, time });
  }

  sendChangeVideo(roomId, videoId) {
    this.getSocket().emit("change_video", { roomId, videoId });
  }

  assignRole(roomId, userId, role) {
    this.getSocket().emit("assign_role", { roomId, userId, role });
  }

  removeParticipant(roomId, userId) {
    this.getSocket().emit("remove_participant", { roomId, userId });
  }

  transferHost(roomId, userId) {
    this.getSocket().emit("transfer_host", { roomId, userId });
  }

  sendMessage(roomId, text) {
    this.getSocket().emit("send_message", { roomId, text });
  }

  sendReaction(roomId, emoji) {
    this.getSocket().emit("send_reaction", { roomId, emoji });
  }
}

const socketService = new SocketService();
export default socketService;
export { BACKEND_URL };
