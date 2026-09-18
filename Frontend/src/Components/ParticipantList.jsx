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
    <div className="participants-container">
      {/* Header */}
      <div className="participants-header">
        <div className="participants-header-left">
          <span className="participants-header-title">Participants</span>
          <span className="participants-header-count">
            {participants.length}
          </span>
        </div>

        {isHost && (
          <span className="participants-host-badge">
            <Crown size={12} />
            <span>Host Controls Active</span>
          </span>
        )}
      </div>

      {/* Invite Friends / Share Link Banner */}
      {roomId && (
        <div className="participants-invite-banner">
          <div className="invite-banner-left">
            <div className="invite-banner-icon-box">
              <Link2 size={15} />
            </div>
            <div>
              <p className="invite-banner-title">
                Invite Friends
              </p>
              <p className="invite-banner-subtitle">
                Share this party's link
              </p>
            </div>
          </div>

          <div className="invite-banner-actions">
            <button
              onClick={handleCopyRoomId}
              className={`btn btn-secondary invite-btn-copy-id ${copiedId ? "copied" : ""}`}
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
              className="btn btn-primary invite-btn-share"
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
      <div ref={menuRef} className="participants-list-scroll">
        {participants.map((p) => {
          const isSelf = p.userId === currentUserId || p.socketId === currentUserId;
          const isParticipantHost = p.role === "Host";
          const isParticipantMod = p.role === "Moderator";
          const isMenuOpen = activeMenuUserId === (p.userId || p.socketId);

          return (
            <div
              key={p.userId || p.socketId}
              className={`participant-item-row ${isSelf ? "is-self" : isParticipantHost ? "is-host" : ""}`}
            >
              {/* User Avatar + Name */}
              <div className="participant-user-info">
                <div
                  className="participant-avatar-box"
                  style={{ background: getAvatarColor(p.username) }}
                >
                  {(p.username || "U").charAt(0).toUpperCase()}
                </div>

                <div className="participant-name-container">
                  <div className="participant-name-row">
                    <span className="participant-name-text" title={p.username}>
                      {p.username}
                    </span>
                    {isSelf && (
                      <span className="participant-self-tag">
                        (You)
                      </span>
                    )}
                  </div>
                  <div className="participant-badge-container">
                    <span className={`badge ${getRoleBadgeClass(p.role)}`}>
                      {getRoleIcon(p.role)}
                      <span>{p.role}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Host Actions for other participants */}
              {isHost && !isSelf && (
                <div className="participant-actions-group">
                  <div className="participant-host-actions">
                    {/* Make Host Quick Action */}
                    <button
                      onClick={() => setModalConfig({ type: "transfer", targetUser: p })}
                      className="btn-icon action-btn-make-host"
                      title={`Make ${p.username} the Room Host`}
                    >
                      <Crown size={13} />
                    </button>

                    {/* Remove Quick Action */}
                    <button
                      onClick={() => setModalConfig({ type: "kick", targetUser: p })}
                      className="btn-icon action-btn-kick-user"
                      title={`Remove ${p.username} from room`}
                    >
                      <UserX size={13} />
                    </button>

                    {/* More Menu Toggle */}
                    <button
                      onClick={() =>
                        setActiveMenuUserId(isMenuOpen ? null : p.userId || p.socketId)
                      }
                      className="btn-icon action-btn-more-menu"
                      title="Manage participant options"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="participant-dropdown-menu">
                      {/* Transfer Host */}
                      <button
                        onClick={() => {
                          setModalConfig({ type: "transfer", targetUser: p });
                          setActiveMenuUserId(null);
                        }}
                        className="btn-secondary menu-item-btn menu-item-btn-host"
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
                          className="btn-secondary menu-item-btn"
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
                          className="btn-secondary menu-item-btn"
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
                        className="btn-danger menu-item-btn"
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
        <div className="modal-backdrop" onClick={() => setModalConfig(null)}>
          <div className="glass-panel modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-header-left">
                {modalConfig.type === "transfer" ? (
                  <div className="modal-icon-badge transfer">
                    <Crown size={20} />
                  </div>
                ) : (
                  <div className="modal-icon-badge danger">
                    <UserX size={20} />
                  </div>
                )}
                <h3 className="modal-title">
                  {modalConfig.type === "transfer" ? "Transfer Host Role" : "Remove Participant"}
                </h3>
              </div>
              <button
                onClick={() => setModalConfig(null)}
                className="btn-icon"
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-body-text">
              {modalConfig.type === "transfer" ? (
                <>
                  Are you sure you want to transfer the <strong>Host</strong> role to{" "}
                  <span className="modal-target-username transfer">
                    {modalConfig.targetUser?.username}
                  </span>
                  ? They will receive full control over room management, and you will become a Moderator.
                </>
              ) : (
                <>
                  Are you sure you want to remove{" "}
                  <span className="modal-target-username danger">
                    {modalConfig.targetUser?.username}
                  </span>{" "}
                  from this watch party? They will be immediately disconnected.
                </>
              )}
            </p>

            <div className="modal-actions-row">
              <button
                onClick={() => setModalConfig(null)}
                className="btn btn-secondary modal-btn-cancel"
              >
                Cancel
              </button>
              {modalConfig.type === "transfer" ? (
                <button
                  onClick={handleConfirmModalAction}
                  className="btn btn-primary modal-btn-confirm-transfer"
                >
                  <Crown size={14} />
                  <span>Transfer Host 👑</span>
                </button>
              ) : (
                <button
                  onClick={handleConfirmModalAction}
                  className="btn btn-danger modal-btn-confirm-kick"
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