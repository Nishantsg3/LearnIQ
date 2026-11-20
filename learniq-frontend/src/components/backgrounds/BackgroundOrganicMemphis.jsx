import React from 'react';

/**
 * Direction 1: Organic Memphis (Corner Blobs & Geometric Accents)
 * Inspired by user Reference Image 1.
 * Fluid corner blobs, floating shaded gradient orbs, dotted texture matrices,
 * squiggles, crosses, open circles, and expansive clean negative space.
 */
const BackgroundOrganicMemphis = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
    >
      {/* ── LIGHT MODE SVG CANVAS ────────────────────────────────────────── */}
      <svg
        className="dark:hidden absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Top-Left Fluid Blob Gradient */}
          <linearGradient id="memphis-tl-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.25" />
          </linearGradient>

          {/* Bottom-Right Fluid Blob Gradient */}
          <linearGradient id="memphis-br-light" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.30" />
            <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.25" />
          </linearGradient>

          {/* Floating Orb 1 (Top-Left) Radial Gradient */}
          <radialGradient id="orb-tl-light" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.5" />
          </radialGradient>

          {/* Floating Orb 2 (Right Edge) Radial Gradient */}
          <radialGradient id="orb-br-light" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.5" />
          </radialGradient>

          {/* Dotted Cluster Pattern */}
          <pattern id="dot-matrix-light" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="2" fill="#475569" fillOpacity="0.18" />
          </pattern>
        </defs>

        {/* ── TOP-LEFT ORGANIC BLOB ──────────────────────── */}
        <path
          d="M-40,-30 C180,-40 380,40 420,160 C460,280 340,380 220,380 C100,380 -20,440 -60,400 Z"
          fill="url(#memphis-tl-light)"
        />

        {/* ── BOTTOM-RIGHT ORGANIC BLOB ───────────────────── */}
        <path
          d="M1500,940 C1300,950 1120,860 1100,720 C1080,580 1200,480 1300,420 C1400,360 1480,240 1520,200 Z"
          fill="url(#memphis-br-light)"
        />

        {/* ── FLOATING SHADED SPHERES ─────────────────────── */}
        <circle cx="340" cy="300" r="62" fill="url(#orb-tl-light)" />
        <circle cx="1120" cy="320" r="58" fill="url(#orb-br-light)" />

        {/* ── DOTTED TEXTURE CLUSTERS ─────────────────────── */}
        {/* Top-Left Grid */}
        <rect x="40" y="40" width="128" height="80" rx="6" fill="url(#dot-matrix-light)" />
        {/* Bottom-Left Grid */}
        <rect x="60" y="720" width="144" height="112" rx="6" fill="url(#dot-matrix-light)" />
        {/* Center-Right Grid */}
        <rect x="1080" y="460" width="112" height="128" rx="6" fill="url(#dot-matrix-light)" />

        {/* ── DECORATIVE DOODLES (Squiggles, Crosses, Circles) ─ */}
        <g stroke="#334155" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Sine Squiggle Left */}
          <path d="M 450,150 Q 460,165 470,150 T 490,150 T 510,150 T 530,150" />
          <path d="M 210,500 Q 220,515 230,500 T 250,500 T 270,500" />
          {/* Sine Squiggle Right */}
          <path d="M 1240,640 Q 1250,655 1260,640 T 1280,640 T 1300,640 T 1320,640" />

          {/* Minimalist Open Circles */}
          <circle cx="1200" cy="180" r="8" />
          <circle cx="1060" cy="510" r="10" />
          <circle cx="260" cy="850" r="9" />

          {/* Plus / Cross Marks */}
          <path d="M 640,780 L 656,796 M 656,780 L 640,796" />
          <path d="M 800,120 L 812,132 M 812,120 L 800,132" />

          {/* Minimal Chevron */}
          <path d="M 820,160 L 832,174 L 844,160" />
          <path d="M 1280,840 L 1280,854 L 1294,854" />
        </g>
      </svg>

      {/* ── DARK MODE SVG CANVAS ─────────────────────────────────────────── */}
      <svg
        className="hidden dark:block absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Top-Left Dark Blob Gradient */}
          <linearGradient id="memphis-tl-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#312e81" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.25" />
          </linearGradient>

          {/* Bottom-Right Dark Blob Gradient */}
          <linearGradient id="memphis-br-dark" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#581c87" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#701a75" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.20" />
          </linearGradient>

          {/* Floating Orb 1 Dark Radial */}
          <radialGradient id="orb-tl-dark" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#4f46e5" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.80" />
          </radialGradient>

          {/* Floating Orb 2 Dark Radial */}
          <radialGradient id="orb-br-dark" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#9333ea" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.80" />
          </radialGradient>

          {/* Dotted Cluster Dark */}
          <pattern id="dot-matrix-dark" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="2" fill="#cbd5e1" fillOpacity="0.14" />
          </pattern>
        </defs>

        {/* ── TOP-LEFT ORGANIC BLOB ──────────────────────── */}
        <path
          d="M-40,-30 C180,-40 380,40 420,160 C460,280 340,380 220,380 C100,380 -20,440 -60,400 Z"
          fill="url(#memphis-tl-dark)"
        />

        {/* ── BOTTOM-RIGHT ORGANIC BLOB ───────────────────── */}
        <path
          d="M1500,940 C1300,950 1120,860 1100,720 C1080,580 1200,480 1300,420 C1400,360 1480,240 1520,200 Z"
          fill="url(#memphis-br-dark)"
        />

        {/* ── FLOATING SHADED SPHERES ─────────────────────── */}
        <circle cx="340" cy="300" r="62" fill="url(#orb-tl-dark)" />
        <circle cx="1120" cy="320" r="58" fill="url(#orb-br-dark)" />

        {/* ── DOTTED TEXTURE CLUSTERS ─────────────────────── */}
        <rect x="40" y="40" width="128" height="80" rx="6" fill="url(#dot-matrix-dark)" />
        <rect x="60" y="720" width="144" height="112" rx="6" fill="url(#dot-matrix-dark)" />
        <rect x="1080" y="460" width="112" height="128" rx="6" fill="url(#dot-matrix-dark)" />

        {/* ── DECORATIVE DOODLES ─────────────────────────── */}
        <g stroke="#f1f5f9" strokeOpacity="0.22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 450,150 Q 460,165 470,150 T 490,150 T 510,150 T 530,150" />
          <path d="M 210,500 Q 220,515 230,500 T 250,500 T 270,500" />
          <path d="M 1240,640 Q 1250,655 1260,640 T 1280,640 T 1300,640 T 1320,640" />
          <circle cx="1200" cy="180" r="8" />
          <circle cx="1060" cy="510" r="10" />
          <circle cx="260" cy="850" r="9" />
          <path d="M 640,780 L 656,796 M 656,780 L 640,796" />
          <path d="M 800,120 L 812,132 M 812,120 L 800,132" />
          <path d="M 820,160 L 832,174 L 844,160" />
          <path d="M 1280,840 L 1280,854 L 1294,854" />
        </g>
      </svg>
    </div>
  );
};

export default BackgroundOrganicMemphis;
