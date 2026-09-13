import React, { useState } from "react";
import { Play, Copy, Check, Users, LogOut, Radio, Shield, Crown, User, Share2 } from "lucide-react";

export default function Navbar({
  roomId,
  roomTitle,
  participantCount = 1,
  currentUserRole = "Participant",
  username = "",
  onLeave,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleShareLink = async () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    
    // Try native Web Share API if available (especially great on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: roomTitle ? `${roomTitle} - Watch Party` : "Join my Watch Party!",
          text: `Join my YouTube Watch Party (Room: ${roomId})!`,
          url: inviteUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("Native share fallback to clipboard:", err);
        } else {
          return;
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyRoomId = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const getRoleIcon = () => {
    switch (currentUserRole) {
      case "Host":
        return <Crown size={12} className="text-amber-400" />;
      case "Moderator":
        return <Shield size={12} className="text-purple-400" />;
      default:
        return <User size={12} className="text-slate-400" />;
    }
  };

  const getRoleBadgeClass = () => {
    switch (currentUserRole) {
      case "Host":
        return "badge-host";
      case "Moderator":
        return "badge-moderator";
      default:
        return "badge-participant";
    }
  };

  return (
    <header className="navbar-container">
      {/* Top Bar: Brand on left, Status & Leave on right */}
      <div className="navbar-top-bar">
        {/* Brand */}
        <div className="navbar-brand-group">
          <div className="navbar-logo-icon">
            <Play size={16} color="#ffffff" fill="#ffffff" />
          </div>
          <div className="navbar-brand-text-wrapper">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="navbar-brand-title">WatchParty</span>
              <span className="hide-on-mobile badge-sync-tag">SYNC</span>
            </div>
            {roomTitle && (
              <p className="navbar-room-title">{roomTitle}</p>
            )}
          </div>
        </div>

        {/* Status Badges & Leave Button */}
        {roomId ? (
          <div className="navbar-status-group">
            {/* User Role Badge */}
            <div className={`badge nav-role-badge ${getRoleBadgeClass()}`}>
              {getRoleIcon()}
              <span>{currentUserRole}</span>
            </div>

            {/* User Name (Desktop only) */}
            <div
              className="hide-on-mobile"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "rgba(139, 92, 246, 0.25)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: "#d8b4fe",
                  fontWeight: 700,
                }}
              >
                {(username || "U").charAt(0).toUpperCase()}
              </div>
              <span>{username}</span>
            </div>

            {/* Live Indicator */}
            <div className="nav-live-badge">
              <div className="pulse-dot" style={{ width: "6px", height: "6px" }} />
              <span className="hide-on-mobile">LIVE</span>
            </div>

            {/* Leave Button */}
            {onLeave && (
              <button
                onClick={onLeave}
                className="btn btn-danger nav-action-btn nav-leave-btn"
                title="Leave Room"
              >
                <LogOut size={13} />
                <span className="hide-on-xs">Leave</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <Radio size={14} color="#10b981" />
              <span>Socket.IO Ready</span>
            </div>
          </div>
        )}
      </div>

      {/* Share Actions Bar (Desktop sits inline, Mobile takes dedicated 2nd row) */}
      {roomId && (
        <div className="navbar-share-bar">
          {/* Share Link Button */}
          <button
            onClick={handleShareLink}
            className={`nav-action-btn nav-share-btn ${copiedLink ? "copied" : ""}`}
            title="Click to copy invite link or share with friends"
          >
            {copiedLink ? (
              <>
                <Check size={13} color="#34d399" />
                <span className="nav-btn-label">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={13} color="#c084fc" />
                <span className="nav-btn-label">Share Party</span>
              </>
            )}
          </button>

          {/* Room ID Copy Button */}
          <button
            onClick={handleCopyRoomId}
            className={`nav-action-btn nav-roomid-btn ${copiedId ? "copied" : ""}`}
            title="Click to copy Room ID"
          >
            {copiedId ? (
              <>
                <Check size={12} color="#34d399" />
                <span className="nav-btn-label" style={{ color: "#34d399", fontWeight: 700 }}>ID Copied!</span>
              </>
            ) : (
              <>
                <span className="nav-id-prefix">ID:</span>
                <span className="nav-roomid-code">{roomId}</span>
                <Copy size={12} color="#94a3b8" />
              </>
            )}
          </button>
        </div>
      )}
    </header>
  );
}

