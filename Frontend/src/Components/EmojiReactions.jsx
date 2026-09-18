import React, { useEffect, useState } from "react";

export default function EmojiReactions({ reactions = [] }) {
  const [activeReactions, setActiveReactions] = useState([]);

  useEffect(() => {
    if (reactions.length > 0) {
      const latest = reactions[reactions.length - 1];
      const newReaction = {
        ...latest,
        id: latest.id || Math.random(),
        left: Math.floor(Math.random() * 70) + 15, // between 15% and 85%
      };

      setActiveReactions((prev) => [...prev.slice(-15), newReaction]);

      const timer = setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2400);

      return () => clearTimeout(timer);
    }
  }, [reactions]);

  return (
    <div className="emoji-reactions-container">
      {activeReactions.map((item) => (
        <div
          key={item.id}
          className="floating-reaction"
          style={{
            left: `${item.left}%`,
            bottom: "40px",
          }}
        >
          <span>{item.emoji}</span>
        </div>
      ))}
    </div>
  );
}
