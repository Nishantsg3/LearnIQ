import React from 'react';

/**
 * Direction 6 Refined: Sweeping Silk Aurora & Harmonic Dunes
 * Stripped of technical map clutter, busy contour lines, and crosshair text.
 *
 * Focus:
 * - Grand, large-scale, silky fluid gradient waves weaving through the space.
 * - Deep indigo, luminous cyan, soft mineral teal, and subtle champagne gold accents.
 * - Soft painterly blending with generous atmospheric breathing room.
 * - Pristine center reading field preserving 100% UI contrast.
 */
const BackgroundAcademicTopography = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#F5F5F0] dark:bg-[#0F1115]"
    >
      {/* ── BASE TEXTURED FOUNDATION ──────────────────────────────────────── */}
      {/* Light Mode: Warm architectural paper / museum cotton base */}
      <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_90%_at_50%_0%,#FAF9F5_0%,#F3F2EC_50%,#E9E8E0_100%)]" />
      {/* Dark Mode: Deep nocturnal slate foundation */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_90%_at_50%_0%,#161922_0%,#0F1115_60%,#08090C_100%)]" />

      {/* ── SWEEPING GRADIENT WAVE FIELD ──────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Fine-Art Paper / Slate Grain */}
          <filter id="soft-canvas-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.04 0" />
          </filter>

          {/* Gentle Organic Wave Softener */}
          <filter id="gentle-dune-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="35" result="softWave" />
          </filter>

          {/* Center Card-Read Mask: Keeps center 65% of viewport calm and legible */}
          <mask id="center-soft-mask">
            <rect width="1440" height="900" fill="white" />
            <ellipse cx="720" cy="460" rx="480" ry="290" fill="black" opacity="0.75" />
          </mask>

          {/* ── LIGHT MODE GRADIENTS (WATERCOLOR / PARCHMENT / GOLD) ───────── */}
          <linearGradient id="light-grand-indigo" x1="0" y1="300" x2="1440" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338CA" stopOpacity="0.22" />
            <stop offset="30%" stopColor="#6366F1" stopOpacity="0.16" />
            <stop offset="65%" stopColor="#0EA5E9" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="light-grand-teal" x1="1440" y1="100" x2="0" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.20" />
            <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.12" />
            <stop offset="75%" stopColor="#818CF8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#F5F5F0" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="light-grand-gold" x1="300" y1="0" x2="1200" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.10" />
            <stop offset="85%" stopColor="#FEF3C7" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* ── DARK MODE GRADIENTS (COSMIC AURORA / PHOSPHOR TEAL) ────────── */}
          <linearGradient id="dark-grand-indigo" x1="0" y1="200" x2="1440" y2="850" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#312E81" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#4F46E5" stopOpacity="0.35" />
            <stop offset="65%" stopColor="#0284C7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="dark-grand-teal" x1="1440" y1="100" x2="0" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.48" />
            <stop offset="45%" stopColor="#06B6D4" stopOpacity="0.30" />
            <stop offset="80%" stopColor="#818CF8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0F1115" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="dark-grand-gold" x1="300" y1="0" x2="1200" y2="900" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B45309" stopOpacity="0.38" />
            <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.22" />
            <stop offset="85%" stopColor="#FDE68A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0F1115" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* LIGHT MODE: SILKY WATERCOLOR GRADIENT WAVES                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <g className="dark:hidden transition-opacity duration-700" mask="url(#center-soft-mask)">
          {/* Wave 1: Grand sweeping lower dune */}
          <path
            d="M-120 540 C240 380 580 680 920 520 C1220 380 1380 240 1600 120 L1600 980 L-120 980 Z"
            fill="url(#light-grand-indigo)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Wave 2: Sweeping upper diagonal veil */}
          <path
            d="M-120 80 C360 260 720 40 1080 220 C1320 340 1480 180 1600 -40 L1600 -120 L-120 -120 Z"
            fill="url(#light-grand-teal)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Wave 3: Sinuous golden champagne crest */}
          <path
            d="M80 950 C380 660 740 820 1100 520 C1340 300 1480 260 1600 160 L1600 680 C1300 820 920 960 80 950 Z"
            fill="url(#light-grand-gold)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Gentle, broad structural wave definition (Non-glitchy smooth crest lines) */}
          <path
            d="M-60 540 C280 390 600 660 920 520 C1220 400 1380 240 1560 140"
            stroke="url(#light-grand-indigo)"
            strokeWidth="2"
            strokeOpacity="0.4"
            fill="none"
          />
          <path
            d="M-60 120 C380 280 720 80 1060 220 C1300 320 1440 180 1560 20"
            stroke="url(#light-grand-teal)"
            strokeWidth="2"
            strokeOpacity="0.35"
            fill="none"
          />
        </g>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DARK MODE: LUMINOUS COSMIC AURORA DUNES                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <g className="hidden dark:block transition-opacity duration-700" mask="url(#center-soft-mask)">
          {/* Wave 1: Grand sweeping lower dune */}
          <path
            d="M-120 540 C240 380 580 680 920 520 C1220 380 1380 240 1600 120 L1600 980 L-120 980 Z"
            fill="url(#dark-grand-indigo)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Wave 2: Sweeping upper diagonal veil */}
          <path
            d="M-120 80 C360 260 720 40 1080 220 C1320 340 1480 180 1600 -40 L1600 -120 L-120 -120 Z"
            fill="url(#dark-grand-teal)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Wave 3: Sinuous golden champagne crest */}
          <path
            d="M80 950 C380 660 740 820 1100 520 C1340 300 1480 260 1600 160 L1600 680 C1300 820 920 960 80 950 Z"
            fill="url(#dark-grand-gold)"
            filter="url(#gentle-dune-blur)"
          />

          {/* Specular crest highlights */}
          <path
            d="M-60 540 C280 390 600 660 920 520 C1220 400 1380 240 1560 140"
            stroke="#818CF8"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            fill="none"
          />
          <path
            d="M-60 120 C380 280 720 80 1060 220 C1300 320 1440 180 1560 20"
            stroke="#2DD4BF"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            fill="none"
          />
        </g>
      </svg>

      {/* ── TACTILE ARCHITECTURAL PAPER / SLATE GRAIN OVERLAY ─────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.055] pointer-events-none mix-blend-overlay"
        style={{ filter: 'url(#soft-canvas-grain)' }}
      />
    </div>
  );
};

export default BackgroundAcademicTopography;
