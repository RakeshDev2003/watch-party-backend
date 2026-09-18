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
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <MessageSquare size={16} color="#c084fc" />
        <span className="chat-header-title">Live Room Chat</span>
      </div>

      {/* Messages List */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <Sparkles size={28} color="#8b5cf6" className="chat-empty-icon" />
            <p className="chat-empty-title">No messages yet</p>
            <p className="chat-empty-subtitle">
              Say hello or react to key moments!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.role === "System" || msg.userId === "system";
            const isSelf = msg.userId === currentUserId;

            if (isSystem) {
              return (
                <div key={msg.id} className="chat-system-msg">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-msg-row ${isSelf ? "is-self" : ""}`}
              >
                {/* Header (Username & Role) */}
                <div className="chat-msg-header">
                  <span className={`chat-msg-username ${isSelf ? "is-self" : ""}`}>
                    {isSelf ? "You" : msg.username}
                  </span>
                  {msg.role !== "Participant" && msg.role !== "Viewer" && (
                    <span
                      className={`chat-msg-role-tag ${msg.role === "Host" ? "host" : "mod"}`}
                    >
                      {getRoleIcon(msg.role)}
                      {msg.role}
                    </span>
                  )}
                  <span className="chat-msg-time">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div className={`chat-msg-bubble ${isSelf ? "is-self" : ""}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-bar">
        <input
          type="text"
          className="input-control chat-input-field"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary chat-send-btn"
          title="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
