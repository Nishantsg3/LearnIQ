import React from 'react';

/**
 * Direction 2: Architectural Grain & Monolith (Editorial / Minimalist)
 * - Light: Warm ivory/stone base (#F7F6F2) with fine-art paper grain texture and
 *   a sweeping monolithic architectural curve casting a soft ambient shadow.
 * - Dark: Deep charcoal basalt (#111317) with the same physical tactile grain,
 *   with the architectural curve rendered as a subtle moonlight rim grazing a curved wall.
 * - High-end, serious, academic, tactile.
 */
const BackgroundArchitecturalGrain = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
    >
      {/* ── SVG GRAIN FILTER (Inline Definition) ─────────────────────────── */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <filter id="editorial-fine-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.06" />
          </feComponentTransfer>
        </filter>
        <filter id="editorial-fine-grain-dark">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.04" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* ── LIGHT MODE: Stone/Ivory Base & Monolithic Shadow ─────────────── */}
      <div className="dark:hidden absolute inset-0 bg-[#F7F6F2]">
        {/* Monolithic Sweeping Architectural Curve & Shadow */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            {/* Ambient Occlusion Wall Shadow */}
            <radialGradient id="mono-shadow-light" cx="85%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.09" />
              <stop offset="45%" stopColor="#334155" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#f7f6f2" stopOpacity="0" />
            </radialGradient>

            {/* Soft Warm Top Light Falloff */}
            <linearGradient id="mono-light-wash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#f5f5f0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#edece6" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Broad Architectural Light Wash */}
          <rect width="1440" height="900" fill="url(#mono-light-wash)" />

          {/* Sweeping Parabolic Monolith Curve Wall */}
          <path
            d="M 1440,-50 C 950,120 720,450 780,950 L 1440,950 Z"
            fill="url(#mono-shadow-light)"
          />

          {/* Crisp Architectural Hairline Horizon */}
          <path
            d="M 1440,-50 C 950,120 720,450 780,950"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        </svg>

        {/* Tactile Fine-Art Paper Grain Overlay */}
        <div
          className="absolute inset-0 mix-blend-multiply pointer-events-none"
          style={{ filter: 'url(#editorial-fine-grain)' }}
        />
      </div>

      {/* ── DARK MODE: Basalt Slate Base & Moonlight Curved Rim ───────────── */}
      <div className="hidden dark:block absolute inset-0 bg-[#101216]">
        {/* Architectural Monolith Curve in Shadow with Moonlight Rim */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            {/* Deep Volumetric Wall Tone */}
            <radialGradient id="mono-shadow-dark" cx="85%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#1a1e27" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#12151b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#101216" stopOpacity="0" />
            </radialGradient>

            {/* Moonlit Specular Rim Stroke */}
            <linearGradient id="moonlight-rim" x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.0" />
            </linearGradient>

            {/* Subtle Horizon Light Bloom */}
            <radialGradient id="rim-bloom" cx="65%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.10" />
              <stop offset="70%" stopColor="#1e1b4b" stopOpacity="0.02" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Atmospheric Depth Wash */}
          <rect width="1440" height="900" fill="url(#rim-bloom)" />

          {/* Sweeping Monolith Shadow Plane */}
          <path
            d="M 1440,-50 C 950,120 720,450 780,950 L 1440,950 Z"
            fill="url(#mono-shadow-dark)"
          />

          {/* The Moonlight Specular Rim: An elegant physical line grazing the edge */}
          <path
            d="M 1440,-50 C 950,120 720,450 780,950"
            fill="none"
            stroke="url(#moonlight-rim)"
            strokeWidth="1.25"
          />
        </svg>

        {/* Tactile Fine Slate Grain Overlay */}
        <div
          className="absolute inset-0 mix-blend-screen pointer-events-none opacity-80"
          style={{ filter: 'url(#editorial-fine-grain-dark)' }}
        />
      </div>
    </div>
  );
};

export default BackgroundArchitecturalGrain;
