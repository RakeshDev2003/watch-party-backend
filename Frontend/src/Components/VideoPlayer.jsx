import React, { useEffect, useRef, useState, useCallback } from "react";
import { Lock, RefreshCw, Volume2, VolumeX, Play, AlertCircle, Sparkles } from "lucide-react";
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
  reactions = [],
  onLocalPlay,
  onLocalPause,
  onDurationChange,
  onCurrentTimeChange,
  onSelectNewVideo,
}) {
  const activeVideoId = (videoId && videoId.trim().length > 0) ? videoId.trim() : DEFAULT_VIDEO_ID;
  const containerWrapperRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const isMountedRef = useRef(true);

  const [isReady, setIsReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

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

    loadYouTubeIframeAPI().then((YT) => {
      if (!isMountedRef.current || !mountDiv) return;

      try {
        playerInstanceRef.current = new YT.Player(mountDiv, {
          videoId: activeVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            playsinline: 1,
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
                // If room is already playing, attempt to sync playback
                if (isPlaying) {
                  const playPromise = event.target.playVideo();
                  // Check if browser blocked unmuted autoplay
                  setTimeout(() => {
                    if (event.target.getPlayerState && event.target.getPlayerState() !== YT.PlayerState.PLAYING) {
                      setAutoplayBlocked(true);
                    }
                  }, 800);
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
          if (isPlaying && playerInstanceRef.current.playVideo) {
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
  }, [activeVideoId, isReady, isPlaying]);

  // Sync Explicit Seek Commands
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

  // Sync Play / Pause State
  useEffect(() => {
    if (!isReady || !playerInstanceRef.current || !window.YT) return;
    const player = playerInstanceRef.current;

    try {
      const state = player.getPlayerState ? player.getPlayerState() : -1;

      if (isPlaying) {
        if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING && player.playVideo) {
          isInternalUpdateRef.current = true;
          player.playVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 600);
        }
      } else {
        if ((state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) && player.pauseVideo) {
          isInternalUpdateRef.current = true;
          player.pauseVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 600);
        }
      }
    } catch (err) {}
  }, [isPlaying, isReady]);

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
    }, 500);

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
        setAutoplayBlocked(false);
      }

      if (canControl) {
        if (state === window.YT.PlayerState.PLAYING) {
          onLocalPlay && onLocalPlay(curTime);
        } else if (state === window.YT.PlayerState.PAUSED) {
          onLocalPause && onLocalPause(curTime);
        }
      } else {
        // Participant cannot control room playback: enforce sync with room state
        if (state === window.YT.PlayerState.PLAYING && !isPlaying && player?.pauseVideo) {
          isInternalUpdateRef.current = true;
          player.pauseVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 300);
        } else if (state === window.YT.PlayerState.PAUSED && isPlaying && player?.playVideo) {
          isInternalUpdateRef.current = true;
          player.playVideo();
          setTimeout(() => { isInternalUpdateRef.current = false; }, 300);
        }
      }
    } catch (e) {}
  };

  const handleUnmuteAndJoin = () => {
    try {
      if (playerInstanceRef.current) {
        if (playerInstanceRef.current.unMute) playerInstanceRef.current.unMute();
        if (playerInstanceRef.current.playVideo) playerInstanceRef.current.playVideo();
      }
    } catch (e) {}
    setAutoplayBlocked(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%", // 16:9 Aspect Ratio
        background: "#000000",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Floating Emoji Reactions Overlay */}
      <EmojiReactions reactions={reactions} />

      {/* Embedded YouTube IFrame Container */}
      <div
        ref={containerWrapperRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Autoplay / Click to Unmute & Sync Overlay */}
      {autoplayBlocked && !playerError && (
        <div
          onClick={handleUnmuteAndJoin}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(9, 13, 22, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 25,
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)",
              marginBottom: "14px",
              animation: "pulseDot 2s infinite",
            }}
          >
            <Play size={28} fill="#ffffff" style={{ marginLeft: "4px" }} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>
            Click to Join Live Stream
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "340px", margin: 0 }}>
            Browser requires a click to enable synchronized video & audio.
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {playerError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(10, 15, 26, 0.92)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              color: "#f87171",
              fontSize: "24px",
            }}
          >
            ⚠️
          </div>
          <h4 style={{ margin: "0 0 6px 0", color: "#f87171", fontSize: "16px" }}>
            Video Embedding Restricted
          </h4>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)", maxWidth: "420px" }}>
            {playerError}
          </p>
          {canControl && onSelectNewVideo && (
            <button
              onClick={() => onSelectNewVideo(DEFAULT_VIDEO_ID)}
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                borderRadius: "var(--radius-full)",
                marginBottom: "12px",
              }}
            >
              <RefreshCw size={14} />
              <span>Load Verified Default Video</span>
            </button>
          )}
          <p style={{ margin: 0, fontSize: "12px", color: "var(--primary-light)" }}>
            💡 Tip: Choose another video from the presets below or paste any YouTube video link.
          </p>
        </div>
      )}

      {/* Participant Sync Badge */}
      {!canControl && !playerError && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "var(--text-muted)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <Lock size={12} color="#94a3b8" />
          <span>Synced with Host</span>
        </div>
      )}
    </div>
  );
}