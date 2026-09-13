import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Sparkles, Crown, Shield, User } from "lucide-react";

export default function ChatBox({ messages = [], currentUserId, onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "Host":
        return <Crown size={10} color="#fbbf24" />;
      case "Moderator":
        return <Shield size={10} color="#c084fc" />;
      default:
        return null;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <MessageSquare size={16} color="#c084fc" />
        <span style={{ fontSize: "14px", fontWeight: 700 }}>Live Room Chat</span>
      </div>

      {/* Messages List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-dim)",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <Sparkles size={28} color="#8b5cf6" style={{ marginBottom: "8px", opacity: 0.7 }} />
            <p style={{ fontSize: "13px", fontWeight: 500 }}>No messages yet</p>
            <p style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              Say hello or react to key moments!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.role === "System" || msg.userId === "system";
            const isSelf = msg.userId === currentUserId;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: "center",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "4px 12px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    margin: "4px 0",
                  }}
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isSelf ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isSelf ? "flex-end" : "flex-start",
                }}
              >
                {/* Header (Username & Role) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginBottom: "3px",
                    padding: "0 4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: isSelf ? "#d8b4fe" : "var(--text-muted)",
                    }}
                  >
                    {isSelf ? "You" : msg.username}
                  </span>
                  {msg.role !== "Participant" && msg.role !== "Viewer" && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: msg.role === "Host" ? "#fbbf24" : "#c084fc",
                        background:
                          msg.role === "Host"
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(139, 92, 246, 0.15)",
                        padding: "1px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      {getRoleIcon(msg.role)}
                      {msg.role}
                    </span>
                  )}
                  <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: isSelf
                      ? "14px 14px 2px 14px"
                      : "14px 14px 14px 2px",
                    background: isSelf
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "rgba(255, 255, 255, 0.06)",
                    border: isSelf
                      ? "none"
                      : "1px solid var(--border-color)",
                    color: "#ffffff",
                    fontSize: "13px",
                    lineHeight: "1.4",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          gap: "8px",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <input
          type="text"
          className="input-control"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ padding: "8px 12px", fontSize: "13px" }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: "8px 14px", borderRadius: "var(--radius-sm)" }}
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
