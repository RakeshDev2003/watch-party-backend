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
  Radio,
  Zap,
} from "lucide-react";
import { formatDuration, extractYouTubeId, PRESET_VIDEOS } from "../utils/youtube";

const REACTION_EMOJIS = ["❤️", "🔥", "👏", "😂", "🍿", "🎉"];

export default function RoomControls({
  videoId,
  isPlaying,
  currentTime,
  hostLiveTime = 0,
  duration,
  canControl,
  isParticipantLocallyPaused = false,
  isFullscreen = false,
  onToggleFullscreen,
  onSkipBackward,
  onSkipForward,
  onSkipNextVideo,
  onPlay,
  onPause,
  onParticipantPlay,
  onParticipantPause,
  onCatchUpLive,
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

    const extractedId = extractYouTubeId(videoUrlInput);
    if (!extractedId) {
      setUrlError("Could not detect a valid YouTube Video ID from that link.");
      return;
    }

    onChangeVideo(extractedId);
    setVideoUrlInput("");
    setShowPresets(false);
  };

  const handleSelectPreset = (presetVideoId) => {
    onChangeVideo(presetVideoId);
    setShowPresets(false);
    setUrlError("");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Calculate if participant is behind the host
  const timeDifference = Math.max(0, (hostLiveTime || 0) - (currentTime || 0));
  const isBehindHost = timeDifference > 3;

  return (
    <div className="glass-panel room-controls-card">
      {/* 1. Direct YouTube Link Input Bar (Always accessible for Host/Mod) */}
      {canControl && (
        <div className="controls-direct-url-section">
          <form onSubmit={handleDirectVideoSubmit}>
            <div className="controls-input-row">
              <div className="controls-url-wrapper">
                <input
                  type="text"
                  className="input-control controls-url-input"
                  placeholder="Paste YouTube URL or Video ID (e.g. https://www.youtube.com/watch?v=...)"
                  value={videoUrlInput}
                  onChange={(e) => {
                    setVideoUrlInput(e.target.value);
                    if (urlError) setUrlError("");
                  }}
                />
                <Film
                  size={15}
                  color="#c084fc"
                  className="controls-url-icon"
                />
              </div>

              <div className="controls-action-btns">
                <button
                  type="submit"
                  className="btn btn-primary controls-submit-btn"
                >
                  <span>Load Video</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="btn btn-secondary controls-preset-toggle-btn"
                  title="Browse quick video presets"
                >
                  <Sparkles size={14} color="#fbbf24" />
                  <span>Presets</span>
                </button>
              </div>
            </div>
          </form>

          {urlError && (
            <p className="controls-url-error">
              ⚠️ {urlError}
            </p>
          )}

          {/* Quick Preset Dropdown */}
          {showPresets && (
            <div className="presets-dropdown-grid">
              {PRESET_VIDEOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className="preset-card-item"
                >
                  <p className="preset-card-title">
                    {preset.title}
                  </p>
                  <span className="preset-card-category">
                    {preset.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Progress Scrubber */}
      <div className="scrubber-container">
        <span className="scrubber-time">
          {formatDuration(currentTime)}
        </span>

        <div className="scrubber-track-wrapper">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime || 0}
            onChange={handleSeekChange}
            disabled={!canControl}
            className="scrubber-input-range"
            style={{
              cursor: canControl ? "pointer" : "default",
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
        </div>

        <span className="scrubber-time scrubber-time-dim">
          {formatDuration(duration)}
        </span>
      </div>

      {/* 3. Playback Controls & Emoji Bar */}
      <div className="playback-bar-container">
        {/* Main Controls Row */}
        <div className="playback-main-row">
          {/* Primary Controls */}
          <div className="playback-primary-group">
            {canControl ? (
              // HOST / MODERATOR CONTROLS
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
                    title="Pause video for everyone in room"
                  >
                    <Pause size={16} fill="#fca5a5" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={onPlay}
                    className="btn btn-primary control-btn control-play-btn"
                    title="Play video for everyone in room"
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
              // PARTICIPANT CONTROLS (Local Pause / Play with Instant Auto-Sync to Host Live Time)
              <>
                {isParticipantLocallyPaused ? (
                  <button
                    onClick={onParticipantPlay}
                    className="btn btn-primary control-btn control-play-btn participant-live-play-btn"
                    title="Resume and automatically catch up to host's live video"
                  >
                    <Play size={16} fill="#ffffff" />
                    <span>Play (Live Sync)</span>
                    <Zap size={13} color="#fef08a" />
                  </button>
                ) : (
                  <button
                    onClick={onParticipantPause}
                    className="btn btn-secondary control-btn control-play-btn"
                    title="Pause your local video playback"
                  >
                    <Pause size={16} fill="#94a3b8" />
                    <span>Pause (Local)</span>
                  </button>
                )}

                {/* Catch up live button if behind */}
                {(isBehindHost || isParticipantLocallyPaused) && isPlaying && (
                  <button
                    type="button"
                    onClick={onCatchUpLive}
                    className="btn btn-secondary control-btn participant-catchup-btn"
                    title={`Catch up ${Math.round(timeDifference)}s to host's live position`}
                  >
                    <Radio size={13} color="#fbbf24" />
                    <span>Catch Up to Live {timeDifference > 3 ? `(+${Math.round(timeDifference)}s)` : ""}</span>
                  </button>
                )}

                {!isParticipantLocallyPaused && !isBehindHost && isPlaying && (
                  <div className="playback-locked-badge">
                    <div className="pulse-dot" />
                    <span>Live with Host</span>
                  </div>
                )}
              </>
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