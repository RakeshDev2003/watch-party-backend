class Participant {
  constructor(socketId, userId, username, role = "Participant") {
    this.socketId = socketId;
    this.userId = userId || socketId;
    this.username = username || "Anonymous";
    this.role = role; // 'Host' | 'Moderator' | 'Participant'
    this.joinedAt = new Date();
  }

  toJSON() {
    return {
      socketId: this.socketId,
      userId: this.userId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}

class Room {
  constructor(roomId, title = "Watch Party") {
    this.roomId = roomId;
    this.title = title;
    this.currentVideoId = "nSDgHBxUbVQ"; // Default: Photograph — Ed Sheeran
    this.isPlaying = false;
    this.currentTime = 0;
    this.lastUpdated = Date.now();
    this.hostId = null;
    this.participants = new Map(); // socketId -> Participant
    this.chatMessages = [];
  }

  addParticipant(socketId, userId, username) {
    const hasHost = Array.from(this.participants.values()).some((p) => p.role === "Host");
    const isFirst = this.participants.size === 0 || !hasHost;
    const role = isFirst ? "Host" : "Participant";

    const participant = new Participant(socketId, userId || socketId, username, role);
    this.participants.set(socketId, participant);

    if (isFirst) {
      this.hostId = participant.userId;
    }

    return participant;
  }

  /**
   * Remove a participant. If the host leaves, automatically promote the next moderator or oldest participant.
   */
  removeParticipant(socketId) {
    const participant = this.participants.get(socketId);
    if (!participant) return null;

    const wasHost = participant.role === "Host";
    this.participants.delete(socketId);

    if (wasHost && this.participants.size > 0) {
      // Find a moderator first, or fallback to first participant
      let nextHost = Array.from(this.participants.values()).find(
        (p) => p.role === "Moderator"
      );
      if (!nextHost) {
        nextHost = Array.from(this.participants.values())[0];
      }
      if (nextHost) {
        nextHost.role = "Host";
        this.hostId = nextHost.userId;
      }
    }

    return participant;
  }

  getParticipant(socketId) {
    return this.participants.get(socketId);
  }

  getParticipantByUserId(userId) {
    for (const participant of this.participants.values()) {
      if (participant.userId === userId || participant.socketId === userId) {
        return participant;
      }
    }
    return null;
  }

  getAllParticipants() {
    return Array.from(this.participants.values()).map((p) => p.toJSON());
  }

  /**
   * Checks if user has permission to control playback (Host or Moderator)
   */
  canControlPlayback(socketId) {
    const participant = this.participants.get(socketId);
    if (!participant) return false;
    return participant.role === "Host" || participant.role === "Moderator";
  }

  /**
   * Checks if user is the Room Host
   */
  isHost(socketId) {
    const participant = this.participants.get(socketId);
    return participant ? participant.role === "Host" : false;
  }

  /**
   * Assigns role (Only Host can perform this)
   */
  assignRole(requesterSocketId, targetUserId, newRole) {
    if (!this.isHost(requesterSocketId)) {
      throw new Error("Unauthorized: Only the Host can assign roles.");
    }

    if (!["Moderator", "Participant", "Viewer"].includes(newRole)) {
      throw new Error("Invalid role specified.");
    }

    const target = this.getParticipantByUserId(targetUserId);
    if (!target) {
      throw new Error("Target user not found in room.");
    }

    if (target.role === "Host") {
      throw new Error("Cannot change role of current Host directly. Use transfer host instead.");
    }

    target.role = newRole;
    return target;
  }

  /**
   * Transfers Host role to another participant
   */
  transferHost(requesterSocketId, targetUserId) {
    if (!this.isHost(requesterSocketId)) {
      throw new Error("Unauthorized: Only the Host can transfer host permissions.");
    }

    const requester = this.participants.get(requesterSocketId);
    const target = this.getParticipantByUserId(targetUserId);

    if (!target) {
      throw new Error("Target user not found.");
    }

    requester.role = "Moderator";
    target.role = "Host";
    this.hostId = target.userId;

    return { oldHost: requester, newHost: target };
  }

  /**
   * Updates playback state
   */
  updatePlayback(playState, currentTime, videoId) {
    if (typeof playState === "boolean") {
      this.isPlaying = playState;
    }
    if (typeof currentTime === "number" && !isNaN(currentTime)) {
      this.currentTime = Math.max(0, currentTime);
    }
    if (videoId && typeof videoId === "string") {
      this.currentVideoId = videoId;
    }
    this.lastUpdated = Date.now();
  }

  /**
   * Calculate current projected playback time based on elapsed time if playing
   */
  getEstimatedCurrentTime() {
    if (!this.isPlaying) {
      return this.currentTime;
    }
    const elapsedSeconds = (Date.now() - this.lastUpdated) / 1000;
    return this.currentTime + elapsedSeconds;
  }

  /**
   * Get full state payload for syncing clients
   */
  getSyncPayload() {
    return {
      roomId: this.roomId,
      title: this.title,
      videoId: this.currentVideoId,
      isPlaying: this.isPlaying,
      currentTime: this.getEstimatedCurrentTime(),
      rawCurrentTime: this.currentTime,
      lastUpdated: this.lastUpdated,
      hostId: this.hostId,
      participants: this.getAllParticipants(),
    };
  }

  /**
   * Add a chat message
   */
  addMessage(socketId, text) {
    const sender = this.participants.get(socketId);
    const message = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      userId: sender ? sender.userId : "system",
      username: sender ? sender.username : "System",
      role: sender ? sender.role : "System",
      text: (text || "").trim(),
      timestamp: new Date().toISOString(),
    };

    this.chatMessages.push(message);
    if (this.chatMessages.length > 100) {
      this.chatMessages.shift(); // keep last 100
    }
    return message;
  }

  /**
   * Hydrate room state from a MongoDB document
   */
  hydrateFromDB(dbRoom) {
    if (!dbRoom) return;
    if (dbRoom.title) this.title = dbRoom.title;
    if (dbRoom.currentVideoId) this.currentVideoId = dbRoom.currentVideoId;
    if (typeof dbRoom.isPlaying === "boolean") this.isPlaying = dbRoom.isPlaying;
    if (typeof dbRoom.currentTime === "number") this.currentTime = dbRoom.currentTime;
    if (dbRoom.lastUpdated) this.lastUpdated = new Date(dbRoom.lastUpdated).getTime();
    if (dbRoom.hostId && !this.hostId) this.hostId = dbRoom.hostId;
    if (Array.isArray(dbRoom.chatMessages) && dbRoom.chatMessages.length > 0) {
      this.chatMessages = dbRoom.chatMessages.slice(-100);
    }
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }

  getOrCreateRoom(roomId, title) {
    const cleanId = (roomId || "").trim().toLowerCase();
    if (!this.rooms.has(cleanId)) {
      const room = new Room(cleanId, title);
      this.rooms.set(cleanId, room);
    }
    return this.rooms.get(cleanId);
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.trim().toLowerCase()) || null;
  }

  deleteRoom(roomId) {
    return this.rooms.delete((roomId || "").trim().toLowerCase());
  }

  findRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      if (room.participants.has(socketId)) {
        return room;
      }
    }
    return null;
  }

  getAllRoomsSummary() {
    return Array.from(this.rooms.values()).map((r) => ({
      roomId: r.roomId,
      title: r.title,
      participantCount: r.participants.size,
      videoId: r.currentVideoId,
      isPlaying: r.isPlaying,
    }));
  }
}

// Export singleton instance
const roomManager = new RoomManager();
module.exports = { Room, Participant, RoomManager, roomManager };
