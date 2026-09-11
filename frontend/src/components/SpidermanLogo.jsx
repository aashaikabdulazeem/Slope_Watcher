import React from 'react';

export default function SpidermanLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head/Face */}
      <circle cx="20" cy="18" r="12" fill="#E63946" stroke="#1A1A1A" strokeWidth="1.5"/>
      
      {/* Left Eye */}
      <ellipse cx="15" cy="16" rx="2.5" ry="3.5" fill="white"/>
      <circle cx="15" cy="16" r="1.5" fill="black"/>
      
      {/* Right Eye */}
      <ellipse cx="25" cy="16" rx="2.5" ry="3.5" fill="white"/>
      <circle cx="25" cy="16" r="1.5" fill="black"/>
      
      {/* Mouth - Web Pattern Style */}
      <path d="M 18 20 Q 20 21 22 20" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      
      {/* Web Pattern on Face */}
      <line x1="20" y1="6" x2="20" y2="12" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="20" y1="24" x2="20" y2="30" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="8" y1="18" x2="14" y2="18" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="26" y1="18" x2="32" y2="18" stroke="#FDB833" strokeWidth="0.8"/>
      
      {/* Diagonal web lines */}
      <line x1="12" y1="10" x2="16" y2="14" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="28" y1="10" x2="24" y2="14" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="12" y1="26" x2="16" y2="22" stroke="#FDB833" strokeWidth="0.8"/>
      <line x1="28" y1="26" x2="24" y2="22" stroke="#FDB833" strokeWidth="0.8"/>
      
      {/* Nose - small red triangular shape */}
      <path d="M 20 17 L 18 19 L 22 19 Z" fill="#A71C1C"/>
    </svg>
  );
}
