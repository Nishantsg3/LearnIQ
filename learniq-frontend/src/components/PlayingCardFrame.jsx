import React from 'react';

/**
 * PlayingCardFrame: Collectible Trading Card Architectural Frame.
 *
 * - Chamfered luxury perimeter with crisp micro-beveled corners.
 * - Tight parallel inner contour (only 3px margin from outer border).
 * - Subtle geometric corner notches that follow the outer geometry.
 * - Precision corner registration rivets and framing crosshairs.
 * - ZERO text intrusion — maximum internal printable area.
 * - Multi-layer luminous glow in both Light and Dark modes.
 */
const PlayingCardFrame = ({
  strokeColor = "currentColor",
  glowColor = "rgba(124,58,237,0.7)",
  className = ""
}) => {
  const safeId = (glowColor || 'card').replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      style={{ transform: 'translateZ(16px)' }}
    >
      <svg
        viewBox="0 0 200 320"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id={`card-glow-${safeId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={glowColor} floodOpacity="0.75" />
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={glowColor} floodOpacity="0.35" />
          </filter>
        </defs>

        {/* ── 1. OUTER FACETED PERIMETER (Clean Tight Architectural Chamfer) ── */}
        <path
          d={`
            M 5,14
            L 14,5
            L 186,5
            L 195,14
            L 195,306
            L 186,315
            L 14,315
            L 5,306
            Z
          `}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="opacity-75 group-hover/card:opacity-100 transition-opacity duration-300"
          style={{ filter: `url(#card-glow-${safeId})` }}
        />

        {/* ── 2. TIGHT INNER CONCENTRIC HAIRLINE (Parallel with Subtle Corner Step) ── */}
        <path
          d={`
            M 8,16
            L 16,8
            L 184,8
            L 192,16
            L 192,304
            L 184,312
            L 16,312
            L 8,304
            Z
          `}
          fill="none"
          stroke={strokeColor}
          strokeWidth="0.85"
          strokeDasharray="5 3"
          vectorEffect="non-scaling-stroke"
          className="opacity-45 group-hover/card:opacity-85 transition-opacity duration-300"
        />

        {/* ── 3. CORNER ACCENT BRACKETS & RIVETS ── */}
        {/* Top-Left */}
        <polyline
          points="2,14 2,6 6,2 14,2"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          className="opacity-60 group-hover/card:opacity-100"
        />
        <circle cx="8" cy="8" r="1.5" fill={strokeColor} className="opacity-80 group-hover/card:opacity-100" />

        {/* Top-Right */}
        <polyline
          points="186,2 194,2 198,6 198,14"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          className="opacity-60 group-hover/card:opacity-100"
        />
        <circle cx="192" cy="8" r="1.5" fill={strokeColor} className="opacity-80 group-hover/card:opacity-100" />

        {/* Bottom-Right */}
        <polyline
          points="198,306 198,314 194,318 186,318"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          className="opacity-60 group-hover/card:opacity-100"
        />
        <circle cx="192" cy="312" r="1.5" fill={strokeColor} className="opacity-80 group-hover/card:opacity-100" />

        {/* Bottom-Left */}
        <polyline
          points="14,318 6,318 2,314 2,306"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          className="opacity-60 group-hover/card:opacity-100"
        />
        <circle cx="8" cy="312" r="1.5" fill={strokeColor} className="opacity-80 group-hover/card:opacity-100" />
      </svg>
    </div>
  );
};

export default React.memo(PlayingCardFrame);
