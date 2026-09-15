import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Components/Navbar";
import VideoPlayer from "../Components/VideoPlayer";
import RoomControls from "../Components/RoomControls";
import ParticipantList from "../Components/ParticipantList";
import ChatBox from "../Components/ChatBox";
import socketService, { BACKEND_URL } from "../services/socket";
import { MessageSquare, Users, AlertCircle, Sparkles, UserX, Home as HomeIcon, Crown } from "lucide-react";
import { DEFAULT_VIDEO_ID, PRESET_VIDEOS } from "../utils/youtube";

export default function WatchRoom({
  roomId,
  username,
  roomTitle = "",
  initialVideoId = "",
  isHost = false,
  onLeave,
}) {
  // Room State
  const [videoId, setVideoId] = useState(initialVideoId || DEFAULT_VIDEO_ID);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [remoteSeekTarget, setRemoteSeekTarget] = useState(null); // { time: number, timestamp: number, force?: boolean }
  const [duration, setDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [hostId, setHostId] = useState(null);

  // Participant Local Playback State (Pause locally vs Catch up to live host)
  const [isParticipantLocallyPaused, setIsParticipantLocallyPaused] = useState(false);

  // References for live time computation
  const lastSyncHostTimeRef = useRef(0);
  const lastSyncTimestampRef = useRef(Date.now());

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Chat & Reactions
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("chat");
  const [toastMessage, setToastMessage] = useState(null);
  const [kickedModal, setKickedModal] = useState(null); // { message }

  // Unique userId per window/tab to prevent collisions when testing in multiple tabs
  const [userId] = useState(() => {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  });

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage((cur) => (cur === text ? null : cur));
    }, 3500);
  };

  // Find current user's role from participants list or fallback to isHost
  const currentParticipant = participants.find(
    (p) => p.userId === userId || p.socketId === socketService.getSocket()?.id
  );
  const currentUserRole = currentParticipant
    ? currentParticipant.role
    : isHost
    ? "Host"
    : "Participant";

  const isUserHost = currentUserRole === "Host";
  const canControl = currentUserRole === "Host" || currentUserRole === "Moderator";

  // Calculate live host timestamp at any second
  const getEstimatedHostLiveTime = () => {
    if (!isPlaying) {
      return lastSyncHostTimeRef.current;
    }
    const elapsedSeconds = (Date.now() - lastSyncTimestampRef.current) / 1000;
    return Math.max(0, lastSyncHostTimeRef.current + elapsedSeconds);
  };

  // 1. Initial HTTP Fetch Fallback for immediate state hydration
  useEffect(() => {
    const fetchRoomFallback = async () => {
      try {
        const cleanRoomId = (roomId || "").trim().toLowerCase();
        const res = await fetch(`${BACKEND_URL}/api/rooms/${cleanRoomId}`);
        const data = await res.json();
        if (data && data.room) {
          if (data.room.videoId) setVideoId(data.room.videoId);
          if (typeof data.room.isPlaying === "boolean") setIsPlaying(data.room.isPlaying);
          if (typeof data.room.currentTime === "number") {
            setCurrentTime(data.room.currentTime);
            lastSyncHostTimeRef.current = data.room.currentTime;
            lastSyncTimestampRef.current = Date.now();
            setRemoteSeekTarget({ time: data.room.currentTime, timestamp: Date.now() });
          }
          if (Array.isArray(data.room.participants) && data.room.participants.length > 0) {
            setParticipants(data.room.participants);
          }
          if (data.room.hostId) setHostId(data.room.hostId);
        }
      } catch (e) {
        console.warn("HTTP room sync fallback:", e.message);
      }
    };
    fetchRoomFallback();
  }, [roomId]);

  // 2. Periodic Host Heartbeat (Keeps server calculated live timestamp accurate)
  useEffect(() => {
    if (!canControl || !isPlaying) return;

    const interval = setInterval(() => {
      socketService.sendSyncPlayback(roomId, currentTime, isPlaying);
    }, 4000);

    return () => clearInterval(interval);
  }, [roomId, canControl, isPlaying, currentTime]);

  // 3. Socket Connection & Event Listeners Lifecycle
  useEffect(() => {
    const socket = socketService.connect();

    // Event: sync_state (full room synchronization)
    const handleSyncState = (data) => {
      console.log("📥 sync_state received:", data);
      if (data.videoId) setVideoId(data.videoId);
      if (typeof data.isPlaying === "boolean") setIsPlaying(data.isPlaying);
      if (typeof data.currentTime === "number") {
        setCurrentTime(data.currentTime);
        lastSyncHostTimeRef.current = data.currentTime;
        lastSyncTimestampRef.current = Date.now();
        
        // If participant is not paused locally, sync seek target
        if (!isParticipantLocallyPaused) {
          setRemoteSeekTarget({ time: data.currentTime, timestamp: Date.now() });
        }
      }
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      if (data.hostId) setHostId(data.hostId);
    };

    // Event: play / pause / seek / change_video
    const handlePlay = (data) => {
      setIsPlaying(true);
      setIsParticipantLocallyPaused(false);
      const playTime = typeof data?.currentTime === "number" ? data.currentTime : lastSyncHostTimeRef.current;
      lastSyncHostTimeRef.current = playTime;
      lastSyncTimestampRef.current = Date.now();
      setCurrentTime(playTime);
      setRemoteSeekTarget({ time: playTime, timestamp: Date.now() });
    };

    const handlePause = (data) => {
      setIsPlaying(false);
      setIsParticipantLocallyPaused(false);
      const pauseTime = typeof data?.currentTime === "number" ? data.currentTime : lastSyncHostTimeRef.current;
      lastSyncHostTimeRef.current = pauseTime;
      lastSyncTimestampRef.current = Date.now();
      setCurrentTime(pauseTime);
      setRemoteSeekTarget({ time: pauseTime, timestamp: Date.now() });
    };

    const handleSeek = (data) => {
      if (typeof data?.time === "number") {
        lastSyncHostTimeRef.current = data.time;
        lastSyncTimestampRef.current = Date.now();
        setCurrentTime(data.time);
        setRemoteSeekTarget({ time: data.time, timestamp: Date.now() });
      }
    };

    const handleChangeVideo = (data) => {
      if (data?.videoId) {
        setVideoId(data.videoId);
        setCurrentTime(0);
        lastSyncHostTimeRef.current = 0;
        lastSyncTimestampRef.current = Date.now();
        setIsPlaying(true);
        setIsParticipantLocallyPaused(false);
        setRemoteSeekTarget({ time: 0, timestamp: Date.now() });
        showToast("🎬 Video changed by host/moderator");
      }
    };

    // Event: user_joined / user_left
    const handleUserJoined = (data) => {
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      if (data.userId !== userId) {
        showToast(`👋 ${data.username} joined as ${data.role}`);
      }
    };

    const handleUserLeft = (data) => {
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      showToast(`👋 ${data.username || "A user"} left the room`);
    };

    // Event: role_assigned (including host transfer)
    const handleRoleAssigned = (data) => {
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      
      if (data.role === "Host") {
        if (data.userId === userId) {
          showToast(`👑 You are now the Room Host! You have full permissions.`);
        } else if (data.oldHostUserId === userId) {
          showToast(`🛡️ You transferred Host role to ${data.username}. You are now a Moderator.`);
        } else {
          showToast(`👑 ${data.username} is now the Room Host!`);
        }
      } else {
        if (data.userId === userId) {
          showToast(`🎉 You have been assigned the role: ${data.role}!`);
        } else {
          showToast(`🛡️ ${data.username} is now a ${data.role}`);
        }
      }
    };

    // Event: participant_removed (Kicked)
    const handleParticipantRemoved = (data) => {
      if (data.kicked) {
        setKickedModal({
          message: data.message || "You have been removed from the watch party by the host.",
        });
        return;
      }
      if (Array.isArray(data.participants)) setParticipants(data.participants);
      if (data.username) {
        showToast(`🚫 ${data.username} was removed from the party`);
      }
    };

    // Event: chat_message & chat_history
    const handleChatMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleChatHistory = (history) => {
      if (Array.isArray(history)) {
        setChatMessages(history);
      }
    };

    // Event: reaction
    const handleReaction = (reactData) => {
      setReactions((prev) => [...prev, reactData]);
    };

    // Event: error_event
    const handleErrorEvent = (data) => {
      showToast(`⚠️ ${data.message || "An error occurred"}`);
    };

    // Helper to send join
    const sendJoin = () => {
      socketService.joinRoom(roomId, username, userId);
      if (isHost && initialVideoId) {
        setTimeout(() => {
          socketService.sendChangeVideo(roomId, initialVideoId);
        }, 500);
      }
    };

    // 1. ATTACH ALL LISTENERS FIRST
    socket.on("sync_state", handleSyncState);
    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("change_video", handleChangeVideo);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("role_assigned", handleRoleAssigned);
    socket.on("participant_removed", handleParticipantRemoved);
    socket.on("chat_message", handleChatMessage);
    socket.on("chat_history", handleChatHistory);
    socket.on("reaction", handleReaction);
    socket.on("error_event", handleErrorEvent);
    socket.on("connect", sendJoin);

    // 2. NOW EMIT JOIN_ROOM
    if (socket.connected) {
      sendJoin();
    }

    return () => {
      socket.off("sync_state", handleSyncState);
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("change_video", handleChangeVideo);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("role_assigned", handleRoleAssigned);
      socket.off("participant_removed", handleParticipantRemoved);
      socket.off("chat_message", handleChatMessage);
      socket.off("chat_history", handleChatHistory);
      socket.off("reaction", handleReaction);
      socket.off("error_event", handleErrorEvent);
      socket.off("connect", sendJoin);

      socketService.leaveRoom(roomId);
    };
  }, [roomId, username, userId, initialVideoId, isHost]);

  // Host/Mod control actions
  const handlePlayAction = (time) => {
    setIsPlaying(true);
    const targetTime = typeof time === "number" ? time : currentTime;
    lastSyncHostTimeRef.current = targetTime;
    lastSyncTimestampRef.current = Date.now();
    socketService.sendPlay(roomId, targetTime);
  };

  const handlePauseAction = (time) => {
    setIsPlaying(false);
    const targetTime = typeof time === "number" ? time : currentTime;
    lastSyncHostTimeRef.current = targetTime;
    lastSyncTimestampRef.current = Date.now();
    socketService.sendPause(roomId, targetTime);
  };

  const handleSeekAction = (time) => {
    lastSyncHostTimeRef.current = time;
    lastSyncTimestampRef.current = Date.now();
    setCurrentTime(time);
    setRemoteSeekTarget({ time, timestamp: Date.now() });
    socketService.sendSeek(roomId, time);
  };

  const handleSkipBackwardAction = (seconds = 10) => {
    const newTime = Math.max(0, currentTime - seconds);
    handleSeekAction(newTime);
    showToast(`⏪ Rewound ${seconds}s`);
  };

  const handleSkipForwardAction = (seconds = 10) => {
    const newTime = Math.min(duration || Infinity, currentTime + seconds);
    handleSeekAction(newTime);
    showToast(`⏩ Skipped +${seconds}s`);
  };

  const handleSkipNextVideoAction = () => {
    const currentIndex = PRESET_VIDEOS.findIndex((p) => p.id === videoId);
    const nextIndex = (currentIndex + 1) % PRESET_VIDEOS.length;
    const nextVideo = PRESET_VIDEOS[nextIndex];
    handleChangeVideoAction(nextVideo.id);
    showToast(`⏭️ Switched to: ${nextVideo.title}`);
  };

  // Participant Local Actions: Pause & Auto-Catch up Live
  const handleParticipantPauseAction = () => {
    setIsParticipantLocallyPaused(true);
    showToast("⏸️ Video paused locally for you");
  };

  const handleParticipantPlayAction = () => {
    setIsParticipantLocallyPaused(false);
    const liveTime = getEstimatedHostLiveTime();
    setRemoteSeekTarget({ time: liveTime, timestamp: Date.now(), force: true });
    socketService.requestSync(roomId);
    showToast("⚡ Resumed & synced to live host video");
  };

  const handleCatchUpLiveAction = () => {
    setIsParticipantLocallyPaused(false);
    const liveTime = getEstimatedHostLiveTime();
    setRemoteSeekTarget({ time: liveTime, timestamp: Date.now(), force: true });
    socketService.requestSync(roomId);
    showToast("🔴 Synced live with host!");
  };

  // Fullscreen sync listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreenAction = () => {
    const playerElem = document.getElementById("main-video-player-container");
    if (!document.fullscreenElement) {
      if (playerElem?.requestFullscreen) {
        playerElem.requestFullscreen().catch((err) => console.warn("Fullscreen request error:", err));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.warn("Exit fullscreen error:", err));
      }
    }
  };

  const handleChangeVideoAction = (newVideoId) => {
    if (!newVideoId) return;
    setVideoId(newVideoId);
    setCurrentTime(0);
    lastSyncHostTimeRef.current = 0;
    lastSyncTimestampRef.current = Date.now();
    setIsPlaying(true);
    setIsParticipantLocallyPaused(false);
    setRemoteSeekTarget({ time: 0, timestamp: Date.now() });
    socketService.sendChangeVideo(roomId, newVideoId);
  };

  const handleAssignRoleAction = (targetUserId, role) => {
    socketService.assignRole(roomId, targetUserId, role);
  };

  const handleRemoveParticipantAction = (targetUserId) => {
    socketService.removeParticipant(roomId, targetUserId);
  };

  const handleTransferHostAction = (targetUserId) => {
    socketService.transferHost(roomId, targetUserId);
  };

  const handleSendMessageAction = (text) => {
    socketService.sendMessage(roomId, text);
  };

  const handleSendReactionAction = (emoji) => {
    socketService.sendReaction(roomId, emoji);
  };

  // Compile full display participants
  const displayParticipants = participants.length > 0
    ? participants
    : [
        {
          userId,
          username,
          role: currentUserRole,
        },
      ];

  const estimatedLiveHostTime = getEstimatedHostLiveTime();

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Sparkles size={14} color="#c084fc" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Kicked Modal Overlay */}
      {kickedModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 8, 14, 0.9)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "440px",
              width: "100%",
              padding: "32px",
              textAlign: "center",
              background: "#0e1526",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)",
              animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                margin: "0 auto 20px auto",
              }}
            >
              <UserX size={32} />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>
              Removed from Party
            </h2>

            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
              {kickedModal.message}
            </p>

            <button
              onClick={() => {
                setKickedModal(null);
                onLeave();
              }}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              }}
            >
              <HomeIcon size={16} />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        roomTitle={roomTitle}
        participantCount={displayParticipants.length}
        currentUserRole={currentUserRole}
        username={username}
        onLeave={onLeave}
      />

      {/* Main Workspace Layout */}
      <main className="main-content">
        <div className="watch-party-grid">
          {/* Left Column: Video Player & Room Controls */}
          <div>
            <VideoPlayer
              videoId={videoId}
              isPlaying={isPlaying}
              remoteSeekTarget={remoteSeekTarget}
              canControl={canControl}
              isParticipantLocallyPaused={isParticipantLocallyPaused}
              hostLiveTime={estimatedLiveHostTime}
              reactions={reactions}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreenAction}
              onLocalPlay={handlePlayAction}
              onLocalPause={handlePauseAction}
              onParticipantPlay={handleParticipantPlayAction}
              onParticipantPause={handleParticipantPauseAction}
              onDurationChange={setDuration}
              onCurrentTimeChange={setCurrentTime}
              onSelectNewVideo={handleChangeVideoAction}
            />

            <RoomControls
              videoId={videoId}
              isPlaying={isPlaying}
              currentTime={currentTime}
              hostLiveTime={estimatedLiveHostTime}
              duration={duration}
              canControl={canControl}
              isParticipantLocallyPaused={isParticipantLocallyPaused}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreenAction}
              onSkipBackward={handleSkipBackwardAction}
              onSkipForward={handleSkipForwardAction}
              onSkipNextVideo={handleSkipNextVideoAction}
              onPlay={() => handlePlayAction(currentTime)}
              onPause={() => handlePauseAction(currentTime)}
              onParticipantPlay={handleParticipantPlayAction}
              onParticipantPause={handleParticipantPauseAction}
              onCatchUpLive={handleCatchUpLiveAction}
              onSeek={handleSeekAction}
              onChangeVideo={handleChangeVideoAction}
              onSendReaction={handleSendReactionAction}
            />
          </div>

          {/* Right Column: Tabbed Sidebar (Chat & Participants) */}
          <div className="glass-panel watch-sidebar">
            {/* Quick Participant Preview Bar */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border-color)",
                background: "rgba(0, 0, 0, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={14} color="#c084fc" />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                  In Party ({displayParticipants.length})
                </span>
              </div>

              {/* Mini Avatars preview */}
              <div style={{ display: "flex", alignItems: "center", gap: "-6px" }}>
                {displayParticipants.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.userId || p.socketId || idx}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: p.role === "Host" ? "#fbbf24" : p.role === "Moderator" ? "#c084fc" : "#64748b",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "2px solid #090d16",
                      marginLeft: idx > 0 ? "-6px" : "0",
                    }}
                    title={`${p.username} (${p.role})`}
                  >
                    {(p.username || "U").charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Navigation Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid var(--border-color)",
                background: "rgba(0, 0, 0, 0.2)",
              }}
            >
              <button
                onClick={() => setActiveTab("chat")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px",
                  border: "none",
                  borderBottom:
                    activeTab === "chat"
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                  background:
                    activeTab === "chat"
                      ? "rgba(139, 92, 246, 0.08)"
                      : "transparent",
                  color:
                    activeTab === "chat" ? "#ffffff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <MessageSquare size={14} />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("participants")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px",
                  border: "none",
                  borderBottom:
                    activeTab === "participants"
                      ? "2px solid var(--primary)"
                      : "2px solid transparent",
                  background:
                    activeTab === "participants"
                      ? "rgba(139, 92, 246, 0.08)"
                      : "transparent",
                  color:
                    activeTab === "participants"
                      ? "#ffffff"
                      : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Users size={14} />
                <span>People ({displayParticipants.length})</span>
              </button>
            </div>

            {/* Active Tab Panel */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {activeTab === "chat" ? (
                <ChatBox
                  messages={chatMessages}
                  currentUserId={userId}
                  onSendMessage={handleSendMessageAction}
                />
              ) : (
                <ParticipantList
                  roomId={roomId}
                  roomTitle={roomTitle}
                  participants={displayParticipants}
                  currentUserId={userId}
                  isHost={isUserHost}
                  onAssignRole={handleAssignRoleAction}
                  onRemoveParticipant={handleRemoveParticipantAction}
                  onTransferHost={handleTransferHostAction}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
