const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    role: {
      type: String,
      enum: ["Host", "Moderator", "Participant", "Viewer"],
      default: "Participant",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: String, default: "system" },
    username: { type: String, default: "System" },
    role: { type: String, default: "System" },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      default: "Watch Party Room",
      trim: true,
    },
    hostId: {
      type: String,
      default: "",
    },
    currentVideoId: {
      type: String,
      default: "nSDgHBxUbVQ",
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    participants: [participantSchema],
    chatMessages: [messageSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);

