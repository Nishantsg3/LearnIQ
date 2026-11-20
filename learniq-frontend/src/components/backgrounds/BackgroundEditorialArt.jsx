import React from 'react';

/**
 * BackgroundEditorialArt — Ambient Architectural & Geometric Canvas
 *
 * Renders an ambient background canvas using:
 * - Dual-theme radial foundation gradients (warm silver in light mode, obsidian slate in dark mode).
 * - Layered SVG architectural geometry, linear gradient ribbons, and hairline vector paths.
 * - Hardware-accelerated CSS opacity transitions for smooth theme switching.
 */
const BackgroundEditorialArt = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#F2F3F7] dark:bg-[#0A0C10]"
    >
      {/* ── AMBIENT FOUNDATION GRADIENT ─────────────────────────────────── */}
      <div className="absolute inset-0 opacity-100 transition-opacity duration-700">
        {/* Light mode: Sculptural architectural tone with warm linen & mineral silver split */}
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(218,222,233,0.7)_0%,rgba(242,243,247,0.9)_60%,#ECEEF3_100%)]" />
        {/* Dark mode: Deep obsidian space with dense midnight-indigo atmospheric floor */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(24,28,42,0.8)_0%,rgba(10,12,16,0.95)_60%,#07080B_100%)]" />
      </div>

      {/* ── LAYER 1: ARCHITECTURAL VECTOR GEOMETRY & CURVES (VISIBLE ART) ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Light Mode Gradients */}
          <linearGradient id="art-ribbon-light-1" x1="1200" y1="0" x2="600" y2="700" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.16" />
            <stop offset="40%" stopColor="#818CF8" stopOpacity="0.10" />
            <stop offset="85%" stopColor="#C7D2FE" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="art-ribbon-light-2" x1="100" y1="900" x2="800" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="art-stroke-light-1" x1="1300" y1="50" x2="700" y2="650" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338CA" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#6366F1" stopOpacity="0.30" />
            <stop offset="80%" stopColor="#A5B4FC" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="art-stroke-light-2" x1="200" y1="850" x2="750" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0369A1" stopOpacity="0.40" />
            <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0" />
          </linearGradient>

          {/* Dark Mode Gradients */}
          <linearGradient id="art-ribbon-dark-1" x1="1200" y1="0" x2="600" y2="700" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
            <stop offset="35%" stopColor="#8B5CF6" stopOpacity="0.18" />
            <stop offset="70%" stopColor="#4F46E5" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="art-ribbon-dark-2" x1="100" y1="900" x2="800" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.24" />
            <stop offset="45%" stopColor="#06B6D4" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#082F49" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="art-stroke-dark-1" x1="1300" y1="50" x2="700" y2="650" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.70" />
            <stop offset="30%" stopColor="#818CF8" stopOpacity="0.45" />
            <stop offset="75%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="art-stroke-dark-2" x1="200" y1="850" x2="750" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
          </linearGradient>

          {/* Grain Filter for Tactile Editorial Surface */}
          <filter id="editorial-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.04 0" />
          </filter>
        </defs>

        {/* ── LIGHT MODE ARTISTIC VECTOR SHAPES ── */}
        <g className="dark:hidden transition-all duration-700">
          {/* Primary Sweeping Architectural Form (Top-Right) */}
          <path
            d="M850 -60 C1050 40 1280 180 1480 320 L1500 -60 Z"
            fill="url(#art-ribbon-light-1)"
          />
          <path
            d="M620 -80 C880 120 1140 320 1460 520 L1460 180 C1200 60 920 -40 620 -80 Z"
            fill="url(#art-ribbon-light-1)"
          />
          <path
            d="M480 -80 C740 160 1020 420 1380 660 L1440 600 C1100 380 840 140 540 -80 Z"
            fill="url(#art-ribbon-light-1)"
            opacity="0.8"
          />

          {/* Primary Master Contour Lines */}
          <path
            d="M480 -80 C740 160 1020 420 1380 660"
            stroke="url(#art-stroke-light-1)"
            strokeWidth="1.5"
            strokeDasharray="none"
          />
          <path
            d="M560 -80 C800 150 1070 390 1420 610"
            stroke="url(#art-stroke-light-1)"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.6"
          />
          <path
            d="M680 -80 C900 130 1140 340 1460 520"
            stroke="url(#art-stroke-light-1)"
            strokeWidth="1"
            opacity="0.8"
          />

          {/* Secondary Counter-Curved Sculptural Wing (Bottom-Left) */}
          <path
            d="M-40 620 C220 540 480 640 760 840 L680 960 C420 780 180 700 -60 760 Z"
            fill="url(#art-ribbon-light-2)"
          />
          <path
            d="M-60 480 C260 420 560 540 840 760 L800 820 C520 620 240 500 -60 560 Z"
            fill="url(#art-ribbon-light-2)"
            opacity="0.7"
          />

          {/* Secondary Master Contour Lines */}
          <path
            d="M-60 480 C260 420 560 540 840 760"
            stroke="url(#art-stroke-light-2)"
            strokeWidth="1.5"
          />
          <path
            d="M-50 560 C240 490 510 590 780 800"
            stroke="url(#art-stroke-light-2)"
            strokeWidth="1"
            strokeDasharray="6 8"
            opacity="0.5"
          />
          <path
            d="M-40 640 C220 570 460 650 720 840"
            stroke="url(#art-stroke-light-2)"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Architectural Alignment Nodes & Precision Coordinate Accents */}
          <g opacity="0.45" stroke="#475569" strokeWidth="1">
            {/* Top-Right Crosshairs & Elevation Ticks */}
            <line x1="1100" y1="180" x2="1120" y2="180" />
            <line x1="1110" y1="170" x2="1110" y2="190" />
            <circle cx="1110" cy="180" r="12" fill="none" strokeDasharray="2 2" />

            <line x1="840" y1="360" x2="860" y2="360" />
            <line x1="850" y1="350" x2="850" y2="370" />

            {/* Bottom-Left Precision Crosshair */}
            <line x1="320" y1="620" x2="340" y2="620" />
            <line x1="330" y1="610" x2="330" y2="630" />
            <circle cx="330" cy="620" r="16" fill="none" strokeDasharray="3 3" />
          </g>

          {/* Editorial Micro-Typography Watermarks (Architectural Coordinate Spec) */}
          <text x="1130" y="184" fill="#64748B" fontSize="10" fontFamily="monospace" letterSpacing="0.1em" opacity="0.6">
            LOC // 42.36° N, 71.06° W • SEC_01
          </text>
          <text x="80" y="860" fill="#64748B" fontSize="10" fontFamily="monospace" letterSpacing="0.1em" opacity="0.6">
            ELEV // +184.2m • VECTOR_CURVE_B
          </text>
        </g>

        {/* ── DARK MODE ARTISTIC VECTOR SHAPES ── */}
        <g className="hidden dark:block transition-all duration-700">
          {/* Primary Sweeping Architectural Form (Top-Right) */}
          <path
            d="M850 -60 C1050 40 1280 180 1480 320 L1500 -60 Z"
            fill="url(#art-ribbon-dark-1)"
          />
          <path
            d="M620 -80 C880 120 1140 320 1460 520 L1460 180 C1200 60 920 -40 620 -80 Z"
            fill="url(#art-ribbon-dark-1)"
          />
          <path
            d="M480 -80 C740 160 1020 420 1380 660 L1440 600 C1100 380 840 140 540 -80 Z"
            fill="url(#art-ribbon-dark-1)"
            opacity="0.8"
          />

          {/* Primary Master Contour Lines (Specular Neon Hairlines) */}
          <path
            d="M480 -80 C740 160 1020 420 1380 660"
            stroke="url(#art-stroke-dark-1)"
            strokeWidth="1.5"
          />
          <path
            d="M560 -80 C800 150 1070 390 1420 610"
            stroke="url(#art-stroke-dark-1)"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.7"
          />
          <path
            d="M680 -80 C900 130 1140 340 1460 520"
            stroke="url(#art-stroke-dark-1)"
            strokeWidth="1"
            opacity="0.9"
          />

          {/* Secondary Counter-Curved Sculptural Wing (Bottom-Left) */}
          <path
            d="M-40 620 C220 540 480 640 760 840 L680 960 C420 780 180 700 -60 760 Z"
            fill="url(#art-ribbon-dark-2)"
          />
          <path
            d="M-60 480 C260 420 560 540 840 760 L800 820 C520 620 240 500 -60 560 Z"
            fill="url(#art-ribbon-dark-2)"
            opacity="0.75"
          />

          {/* Secondary Master Contour Lines */}
          <path
            d="M-60 480 C260 420 560 540 840 760"
            stroke="url(#art-stroke-dark-2)"
            strokeWidth="1.5"
          />
          <path
            d="M-50 560 C240 490 510 590 780 800"
            stroke="url(#art-stroke-dark-2)"
            strokeWidth="1"
            strokeDasharray="6 8"
            opacity="0.6"
          />
          <path
            d="M-40 640 C220 570 460 650 720 840"
            stroke="url(#art-stroke-dark-2)"
            strokeWidth="1"
            opacity="0.85"
          />

          {/* Architectural Alignment Nodes & Specular Crosshairs */}
          <g opacity="0.65" stroke="#94A3B8" strokeWidth="1">
            <line x1="1100" y1="180" x2="1120" y2="180" />
            <line x1="1110" y1="170" x2="1110" y2="190" />
            <circle cx="1110" cy="180" r="12" fill="none" strokeDasharray="2 2" stroke="#818CF8" />

            <line x1="840" y1="360" x2="860" y2="360" />
            <line x1="850" y1="350" x2="850" y2="370" />

            <line x1="320" y1="620" x2="340" y2="620" />
            <line x1="330" y1="610" x2="330" y2="630" />
            <circle cx="330" cy="620" r="16" fill="none" strokeDasharray="3 3" stroke="#38BDF8" />
          </g>

          {/* Editorial Micro-Typography Watermarks */}
          <text x="1130" y="184" fill="#94A3B8" fontSize="10" fontFamily="monospace" letterSpacing="0.1em" opacity="0.75">
            LOC // 42.36° N, 71.06° W • SEC_01
          </text>
          <text x="80" y="860" fill="#94A3B8" fontSize="10" fontFamily="monospace" letterSpacing="0.1em" opacity="0.75">
            ELEV // +184.2m • VECTOR_CURVE_B
          </text>
        </g>
      </svg>

      {/* ── LAYER 2: SPATIAL FROSTED GLASS DISCS (APPLE VISION PRO DEPTH) ─── */}
      {/* Disc 1: Upper Right Refractive Lens */}
      <div
        className="absolute top-[-80px] right-[-60px] w-[540px] h-[540px] rounded-full pointer-events-none transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 70%, transparent 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.6), 0 24px 48px -12px rgba(99, 102, 241, 0.12)',
        }}
      />
      <div
        className="hidden dark:block absolute top-[-80px] right-[-60px] w-[540px] h-[540px] rounded-full pointer-events-none transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.18) 0%, rgba(99, 102, 241, 0.04) 70%, transparent 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.25), 0 32px 64px -16px rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* Disc 2: Bottom Left Ambient Refractive Lens */}
      <div
        className="absolute bottom-[-100px] left-[-80px] w-[460px] h-[460px] rounded-full pointer-events-none transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.35) 0%, rgba(56, 189, 248, 0.06) 60%, transparent 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.5), 0 20px 40px -10px rgba(14, 165, 233, 0.12)',
        }}
      />
      <div
        className="hidden dark:block absolute bottom-[-100px] left-[-80px] w-[460px] h-[460px] rounded-full pointer-events-none transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(14, 165, 233, 0.14) 0%, rgba(6, 182, 212, 0.03) 65%, transparent 100%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.2), 0 32px 64px -16px rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* ── LAYER 3: TACTILE EDITORIAL GRAIN (SUBTLE ORGANIC GROUNDING) ─── */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{ filter: 'url(#editorial-grain)' }}
      />
    </div>
  );
};

export default BackgroundEditorialArt;
