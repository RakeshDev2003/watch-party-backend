import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Film,
  Lock,
  Sparkles,
  Link,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatDuration, extractYouTubeId, PRESET_VIDEOS } from "../utils/youtube";

const REACTION_EMOJIS = ["❤️", "🔥", "👏", "😂", "🍿", "🎉"];

export default function RoomControls({
  isPlaying,
  currentTime,
  duration,
  canControl,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  onSendReaction,
}) {
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const handleSeekChange = (e) => {
    if (!canControl) return;
    const seekTime = parseFloat(e.target.value);
    onSeek(seekTime);
  };

  const handleDirectVideoSubmit = (e) => {
    e.preventDefault();
    setUrlError("");
    if (!videoUrlInput.trim()) {
      setUrlError("Please paste a YouTube URL or Video ID");
      return;
    }

    const videoId = extractYouTubeId(videoUrlInput);
    if (!videoId) {
      setUrlError("Could not detect a valid YouTube Video ID from that link.");
      return;
    }

    onChangeVideo(videoId);
    setVideoUrlInput("");
    setShowPresets(false);
  };

  const handleSelectPreset = (videoId) => {
    onChangeVideo(videoId);
    setShowPresets(false);
    setUrlError("");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-panel" style={{ padding: "16px 20px", marginTop: "16px" }}>
      {/* 1. Direct YouTube Link Input Bar (Always accessible for Host/Mod) */}
      {canControl && (
        <div style={{ marginBottom: "16px" }}>
          <form onSubmit={handleDirectVideoSubmit}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Paste any YouTube URL or Video ID here (e.g. https://www.youtube.com/watch?v=...)"
                  value={videoUrlInput}
                  onChange={(e) => {
                    setVideoUrlInput(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                  style={{
                    padding: "10px 14px",
                    paddingLeft: "36px",
                    fontSize: "13px",
                    background: "rgba(0, 0, 0, 0.4)",
                  }}
                />
                <Film
                  size={15}
                  color="#c084fc"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: "10px 18px",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>Load Video</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="btn btn-secondary"
                style={{
                  padding: "10px 14px",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
                title="Browse quick video presets"
              >
                <Sparkles size={14} color="#fbbf24" />
                <span>Presets</span>
              </button>
            </div>
          </form>

          {urlError && (
            <p style={{ fontSize: "12px", color: "var(--accent-red)", marginTop: "6px" }}>
              ⚠️ {urlError}
            </p>
          )}

          {/* Quick Preset Dropdown */}
          {showPresets && (
            <div
              style={{
                marginTop: "10px",
                padding: "12px",
                background: "rgba(10, 15, 26, 0.95)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
              }}
            >
              {PRESET_VIDEOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  style={{
                    padding: "8px 10px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  <p style={{ fontSize: "12px", fontWeight: 600, margin: 0 }}>
                    {preset.title}
                  </p>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {preset.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Progress Scrubber */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", minWidth: "42px", fontFamily: "monospace" }}>
          {formatDuration(currentTime)}
        </span>

        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime || 0}
            onChange={handleSeekChange}
            disabled={!canControl}
            style={{
              width: "100%",
              cursor: canControl ? "pointer" : "not-allowed",
              accentColor: "var(--primary)",
              height: "6px",
              borderRadius: "3px",
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%, rgba(255,255,255,0.1) 100%)`,
              appearance: "none",
              outline: "none",
            }}
          />
        </div>

        <span style={{ fontSize: "12px", color: "var(--text-dim)", minWidth: "42px", fontFamily: "monospace" }}>
          {formatDuration(duration)}
        </span>
      </div>

      {/* 3. Playback & Emoji Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Left: Play/Pause/Restart Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {canControl ? (
            <>
              {isPlaying ? (
                <button
                  onClick={onPause}
                  className="btn btn-secondary"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    background: "rgba(239, 68, 68, 0.15)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                  }}
                  title="Pause video for everyone"
                >
                  <Pause size={16} fill="#fca5a5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={onPlay}
                  className="btn btn-primary"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                  }}
                  title="Play video for everyone"
                >
                  <Play size={16} fill="#ffffff" />
                  <span>Play</span>
                </button>
              )}

              <button
                onClick={() => onSeek(0)}
                className="btn-icon"
                title="Restart from beginning"
              >
                <RotateCcw size={15} />
              </button>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              <Lock size={13} color="#94a3b8" />
              <span>Playback controlled by Host / Moderator</span>
            </div>
          )}
        </div>

        {/* Right: Quick Emoji Reaction Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", marginRight: "4px" }}>
            React:
          </span>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction && onSendReaction(emoji)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                width: "32px",
                height: "32px",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.2)";
                e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
              title={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}