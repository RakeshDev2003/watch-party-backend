import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
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
  videoId,
  isPlaying,
  currentTime,
  duration,
  canControl,
  isFullscreen = false,
  onToggleFullscreen,
  onSkipBackward,
  onSkipForward,
  onSkipNextVideo,
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
    <div className="glass-panel room-controls-card">
      {/* 1. Direct YouTube Link Input Bar (Always accessible for Host/Mod) */}
      {canControl && (
        <div style={{ marginBottom: "16px" }}>
          <form onSubmit={handleDirectVideoSubmit}>
            <div className="controls-input-row">
              <div className="controls-url-wrapper">
                <input
                  type="text"
                  className="input-control"
                  placeholder="Paste YouTube URL or Video ID (e.g. https://www.youtube.com/watch?v=...)"
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

              <div className="controls-action-btns">
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

      {/* 3. Playback Controls & Emoji Bar */}
      <div className="playback-bar-container">
        {/* Main Controls Row */}
        <div className="playback-main-row">
          {/* Primary Controls: Skip Back, Play/Pause, Skip Forward, Restart */}
          <div className="playback-primary-group">
            {canControl ? (
              <>
                {/* Skip Back 10s */}
                <button
                  type="button"
                  onClick={() => onSkipBackward && onSkipBackward(10)}
                  className="btn btn-secondary control-btn control-skip-btn"
                  title="Skip back 10 seconds (-10s)"
                >
                  <RotateCcw size={14} />
                  <span>-10s</span>
                </button>

                {/* Play / Pause Toggle */}
                {isPlaying ? (
                  <button
                    onClick={onPause}
                    className="btn btn-secondary control-btn control-play-btn is-playing"
                    title="Pause video for everyone"
                  >
                    <Pause size={16} fill="#fca5a5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={onPlay}
                    className="btn btn-primary control-btn control-play-btn"
                    title="Play video for everyone"
                  >
                    <Play size={16} fill="#ffffff" />
                    <span>Play</span>
                  </button>
                )}

                {/* Skip Forward 10s */}
                <button
                  type="button"
                  onClick={() => onSkipForward && onSkipForward(10)}
                  className="btn btn-secondary control-btn control-skip-btn"
                  title="Skip forward 10 seconds (+10s)"
                >
                  <FastForward size={14} />
                  <span>+10s</span>
                </button>

                {/* Restart */}
                <button
                  onClick={() => onSeek(0)}
                  className="btn-icon control-restart-btn"
                  title="Restart from beginning (0:00)"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            ) : (
              <div className="playback-locked-badge">
                <Lock size={13} color="#94a3b8" />
                <span>Playback controlled by Host / Moderator</span>
              </div>
            )}
          </div>

          {/* Secondary Actions: Next Video & Full Screen */}
          <div className="playback-secondary-group">
            {canControl && onSkipNextVideo && (
              <button
                type="button"
                onClick={onSkipNextVideo}
                className="btn btn-secondary control-btn control-next-btn"
                title="Skip to next playlist track"
              >
                <SkipForward size={14} />
                <span>Next Video</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`btn btn-secondary control-btn control-fullscreen-btn ${isFullscreen ? "is-fullscreen" : ""}`}
              title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              <span>{isFullscreen ? "Exit Screen" : "Full Screen"}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Reactions Row */}
        <div className="playback-reactions-row">
          <span className="reactions-label">React:</span>
          <div className="reactions-emojis-list">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSendReaction && onSendReaction(emoji)}
                className="emoji-reaction-btn"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}