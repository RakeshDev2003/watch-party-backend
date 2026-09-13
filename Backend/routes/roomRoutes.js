const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRoomInfo,
  getActiveRooms,
} = require("../controllers/roomController");

router.post("/create", createRoom);
router.get("/active", getActiveRooms);
router.get("/:roomId", getRoomInfo);

module.exports = router;
