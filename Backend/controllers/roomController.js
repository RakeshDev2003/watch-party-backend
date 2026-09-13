const { roomManager } = require("../Socket/RoomManager");
const RoomModel = require("../Models/Room");


const generateRoomId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

exports.createRoom = async (req, res) => {
  try {
    const { title, customId, defaultVideoId } = req.body;
    const roomId = (customId ? customId.trim() : generateRoomId()).toLowerCase();
    const roomTitle = title ? title.trim() : "YouTube Watch Party";
    const videoId = defaultVideoId ? defaultVideoId.trim() : "nSDgHBxUbVQ";

    // Create or get in-memory representation
    const room = roomManager.getOrCreateRoom(roomId, roomTitle);
    room.title = roomTitle;
    room.currentVideoId = videoId;

    // Persist to MongoDB
    try {
      if (RoomModel) {
        await RoomModel.findOneAndUpdate(
          { roomId },
          {
            roomId,
            title: roomTitle,
            currentVideoId: videoId,
            isPlaying: false,
            currentTime: 0,
            lastUpdated: new Date(),
            isActive: true,
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    } catch (dbErr) {
      console.warn("⚠️  Failed to save room to MongoDB:", dbErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      roomId: room.roomId,
      title: room.title,
      currentVideoId: room.currentVideoId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create room",
      error: error.message,
    });
  }
};

exports.getRoomInfo = async (req, res) => {
  try {
    const roomId = (req.params.roomId || "").trim().toLowerCase();
    let room = roomManager.getRoom(roomId);

    // If room is in active memory, return sync payload
    if (room) {
      return res.status(200).json({
        success: true,
        exists: true,
        room: room.getSyncPayload(),
      });
    }

    // Try finding in MongoDB if not in active memory
    let dbRoom = null;
    try {
      if (RoomModel) {
        dbRoom = await RoomModel.findOne({ roomId });
      }
    } catch (e) {
      console.warn("DB query error in getRoomInfo:", e.message);
    }

    if (dbRoom) {
      // Rehydrate in-memory room from MongoDB
      room = roomManager.getOrCreateRoom(roomId, dbRoom.title);
      room.hydrateFromDB(dbRoom);

      return res.status(200).json({
        success: true,
        exists: true,
        room: room.getSyncPayload(),
      });
    }

    return res.status(404).json({
      success: false,
      exists: false,
      message: "Room not found or expired",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching room info",
      error: error.message,
    });
  }
};

exports.getActiveRooms = async (req, res) => {
  try {
    const memoryRooms = roomManager.getAllRoomsSummary();

    // Query MongoDB for all active rooms
    let dbRooms = [];
    try {
      if (RoomModel) {
        dbRooms = await RoomModel.find({ isActive: true })
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean();
      }
    } catch (dbErr) {
      console.warn("DB query error in getActiveRooms:", dbErr.message);
    }

    // Combine memory rooms and DB rooms with active participant count
    const roomMap = new Map();

    // Add DB rooms first
    for (const r of dbRooms) {
      roomMap.set(r.roomId, {
        roomId: r.roomId,
        title: r.title || "Watch Party",
        participantCount: (r.participants || []).length,
        videoId: r.currentVideoId || "LXb3EKWsInQ",
        isPlaying: r.isPlaying || false,
      });
    }

    // Overlay live in-memory rooms for exact real-time participant counts
    for (const r of memoryRooms) {
      roomMap.set(r.roomId, r);
    }

    const rooms = Array.from(roomMap.values());

    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

