import React, { useState, useEffect, useRef } from "react";
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  Share2,
  Copy,
  Link2,
} from "lucide-react";

export default function ParticipantList({
  roomId,
  roomTitle,
  participants = [],
  currentUserId,
  isHost = false,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
}) {
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const [modalConfig, setModalConfig] = useState(null); // { type: 'kick' | 'transfer', targetUser }
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const menuRef = useRef(null);

  const handleShareInvite = async () => {
    if (!roomId) return;
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;

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

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleIcon = (role) => {
    switch (role) {
      case "Host":
        return <Crown size={12} color="#fbbf24" />;
      case "Moderator":
        return <Shield size={12} color="#c084fc" />;
      default:
        return <User size={12} color="#94a3b8" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Host":
        return "badge-host";
      case "Moderator":
        return "badge-moderator";
      default:
        return "badge-participant";
    }
  };

  const getAvatarColor = (name = "") => {
    const colors = [
      "linear-gradient(135deg, #8b5cf6, #ec4899)",
      "linear-gradient(135deg, #06b6d4, #3b82f6)",
      "linear-gradient(135deg, #f59e0b, #ef4444)",
      "linear-gradient(135deg, #10b981, #059669)",
      "linear-gradient(135deg, #a855f7, #6366f1)",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleConfirmModalAction = () => {
    if (!modalConfig) return;
    const { type, targetUser } = modalConfig;
    if (type === "transfer") {
      onTransferHost(targetUser.userId || targetUser.socketId);
    } else if (type === "kick") {
      onRemoveParticipant(targetUser.userId || targetUser.socketId);
    }
    setModalConfig(null);
    setActiveMenuUserId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>Participants</span>
          <span
            style={{
              padding: "2px 8px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {participants.length}
          </span>
        </div>

        {isHost && (
          <span
            style={{
              fontSize: "11px",
              color: "#fbbf24",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 600,
            }}
          >
            <Crown size={12} />
            <span>Host Controls Active</span>
          </span>
        )}
      </div>

      {/* Invite Friends / Share Link Banner */}
      {roomId && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(139, 92, 246, 0.08)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(139, 92, 246, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c084fc",
              }}
            >
              <Link2 size={15} />
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, margin: 0, color: "#f1f5f9" }}>
                Invite Friends
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                Share this party's link
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={handleCopyRoomId}
              className="btn btn-secondary"
              style={{
                padding: "6px 10px",
                fontSize: "12px",
                borderRadius: "var(--radius-full)",
                gap: "5px",
                background: copiedId ? "rgba(16, 185, 129, 0.15)" : undefined,
                borderColor: copiedId ? "rgba(16, 185, 129, 0.4)" : undefined,
                color: copiedId ? "#34d399" : undefined,
              }}
              title="Copy Room ID code only"
            >
              {copiedId ? (
                <>
                  <Check size={13} color="#34d399" />
                  <span>ID Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy ID</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareInvite}
              className="btn btn-primary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "var(--radius-full)",
                gap: "6px",
              }}
              title="Copy or share party invite link"
            >
              {copiedLink ? (
                <>
                  <Check size={13} color="#ffffff" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Participants Scroll List */}
      <div
        ref={menuRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {participants.map((p) => {
          const isSelf = p.userId === currentUserId || p.socketId === currentUserId;
          const isParticipantHost = p.role === "Host";
          const isParticipantMod = p.role === "Moderator";
          const isMenuOpen = activeMenuUserId === (p.userId || p.socketId);

          return (
            <div
              key={p.userId || p.socketId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: isSelf
                  ? "rgba(139, 92, 246, 0.08)"
                  : isParticipantHost
                  ? "rgba(245, 158, 11, 0.05)"
                  : "rgba(255, 255, 255, 0.02)",
                border: isSelf
                  ? "1px solid rgba(139, 92, 246, 0.25)"
                  : isParticipantHost
                  ? "1px solid rgba(245, 158, 11, 0.2)"
                  : "1px solid var(--border-color)",
                position: "relative",
                transition: "all 0.2s ease",
              }}
            >
              {/* User Avatar + Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: getAvatarColor(p.username),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    flexShrink: 0,
                  }}
                >
                  {(p.username || "U").charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-main)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "140px",
                      }}
                      title={p.username}
                    >
                      {p.username}
                    </span>
                    {isSelf && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#c084fc",
                          fontWeight: 700,
                        }}
                      >
                        (You)
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "2px" }}>
                    <span className={`badge ${getRoleBadgeClass(p.role)}`}>
                      {getRoleIcon(p.role)}
                      <span>{p.role}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Host Actions for other participants */}
              {isHost && !isSelf && (
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {/* Make Host Quick Action */}
                    <button
                      onClick={() => setModalConfig({ type: "transfer", targetUser: p })}
                      className="btn-icon"
                      style={{
                        padding: "5px 7px",
                        fontSize: "11px",
                        background: "rgba(245, 158, 11, 0.1)",
                        borderColor: "rgba(245, 158, 11, 0.25)",
                        color: "#fbbf24",
                      }}
                      title={`Make ${p.username} the Room Host`}
                    >
                      <Crown size={13} />
                    </button>

                    {/* Remove Quick Action */}
                    <button
                      onClick={() => setModalConfig({ type: "kick", targetUser: p })}
                      className="btn-icon"
                      style={{
                        padding: "5px 7px",
                        fontSize: "11px",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderColor: "rgba(239, 68, 68, 0.25)",
                        color: "#f87171",
                      }}
                      title={`Remove ${p.username} from room`}
                    >
                      <UserX size={13} />
                    </button>

                    {/* More Menu Toggle */}
                    <button
                      onClick={() =>
                        setActiveMenuUserId(isMenuOpen ? null : p.userId || p.socketId)
                      }
                      className="btn-icon"
                      style={{ padding: "6px" }}
                      title="Manage participant options"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "6px",
                        background: "#0e1526",
                        border: "1px solid var(--border-glow)",
                        borderRadius: "var(--radius-sm)",
                        padding: "6px",
                        minWidth: "190px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                        zIndex: 60,
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {/* Transfer Host */}
                      <button
                        onClick={() => {
                          setModalConfig({ type: "transfer", targetUser: p });
                          setActiveMenuUserId(null);
                        }}
                        className="btn-secondary"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          padding: "7px 10px",
                          fontSize: "12px",
                          color: "#fbbf24",
                          borderColor: "rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        <Crown size={14} color="#fbbf24" />
                        <span>Make Room Host</span>
                      </button>

                      {/* Role Toggle */}
                      {isParticipantMod ? (
                        <button
                          onClick={() => {
                            onAssignRole(p.userId || p.socketId, "Participant");
                            setActiveMenuUserId(null);
                          }}
                          className="btn-secondary"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            padding: "7px 10px",
                            fontSize: "12px",
                          }}
                        >
                          <User size={14} color="#94a3b8" />
                          <span>Demote to Participant</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAssignRole(p.userId || p.socketId, "Moderator");
                            setActiveMenuUserId(null);
                          }}
                          className="btn-secondary"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            padding: "7px 10px",
                            fontSize: "12px",
                          }}
                        >
                          <ShieldCheck size={14} color="#c084fc" />
                          <span>Promote to Moderator</span>
                        </button>
                      )}

                      {/* Remove / Kick */}
                      <button
                        onClick={() => {
                          setModalConfig({ type: "kick", targetUser: p });
                          setActiveMenuUserId(null);
                        }}
                        className="btn-danger"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          padding: "7px 10px",
                          fontSize: "12px",
                        }}
                      >
                        <UserX size={14} color="#ef4444" />
                        <span>Remove Participant</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {modalConfig && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setModalConfig(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              background: "#0e1526",
              border: "1px solid var(--border-glow)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              animation: "slideDown 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {modalConfig.type === "transfer" ? (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(245, 158, 11, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fbbf24",
                    }}
                  >
                    <Crown size={20} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(239, 68, 68, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ef4444",
                    }}
                  >
                    <UserX size={20} />
                  </div>
                )}
                <h3 style={{ fontSize: "17px", fontWeight: 700 }}>
                  {modalConfig.type === "transfer" ? "Transfer Host Role" : "Remove Participant"}
                </h3>
              </div>
              <button
                onClick={() => setModalConfig(null)}
                className="btn-icon"
                style={{ padding: "6px" }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              {modalConfig.type === "transfer" ? (
                <>
                  Are you sure you want to transfer the <strong>Host</strong> role to{" "}
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                    {modalConfig.targetUser?.username}
                  </span>
                  ? They will receive full control over room management, and you will become a Moderator.
                </>
              ) : (
                <>
                  Are you sure you want to remove{" "}
                  <span style={{ color: "#f87171", fontWeight: 700 }}>
                    {modalConfig.targetUser?.username}
                  </span>{" "}
                  from this watch party? They will be immediately disconnected.
                </>
              )}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setModalConfig(null)}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Cancel
              </button>
              {modalConfig.type === "transfer" ? (
                <button
                  onClick={handleConfirmModalAction}
                  className="btn btn-primary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "13px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  }}
                >
                  <Crown size={14} />
                  <span>Transfer Host 👑</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmModalAction}
                  className="btn btn-danger"
                  style={{ padding: "8px 18px", fontSize: "13px" }}
                >
                  <UserX size={14} />
                  <span>Remove User 🚫</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}