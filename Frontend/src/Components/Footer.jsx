import React from "react";
import { Code2, Play, Zap, Film } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">

        <div className="footer-left">
          <div className="footer-brand">
            <div className="footer-logo">
              <Play size={14} color="#ffffff" fill="#ffffff" />
            </div>
            <span className="footer-title">WatchParty</span>
            <span className="footer-badge">SYNC</span>
          </div>
          <p className="footer-desc">
            Watch YouTube together in perfect sync with friends anywhere.
          </p>
          <span className="footer-copy">© 2026 WatchParty. All rights reserved.</span>
        </div>


        <div className="footer-center">
          <div className="creator-card">
            <Code2 size={15} className="dev-icon" />
            <span>Designed & Developed by</span>
            <span className="creator-name">Rakesh</span>
          </div>
        </div>


        <div className="footer-right">
          <div className="footer-pill">
            <Zap size={13} color="#fbbf24" />
            <span>Real-time Sync</span>
          </div>
          <div className="footer-pill">
            <Film size={13} color="#c084fc" />
            <span>YouTube Stream</span>
          </div>
          <div className="footer-status">
            <div className="status-dot" />
            <span>System Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
