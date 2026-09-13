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
        return <Crown size={13} className="text-amber-400" />;
      case "Moderator":
        return <Shield size={13} className="text-purple-400" />;
      default:
        return <User size={13} className="text-slate-400" />;
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
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        borderBottom: "1px solid var(--border-color)",
        background: "rgba(9, 13, 22, 0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(239, 68, 68, 0.35)",
          }}
        >
          <Play size={18} color="#ffffff" fill="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "-0.01em",
                background: "linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              WatchParty
            </span>
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(139, 92, 246, 0.15)",
                color: "#c084fc",
                fontWeight: 700,
              }}
            >
              SYNC
            </span>
          </div>
          {roomTitle && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              {roomTitle}
            </p>
          )}
        </div>
      </div>

      {/* Room Details & Actions */}
      {roomId ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Share Link Button */}
          <button
            onClick={handleShareLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              background: copiedLink
                ? "rgba(16, 185, 129, 0.18)"
                : "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)",
              border: copiedLink
                ? "1px solid rgba(16, 185, 129, 0.5)"
                : "1px solid rgba(139, 92, 246, 0.4)",
              color: copiedLink ? "#34d399" : "#e2e8f0",
              boxShadow: copiedLink
                ? "0 0 12px rgba(16, 185, 129, 0.3)"
                : "0 0 12px rgba(139, 92, 246, 0.15)",
              transition: "all 0.2s ease",
            }}
            title="Click to copy invite link or share with friends"
          >
            {copiedLink ? (
              <>
                <Check size={14} color="#34d399" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} color="#c084fc" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {/* Room ID Copy Button */}
          <button
            onClick={handleCopyRoomId}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: copiedId ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: copiedId ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-color)",
              color: copiedId ? "#34d399" : "var(--text-main)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!copiedId) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!copiedId) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }
            }}
            title="Click to copy Room ID"
          >
            {copiedId ? (
              <>
                <Check size={13} color="#34d399" />
                <span style={{ color: "#34d399", fontWeight: 700 }}>ID Copied!</span>
              </>
            ) : (
              <>
                <span style={{ color: "var(--text-dim)" }}>Room:</span>
                <span style={{ color: "#c084fc", letterSpacing: "0.05em", fontFamily: "monospace", fontWeight: 700 }}>
                  {roomId}
                </span>
                <Copy size={13} color="#94a3b8" style={{ marginLeft: "2px" }} />
              </>
            )}
          </button>

          {/* User Role Badge */}
          <div className={`badge ${getRoleBadgeClass()}`}>
            {getRoleIcon()}
            <span>{currentUserRole}</span>
          </div>

          {/* User Name */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.25)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: "#d8b4fe",
                fontWeight: 700,
              }}
            >
              {(username || "U").charAt(0).toUpperCase()}
            </div>
            <span>{username}</span>
          </div>

          {/* Live Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              fontSize: "11px",
              fontWeight: 600,
              color: "#34d399",
            }}
          >
            <div className="pulse-dot" />
            <span>LIVE</span>
          </div>

          {/* Leave Button */}
          {onLeave && (
            <button
              onClick={onLeave}
              className="btn btn-danger"
              style={{ padding: "6px 12px", fontSize: "12px" }}
              title="Leave Room"
            >
              <LogOut size={14} />
              <span>Leave</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
    </header>
  );
}
