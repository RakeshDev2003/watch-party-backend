import React, { useEffect, useRef, useState, useCallback } from "react";
import { Lock, RefreshCw, Volume2, VolumeX, Play, Pause, AlertCircle, Sparkles, Radio, Zap } from "lucide-react";
import EmojiReactions from "./EmojiReactions";
import { DEFAULT_VIDEO_ID } from "../utils/youtube";

// Global script load promise to prevent multiple <script> injections
let ytScriptPromise = null;
const loadYouTubeIframeAPI = () => {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (!ytScriptPromise) {
    ytScriptPromise = new Promise((resolve) => {
      const existingScript = document.getElementById("yt-iframe-api-script");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      // Check if onYouTubeIframeAPIReady already existed
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        resolve(window.YT);
      };

      // Fallback interval check in case event was missed
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          resolve(window.YT);
        }
      }, 100);
    });
  }
  return ytScriptPromise;
};

export default function VideoPlayer({
  videoId,
  isPlaying,
  remoteSeekTarget, // { time: number, timestamp: number }
  canControl = false,
  isParticipantLocallyPaused = false,
  hostLiveTime = 0,
  reactions = [],
  isFullscreen = false,
  onToggleFullscreen,
  onLocalPlay,
  onLocalPause,
  onParticipantPlay,
  onParticipantPause,
  onDurationChange,
  onCurrentTimeChange,
  onSelectNewVideo,
}) {
  const activeVideoId = (videoId && videoId.trim().length > 0) ? videoId.trim() : DEFAULT_VIDEO_ID;
  const playerOuterRef = useRef(null);
  const containerWrapperRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const isMountedRef = useRef(true);

  const [isReady, setIsReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [isMutedByAutoplay, setIsMutedByAutoplay] = useState(false);
  const [localPlayingState, setLocalPlayingState] = useState(false);

  // Unmute helper
  const handleUnmute = useCallback(() => {
    try {
      if (playerInstanceRef.current) {
        if (playerInstanceRef.current.unMute) playerInstanceRef.current.unMute();
        if (playerInstanceRef.current.setVolume) playerInstanceRef.current.setVolume(100);
        if (playerInstanceRef.current.playVideo) playerInstanceRef.current.playVideo();
      }
    } catch (e) {}
    setIsMutedByAutoplay(false);
  }, []);

  // Initialize or re-create the YouTube player instance
  const initPlayer = useCallback(() => {
    if (!containerWrapperRef.current) return;

    // Destroy existing player if any
    try {
      if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    } catch (e) {}

    // Ensure target div exists inside wrapper
    containerWrapperRef.current.innerHTML = "";
    const mountDiv = document.createElement("div");
    mountDiv.style.width = "100%";
    mountDiv.style.height = "100%";
    containerWrapperRef.current.appendChild(mountDiv);

    const initialStartTime = Math.max(0, remoteSeekTarget?.time || 0);

    loadYouTubeIframeAPI().then((YT) => {
      if (!isMountedRef.current || !mountDiv) return;

      try {
        playerInstanceRef.current = new YT.Player(mountDiv, {
          videoId: activeVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            start: Math.floor(initialStartTime),
            controls: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (!isMountedRef.current) return;
              setIsReady(true);
              setPlayerError(null);
              try {
                const dur = event.target.getDuration();
                if (onDurationChange && dur) {
                  onDurationChange(dur);
                }

                // Initial seek to accurate live time
                if (initialStartTime > 0) {
                  event.target.seekTo(initialStartTime, true);
                }

                // If room is playing and participant is not locally paused, auto play immediately
                if (isPlaying && !isParticipantLocallyPaused) {
                  const playRes = event.target.playVideo();

                  // Browser unmuted autoplay policy detection
                  setTimeout(() => {
                    if (!isMountedRef.current) return;
                    const st = event.target.getPlayerState ? event.target.getPlayerState() : -1;
                    if (st !== YT.PlayerState.PLAYING && st !== YT.PlayerState.BUFFERING) {
                      // Attempt muted autoplay so video starts rolling automatically
                      try {
                        event.target.mute();
                        event.target.playVideo();
                        setIsMutedByAutoplay(true);
                      } catch (err) {}
                    }
                  }, 600);
                }
              } catch (e) {}
            },
            onStateChange: (event) => {
              if (!isMountedRef.current) return;
              handlePlayerStateChange(event);
            },
            onError: (e) => {
              if (!isMountedRef.current) return;
              console.warn("YouTube Player Error code:", e?.data);
              const code = e?.data;
              let msg = "Playback failed for this video.";
              if (code === 101 || code === 150) {
                msg = "This video's owner disabled playback in third-party embedded players.";
              } else if (code === 100) {
                msg = "This video was not found or has been marked private by YouTube.";
              } else if (code === 2) {
                msg = "Invalid YouTube video link or ID.";
              }
              setPlayerError(msg);
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize YouTube Player:", err);
      }
    });
  }, [activeVideoId]);

  // Mount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    initPlayer();

    return () => {
      isMountedRef.current = false;
      try {
        if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
          playerInstanceRef.current.destroy();
          playerInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, [activeVideoId, initPlayer]);

  // Sync Video ID changes
  useEffect(() => {
    setPlayerError(null);
    if (!isReady || !playerInstanceRef.current) return;

    try {
      const currentLoadedId =
        playerInstanceRef.current.getVideoData &&
        playerInstanceRef.current.getVideoData().video_id;

      if (!currentLoadedId || currentLoadedId !== activeVideoId) {
        isInternalUpdateRef.current = true;
        const startSec = remoteSeekTarget?.time || 0;
        if (playerInstanceRef.current.loadVideoById) {
          playerInstanceRef.current.loadVideoById({
            videoId: activeVideoId,
            startSeconds: startSec,
          });
          if (isPlaying && !isParticipantLocallyPaused && playerInstanceRef.current.playVideo) {
            playerInstanceRef.current.playVideo();
          }
        }
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 800);
      }
    } catch (e) {
      console.warn("Video switch warning:", e.message);
    }
  }, [activeVideoId, isReady, isPlaying, isParticipantLocallyPaused]);

  // Sync Explicit Remote Seek Commands from Host
  useEffect(() => {
    if (!isReady || !playerInstanceRef.current || !remoteSeekTarget) return;

    try {
      const targetTime = remoteSeekTarget.time || 0;
      const player = playerInstanceRef.current;
      const curTime = player.getCurrentTime ? player.getCurrentTime() : 0;

      if (Math.abs(curTime - targetTime) > 1.2) {
        isInternalUpdateRef.current = true;
        player.seekTo(targetTime, true);
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 600);
      }
    } catch (e) {}
  }, [remoteSeekTarget, isReady]);

  // Sync Play / Pause State (Room vs Local)
  useEffect(() => {
    if (!isReady || !playerInstanceRef.current || !window.YT) return;
    const player = playerInstanceRef.current;

    try {
      const state = player.getPlayerState ? player.getPlayerState() : -1;

      // If room is playing and participant is NOT locally paused
      if (isPlaying && !isParticipantLocallyPaused) {
        if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING && player.playVideo) {
          isInternalUpdateRef.current = true;
          player.playVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 600);
        }
      } else {
        // Room is paused OR participant locally paused
        if ((state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) && player.pauseVideo) {
          isInternalUpdateRef.current = true;
          player.pauseVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 600);
        }
      }
    } catch (err) {}
  }, [isPlaying, isParticipantLocallyPaused, isReady]);

  // Periodic local scrubber update for smooth timeline
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      try {
        if (playerInstanceRef.current && playerInstanceRef.current.getCurrentTime) {
          const cur = playerInstanceRef.current.getCurrentTime();
          const dur = playerInstanceRef.current.getDuration();
          if (onCurrentTimeChange && typeof cur === "number") onCurrentTimeChange(cur);
          if (onDurationChange && typeof dur === "number" && dur > 0) onDurationChange(dur);
        }
      } catch (e) {}
    }, 400);

    return () => clearInterval(interval);
  }, [isReady, onCurrentTimeChange, onDurationChange]);

  // Handle player state changes
  const handlePlayerStateChange = (event) => {
    if (isInternalUpdateRef.current) return;

    try {
      const state = event.data;
      const player = playerInstanceRef.current;
      const curTime = player && player.getCurrentTime ? player.getCurrentTime() : 0;

      if (state === window.YT.PlayerState.PLAYING) {
        setLocalPlayingState(true);
      } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
        setLocalPlayingState(false);
      }

      if (canControl) {
        // Host / Mod controlling room
        if (state === window.YT.PlayerState.PLAYING) {
          onLocalPlay && onLocalPlay(curTime);
        } else if (state === window.YT.PlayerState.PAUSED) {
          onLocalPause && onLocalPause(curTime);
        }
      }
    } catch (e) {}
  };

  // Main video overlay click action
  const handleOverlayClick = () => {
    // If audio is muted by autoplay policy, unmute immediately on click
    if (isMutedByAutoplay) {
      handleUnmute();
    }

    if (canControl) {
      // Host / Moderator: toggles room-wide play/pause
      try {
        const cur = playerInstanceRef.current?.getCurrentTime?.() || 0;
        if (isPlaying) {
          onLocalPause && onLocalPause(cur);
        } else {
          onLocalPlay && onLocalPlay(cur);
        }
      } catch (e) {}
    } else {
      // Participant: local pause vs catch up to live host
      if (localPlayingState && !isParticipantLocallyPaused) {
        // Pause locally
        onParticipantPause && onParticipantPause();
      } else {
        // Resume & automatically jump to live host time!
        onParticipantPlay && onParticipantPlay();
      }
    }
  };

  return (
    <div
      id="main-video-player-container"
      ref={playerOuterRef}
      className={`video-player-container ${isFullscreen ? "video-player-fullscreen" : ""}`}
    >
      {/* Floating Emoji Reactions Overlay */}
      <EmojiReactions reactions={reactions} />

      {/* Embedded YouTube IFrame Container */}
      <div className="video-iframe-wrapper">
        <div
          ref={containerWrapperRef}
          className="video-iframe-inner"
        />
      </div>

      {/* Transparent Clickable Overlay for Play/Pause and Fullscreen */}
      <div
        onClick={handleOverlayClick}
        onDoubleClick={onToggleFullscreen}
        className="video-click-overlay"
        title={
          canControl
            ? isPlaying
              ? "Click to Pause Room (Double-click Fullscreen)"
              : "Click to Play Room (Double-click Fullscreen)"
            : isParticipantLocallyPaused
            ? "Click to Play & Catch Up Live to Host (Double-click Fullscreen)"
            : "Click to Pause Video Locally (Double-click Fullscreen)"
        }
      />

      {/* Participant Local Pause Indicator Badge */}
      {!canControl && isParticipantLocallyPaused && !playerError && (
        <div
          onClick={handleOverlayClick}
          className="player-badge-local-pause"
        >
          <Pause size={13} color="#f87171" fill="#f87171" />
          <span className="player-badge-local-pause-text">
            Paused Locally &bull; Click to Sync Live with Host
          </span>
          <Zap size={13} color="#fbbf24" />
        </div>
      )}

      {/* Live Synced Indicator Badge for Participant */}
      {!canControl && !isParticipantLocallyPaused && isPlaying && !playerError && (
        <div className="player-badge-live-sync">
          <div className="player-badge-live-dot" />
          <span className="player-badge-live-text">
            LIVE SYNC
          </span>
        </div>
      )}

      {/* Floating Unmute Audio Pill (When browser autoplayed muted) */}
      {isMutedByAutoplay && !playerError && (
        <div
          onClick={handleUnmute}
          className="player-pill-unmute"
        >
          <Volume2 size={16} color="#ffffff" />
          <span className="player-pill-unmute-text">
            Click to Unmute Audio 🔊
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {playerError && (
        <div className="player-error-overlay">
          <div className="player-error-icon-box">
            ⚠️
          </div>
          <h4 className="player-error-title">
            Video Embedding Restricted
          </h4>
          <p className="player-error-desc">
            {playerError}
          </p>
          {canControl && onSelectNewVideo && (
            <button
              onClick={() => onSelectNewVideo(DEFAULT_VIDEO_ID)}
              className="btn btn-primary player-error-action-btn"
            >
              <RefreshCw size={14} />
              <span>Load Verified Default Video</span>
            </button>
          )}
          <p className="player-error-tip">
            💡 Tip: Choose another video from the presets below or paste any YouTube video link.
          </p>
        </div>
      )}
    </div>
  );
}