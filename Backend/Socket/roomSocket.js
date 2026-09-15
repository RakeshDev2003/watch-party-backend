const { roomManager } = require("./RoomManager");
const RoomModel = require("../Models/Room");

const persistRoom = async (room) => {
  try {
    if (!RoomModel) return;
    await RoomModel.findOneAndUpdate(
      { roomId: room.roomId },
      {
        roomId: room.roomId,
        title: room.title,
        hostId: room.hostId || "",
        currentVideoId: room.currentVideoId,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        lastUpdated: new Date(room.lastUpdated),
        participants: room.getAllParticipants(),
        chatMessages: room.chatMessages.slice(-100),
        isActive: room.participants.size > 0,
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (err) {
    console.warn(" MongoDB room persistence warning:", err.message);
  }
};

const setupRoomSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Helper to send error toast / modal to client
    const sendError = (message) => {
      socket.emit("error_event", { message });
    };

    /**
     * join_room
     * Payload: { roomId, username, userId }
     */
    socket.on("join_room", async ({ roomId, username, userId }) => {
      if (!roomId) {
        return sendError("Room ID is required to join.");
      }

      const cleanRoomId = roomId.trim().toLowerCase();
      let room = roomManager.getRoom(cleanRoomId);

      // If room not in memory, try loading from MongoDB
      if (!room) {
        try {
          if (RoomModel) {
            const dbRoom = await RoomModel.findOne({ roomId: cleanRoomId });
            if (dbRoom) {
              room = roomManager.getOrCreateRoom(cleanRoomId, dbRoom.title);
              room.hydrateFromDB(dbRoom);
            }
          }
        } catch (dbErr) {
          console.warn(" Error fetching room from MongoDB on join:", dbErr.message);
        }
      }

      // If still not created, initialize a new room
      if (!room) {
        room = roomManager.getOrCreateRoom(cleanRoomId);
      }

      // Add participant
      const participant = room.addParticipant(
        socket.id,
        userId || socket.id,
        username || "Guest"
      );

      // Join Socket.IO room channel
      socket.join(cleanRoomId);

      console.log(
        `👤 User "${participant.username}" (${participant.role}) joined room [${cleanRoomId}]`
      );

      // 1. Send initial sync_state to the joining client
      socket.emit("sync_state", room.getSyncPayload());

      // 2. Broadcast user_joined & updated sync_state to all clients in the room
      io.to(cleanRoomId).emit("user_joined", {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
        participants: room.getAllParticipants(),
      });
      io.to(cleanRoomId).emit("sync_state", room.getSyncPayload());

      // Send recent chat messages if any
      if (room.chatMessages.length > 0) {
        socket.emit("chat_history", room.chatMessages);
      }

      persistRoom(room);
    });

    /**
     * play
     * Requires: Host or Moderator
     */
    socket.on("play", ({ roomId, currentTime }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      if (!room.canControlPlayback(socket.id)) {
        return sendError("Permission denied: Only Host or Moderator can play video.");
      }

      const time = typeof currentTime === "number" ? currentTime : room.currentTime;
      room.updatePlayback(true, time);

      console.log(`▶️ Play in room [${roomId}] at ${time}s by ${socket.id}`);

      // Broadcast sync_state
      io.to(room.roomId).emit("sync_state", room.getSyncPayload());
      io.to(room.roomId).emit("play", { currentTime: time });

      persistRoom(room);
    });

    /**
     * pause
     * Requires: Host or Moderator
     */
    socket.on("pause", ({ roomId, currentTime }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      if (!room.canControlPlayback(socket.id)) {
        return sendError("Permission denied: Only Host or Moderator can pause video.");
      }

      const time = typeof currentTime === "number" ? currentTime : room.currentTime;
      room.updatePlayback(false, time);

      console.log(`⏸️ Pause in room [${roomId}] at ${time}s by ${socket.id}`);

      // Broadcast sync_state
      io.to(room.roomId).emit("sync_state", room.getSyncPayload());
      io.to(room.roomId).emit("pause", { currentTime: time });

      persistRoom(room);
    });

    /**
     * seek
     * Requires: Host or Moderator
     * Payload: { roomId, time }
     */
    socket.on("seek", ({ roomId, time }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      if (!room.canControlPlayback(socket.id)) {
        return sendError("Permission denied: Only Host or Moderator can seek video.");
      }

      const seekTime = Math.max(0, Number(time) || 0);
      room.updatePlayback(room.isPlaying, seekTime);

      console.log(`⏩ Seek in room [${roomId}] to ${seekTime}s by ${socket.id}`);

      io.to(room.roomId).emit("seek", { time: seekTime });
      io.to(room.roomId).emit("sync_state", room.getSyncPayload());

      persistRoom(room);
    });

    /**
     * request_sync
     * Allows any participant/client to request the latest accurate room playback state
     */
    socket.on("request_sync", ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (room) {
        socket.emit("sync_state", room.getSyncPayload());
      }
    });

    /**
     * sync_playback
     * Periodic heartbeat from host/moderator to keep server calculated live timestamp accurate
     */
    socket.on("sync_playback", ({ roomId, currentTime, isPlaying }) => {
      const room = roomManager.getRoom(roomId);
      if (room && room.canControlPlayback(socket.id)) {
        if (typeof isPlaying === "boolean" || typeof currentTime === "number") {
          room.updatePlayback(isPlaying, currentTime);
        }
      }
    });

    /**
     * change_video
     * Requires: Host or Moderator
     * Payload: { roomId, videoId }
     */
    socket.on("change_video", ({ roomId, videoId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      if (!room.canControlPlayback(socket.id)) {
        return sendError("Permission denied: Only Host or Moderator can change video.");
      }

      if (!videoId) return sendError("Invalid YouTube Video ID.");

      room.updatePlayback(true, 0, videoId.trim());

      console.log(`🎬 Video changed in room [${roomId}] to ${videoId}`);

      io.to(room.roomId).emit("change_video", { videoId: room.currentVideoId });
      io.to(room.roomId).emit("sync_state", room.getSyncPayload());

      // System announcement in chat
      const sender = room.getParticipant(socket.id);
      const systemMsg = room.addMessage(
        null,
        `🎬 ${sender ? sender.username : "A moderator"} changed the video.`
      );
      io.to(room.roomId).emit("chat_message", systemMsg);

      persistRoom(room);
    });

    /**
     * assign_role
     * Requires: Host only
     * Payload: { roomId, userId, role }
     */
    socket.on("assign_role", ({ roomId, userId, role }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      try {
        const updatedTarget = room.assignRole(socket.id, userId, role);

        console.log(
          `🛡️ Role updated in [${roomId}]: ${updatedTarget.username} is now ${role}`
        );

        io.to(room.roomId).emit("role_assigned", {
          userId: updatedTarget.userId,
          username: updatedTarget.username,
          role: updatedTarget.role,
          participants: room.getAllParticipants(),
        });

        const sysMsg = room.addMessage(
          null,
          `🛡️ ${updatedTarget.username} was assigned the role: ${role}`
        );
        io.to(room.roomId).emit("chat_message", sysMsg);

        persistRoom(room);
      } catch (err) {
        sendError(err.message);
      }
    });

    /**
     * transfer_host
     * Requires: Host only
     * Payload: { roomId, userId }
     */
    socket.on("transfer_host", ({ roomId, userId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      try {
        const { oldHost, newHost } = room.transferHost(socket.id, userId);

        console.log(
          `👑 Host transferred in [${roomId}] from ${oldHost.username} to ${newHost.username}`
        );

        io.to(room.roomId).emit("role_assigned", {
          userId: newHost.userId,
          username: newHost.username,
          role: "Host",
          oldHostUserId: oldHost.userId,
          oldHostUsername: oldHost.username,
          participants: room.getAllParticipants(),
        });

        io.to(room.roomId).emit("sync_state", room.getSyncPayload());

        const sysMsg = room.addMessage(
          null,
          `👑 ${oldHost.username} transferred host role to ${newHost.username}.`
        );
        io.to(room.roomId).emit("chat_message", sysMsg);

        persistRoom(room);
      } catch (err) {
        sendError(err.message);
      }
    });

    /**
     * remove_participant (Kick)
     * Requires: Host only
     * Payload: { roomId, userId }
     */
    socket.on("remove_participant", ({ roomId, userId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return sendError("Room not found.");

      if (!room.isHost(socket.id)) {
        return sendError("Unauthorized: Only the Host can remove participants.");
      }

      const target = room.getParticipantByUserId(userId);
      if (!target) return sendError("Participant not found.");

      if (target.role === "Host") {
        return sendError("Cannot remove the room Host.");
      }

      const targetSocketId = target.socketId;
      const targetUsername = target.username;
      const targetUserId = target.userId;

      room.removeParticipant(targetSocketId);

      // Emit directly to kicked user
      io.to(targetSocketId).emit("participant_removed", {
        kicked: true,
        message: "You have been removed from the watch party by the host.",
      });

      // Disconnect socket from room channel
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(room.roomId);
      }

      // Broadcast update to remaining participants
      io.to(room.roomId).emit("participant_removed", {
        userId: targetUserId,
        username: targetUsername,
        participants: room.getAllParticipants(),
      });

      const sysMsg = room.addMessage(
        null,
        `🚫 ${targetUsername} was removed from the room by the host.`
      );
      io.to(room.roomId).emit("chat_message", sysMsg);

      persistRoom(room);
    });

    /**
     * send_message (Live Chat)
     * Payload: { roomId, text }
     */
    socket.on("send_message", ({ roomId, text }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      if (!text || !text.trim()) return;

      const message = room.addMessage(socket.id, text);
      io.to(room.roomId).emit("chat_message", message);

      persistRoom(room);
    });

    /**
     * send_reaction (Floating Emoji Reaction)
     * Payload: { roomId, emoji }
     */
    socket.on("send_reaction", ({ roomId, emoji }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const sender = room.getParticipant(socket.id);
      io.to(room.roomId).emit("reaction", {
        id: "react_" + Date.now() + "_" + Math.random(),
        emoji: emoji || "❤️",
        username: sender ? sender.username : "Someone",
      });
    });

    /**
     * leave_room
     * Payload: { roomId }
     */
    socket.on("leave_room", async ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const participant = room.removeParticipant(socket.id);
      socket.leave(room.roomId);

      if (participant) {
        console.log(`👋 User "${participant.username}" left room [${room.roomId}]`);
        io.to(room.roomId).emit("user_left", {
          userId: participant.userId,
          username: participant.username,
          participants: room.getAllParticipants(),
        });
      }

      await persistRoom(room);
      if (room.participants.size === 0) {
        roomManager.deleteRoom(room.roomId);
      }
    });

    /**
     * disconnect
     */
    socket.on("disconnect", async () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      const room = roomManager.findRoomBySocketId(socket.id);
      if (room) {
        const participant = room.removeParticipant(socket.id);
        if (participant) {
          io.to(room.roomId).emit("user_left", {
            userId: participant.userId,
            username: participant.username,
            participants: room.getAllParticipants(),
          });
        }

        await persistRoom(room);
        if (room.participants.size === 0) {
          roomManager.deleteRoom(room.roomId);
        }
      }
    });
  });
};

module.exports = setupRoomSocket;
