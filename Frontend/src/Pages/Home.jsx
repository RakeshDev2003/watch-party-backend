import React, { useState, useEffect } from "react";
import {
  Play,
  Users,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  PlusCircle,
  LogIn,
  History,
  Crown,
} from "lucide-react";
import { extractYouTubeId, PRESET_VIDEOS, DEFAULT_VIDEO_ID } from "../utils/youtube";
import { BACKEND_URL } from "../services/socket";

export default function Home({ onJoinRoom, initialRoomId = "" }) {
  const [tab, setTab] = useState(initialRoomId ? "join" : "create");

  // Create Room form state
  const [createUsername, setCreateUsername] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [initialVideoInput, setInitialVideoInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Join Room form state
  const [joinUsername, setJoinUsername] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState(initialRoomId || "");
  const [isJoining, setIsJoining] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("watchparty_recents");
      if (saved) {
        setRecentRooms(JSON.parse(saved));
      }
      const savedName = localStorage.getItem("watchparty_username");
      if (savedName) {
        setCreateUsername(savedName);
        setJoinUsername(savedName);
      }
    } catch { }
  }, []);

  const saveRecentRoom = (roomId, title, username) => {
    try {
      localStorage.setItem("watchparty_username", username);
      const existing = JSON.parse(localStorage.getItem("watchparty_recents") || "[]");
      const filtered = existing.filter((r) => r.roomId !== roomId);
      const updated = [
        { roomId, title: title || "Watch Party", lastVisited: Date.now() },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem("watchparty_recents", JSON.stringify(updated));
    } catch { }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const username = createUsername.trim();
    if (!username) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setIsCreating(true);

    try {
      let defaultVideoId = DEFAULT_VIDEO_ID;
      if (initialVideoInput.trim()) {
        const parsed = extractYouTubeId(initialVideoInput);
        if (parsed) {
          defaultVideoId = parsed;
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: roomTitle.trim() || `${username}'s Watch Room`,
          defaultVideoId,
        }),
      });

      const data = await response.json();
      const generatedRoomId = data?.roomId || "WP-" + Math.floor(1000 + Math.random() * 9000);
      const title = data?.title || roomTitle || `${username}'s Watch Room`;

      saveRecentRoom(generatedRoomId, title, username);
      onJoinRoom({
        roomId: generatedRoomId,
        username,
        roomTitle: title,
        initialVideoId: defaultVideoId,
        isHost: true,
      });
    } catch (err) {
      // Fallback
      let defaultVideoId = DEFAULT_VIDEO_ID;
      if (initialVideoInput.trim()) {
        const parsed = extractYouTubeId(initialVideoInput);
        if (parsed) defaultVideoId = parsed;
      }
      const fallbackCode = "WP-" + Math.floor(1000 + Math.random() * 9000);
      saveRecentRoom(fallbackCode, roomTitle || `${username}'s Watch Room`, username);
      onJoinRoom({
        roomId: fallbackCode,
        username,
        roomTitle: roomTitle || `${username}'s Watch Room`,
        initialVideoId: defaultVideoId,
        isHost: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const username = joinUsername.trim();
    let code = joinRoomCode.trim();

    if (!username) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!code) {
      setErrorMessage("Please enter a room code or invite URL.");
      return;
    }

    try {
      if (code.includes("room=")) {
        const urlParams = new URLSearchParams(code.split("?")[1]);
        if (urlParams.get("room")) {
          code = urlParams.get("room");
        }
      }
    } catch { }

    saveRecentRoom(code, "Watch Room", username);
    onJoinRoom({
      roomId: code,
      username,
      isHost: false,
    });
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-tag-pill">
          <Sparkles size={14} />
          <span>Real-Time Synchronized Streaming</span>
        </div>

        <h1 className="hero-title">
          Watch YouTube Together <br /> In Perfect Real-Time Sync.
        </h1>
        <p className="hero-desc">
          Create a room, invite your friends with a single link, and enjoy synchronized playback, role-based controls, and live chat.
        </p>
      </div>

      {/* Main Tabs Card */}
      <div className="glass-panel home-card">
        {/* Tab Toggle */}
        <div className="tab-toggle-container">
          <button
            onClick={() => { setTab("create"); setErrorMessage(""); }}
            className={`tab-btn ${tab === "create" ? "active" : ""}`}
          >
            <PlusCircle size={16} />
            <span>Create Room</span>
          </button>

          <button
            onClick={() => { setTab("join"); setErrorMessage(""); }}
            className={`tab-btn ${tab === "join" ? "active" : ""}`}
          >
            <LogIn size={16} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="error-alert">
            {errorMessage}
          </div>
        )}

        {/* Create Room Form */}
        {tab === "create" ? (
          <form onSubmit={handleCreateSubmit}>
            <div className="home-form-stack">
              <div>
                <label className="form-label">
                  Your Display Name <span className="form-required-star">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter your name"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Room Title (Optional)
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Friday Vibes Party"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">
                  Starting YouTube URL / Video (Optional)
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                  value={initialVideoInput}
                  onChange={(e) => setInitialVideoInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary home-btn-submit"
                disabled={isCreating}
              >
                <span>{isCreating ? "Creating Room..." : "Create Room & Become Host 👑"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          /* Join Room Form */
          <form onSubmit={handleJoinSubmit}>
            <div className="home-form-stack">
              {/* 1. Display Name First */}
              <div>
                <label className="form-label">
                  Your Display Name <span className="form-required-star">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter your name"
                  value={joinUsername}
                  onChange={(e) => setJoinUsername(e.target.value)}
                  required
                />
              </div>

              {/* 2. Room Code or Invite Link Second */}
              <div>
                <label className="form-label">
                  Room Code or Invite Link <span className="form-required-star">*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. WP-9821 or paste invite URL"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary home-btn-submit"
                disabled={isJoining}
              >
                <span>Join Watch Party</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Recent Rooms Quick Reconnect */}
        {recentRooms.length > 0 && (
          <div className="recent-rooms-section">
            <div className="recent-rooms-header">
              <History size={13} />
              <span>Recent Rooms</span>
            </div>
            <div className="recent-rooms-list">
              {recentRooms.map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => {
                    setJoinRoomCode(r.roomId);
                    setTab("join");
                  }}
                  className="btn-secondary recent-room-chip"
                >
                  <span className="recent-room-id">{r.roomId}</span>
                  <span className="recent-room-title">• {r.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="feature-highlights-grid">
        <div className="glass-panel feature-card">
          <div className="feature-icon-box feature-icon-purple">
            <Zap size={20} />
          </div>
          <h4 className="feature-title">Sub-second Sync</h4>
          <p className="feature-desc">
            Automated drift compensation keeps everyone on the exact same frame across all devices.
          </p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon-box feature-icon-amber">
            <Shield size={20} />
          </div>
          <h4 className="feature-title">Role-Based Access</h4>
          <p className="feature-desc">
            Hosts manage the room, promote Moderators, and control who can play, pause, or switch videos.
          </p>
        </div>

        <div className="glass-panel feature-card">
          <div className="feature-icon-box feature-icon-pink">
            <Sparkles size={20} />
          </div>
          <h4 className="feature-title">Live Reactions & Chat</h4>
          <p className="feature-desc">
            Send instant floating emoji bursts on funny or epic moments, with real-time text chat.
          </p>
        </div>
      </div>
    </div>
  );
}