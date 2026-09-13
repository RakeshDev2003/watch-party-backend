/**
 * YouTube Utility functions: ID extraction & preset suggestions
 */

export const extractYouTubeId = (urlOrId) => {
  if (!urlOrId) return null;
  let input = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Comprehensive YouTube URL regex supporting:
  // - youtube.com/watch?v=...
  // - youtu.be/...
  // - youtube.com/embed/...
  // - youtube.com/v/...
  // - youtube.com/shorts/...
  // - youtube.com/live/...
  // - music.youtube.com/watch?v=...
  // - m.youtube.com/watch?v=...
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:.*?&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback: extract any 11-char alphanumeric string from URL path or query
  const fallback = input.match(/(?:[=/]|^)([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
  if (fallback && fallback[1]) {
    return fallback[1];
  }

  return null;
};

export const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins < 10 ? `0${mins}` : mins;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;
  return `${formattedMins}:${formattedSecs}`;
};

export const DEFAULT_VIDEO_ID = "nSDgHBxUbVQ";

/**
 * 7 Exact Requested Songs (Official Versions)
 */
export const PRESET_VIDEOS = [
  {
    id: "nSDgHBxUbVQ",
    title: "Photograph",
    category: "Ed Sheeran",
  },
  {
    id: "XFkzRNyygfk",
    title: "Creep",
    category: "Radiohead",
  },
  {
    id: "5qF_qBaWt3Q",
    title: "Waiting for the End",
    category: "Linkin Park",
  },
  {
    id: "gS9o1FAszdk",
    title: "The Man Who Can't Be Moved",
    category: "The Script",
  },
  {
    id: "3pPq_P-i7mE",
    title: "Sailor Song",
    category: "Gigi Perez",
  },
  {
    id: "FxnPe02YoP8",
    title: "She's Gone",
    category: "Steelheart",
  },
  {
    id: "bL74qFw38Xo",
    title: "Khat",
    category: "Navjot Ahuja",
  },
];








