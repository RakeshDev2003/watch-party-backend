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
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) clamp(10px, 3vw, 20px)" }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "rgba(139, 92, 246, 0.12)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            color: "#c084fc",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          <Sparkles size={14} />
          <span>Real-Time Synchronized Streaming</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(26px, 5.5vw, 54px)",
            fontWeight: 800,
            lineHeight: 1.18,
            marginBottom: "14px",
            background: "linear-gradient(135deg, #ffffff 30%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Watch YouTube Together <br /> In Perfect Real-Time Sync.
        </h1>
        <p
          style={{
            fontSize: "clamp(14px, 2vw, 16px)",
            color: "var(--text-muted)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Create a room, invite your friends with a single link, and enjoy synchronized playback, role-based controls, and live chat.
        </p>
      </div>

      {/* Main Tabs Card */}
      <div
        className="glass-panel"
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          padding: "clamp(20px, 4vw, 32px)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        {/* Tab Toggle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => { setTab("create"); setErrorMessage(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: tab === "create" ? "var(--primary)" : "transparent",
              color: tab === "create" ? "#ffffff" : "var(--text-muted)",
            }}
          >
            <PlusCircle size={16} />
            <span>Create Room</span>
          </button>

          <button
            onClick={() => { setTab("join"); setErrorMessage(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: tab === "join" ? "var(--primary)" : "transparent",
              color: tab === "join" ? "#ffffff" : "var(--text-muted)",
            }}
          >
            <LogIn size={16} />
            <span>Join Room</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Create Room Form */}
        {tab === "create" ? (
          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Your Display Name <span style={{ color: "var(--primary)" }}>*</span>
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
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
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
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
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
                className="btn btn-primary"
                disabled={isCreating}
                style={{
                  padding: "14px",
                  fontSize: "15px",
                  width: "100%",
                  marginTop: "8px",
                }}
              >
                <span>{isCreating ? "Creating Room..." : "Create Room & Become Host 👑"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          /* Join Room Form */
          <form onSubmit={handleJoinSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 1. Display Name First */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Your Display Name <span style={{ color: "var(--primary)" }}>*</span>
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
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Room Code or Invite Link <span style={{ color: "var(--primary)" }}>*</span>
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
                className="btn btn-primary"
                disabled={isJoining}
                style={{
                  padding: "14px",
                  fontSize: "15px",
                  width: "100%",
                  marginTop: "8px",
                }}
              >
                <span>Join Watch Party</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Recent Rooms Quick Reconnect */}
        {recentRooms.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-dim)",
                fontWeight: 600,
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <History size={13} />
              <span>Recent Rooms</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {recentRooms.map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => {
                    setJoinRoomCode(r.roomId);
                    setTab("join");
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  <span style={{ color: "#c084fc", fontWeight: 700 }}>{r.roomId}</span>
                  <span style={{ color: "var(--text-muted)" }}>• {r.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginTop: "60px",
        }}
      >
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(139, 92, 246, 0.15)",
              color: "#c084fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Zap size={20} />
          </div>
          <h4 style={{ fontSize: "16px", marginBottom: "6px" }}>Sub-second Sync</h4>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Automated drift compensation keeps everyone on the exact same frame across all devices.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Shield size={20} />
          </div>
          <h4 style={{ fontSize: "16px", marginBottom: "6px" }}>Role-Based Access</h4>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Hosts manage the room, promote Moderators, and control who can play, pause, or switch videos.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(236, 72, 153, 0.15)",
              color: "#f472b6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={20} />
          </div>
          <h4 style={{ fontSize: "16px", marginBottom: "6px" }}>Live Reactions & Chat</h4>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Send instant floating emoji bursts on funny or epic moments, with real-time text chat.
          </p>
        </div>
      </div>
    </div>
  );
}