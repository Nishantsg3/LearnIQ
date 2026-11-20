import React from 'react';

/**
 * Direction 3: Editorial Arched Geometry & Color Dots
 * Inspired by user Reference Image 3 with Reference Image 1 textural accents.
 * Modern editorial arched pill silhouettes framing canvas margins,
 * playful color-blocked accent dots (amber, coral, teal), and dotted grid panels.
 */
const BackgroundArchedGeometry = ({ className = '' }) => {
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
          <pattern id="arch-dots-light" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.75" fill="#64748b" fillOpacity="0.16" />
          </pattern>
        </defs>

        {/* Left Side: Soft Lavender Arched Pill Motif */}
        <rect x="-60" y="80" width="160" height="420" rx="80" fill="#ede9fe" fillOpacity="0.5" />
        <rect x="30" y="440" width="120" height="380" rx="60" fill="#e0e7ff" fillOpacity="0.4" />

        {/* Right Side: Tall Arched Silhouette Columns (Inspired by Image 3) */}
        <rect x="1320" y="-40" width="160" height="520" rx="80" fill="#fef3c7" fillOpacity="0.45" />
        <rect x="1260" y="320" width="140" height="480" rx="70" fill="#fce7f3" fillOpacity="0.45" />
        <rect x="1350" y="580" width="150" height="360" rx="75" fill="#ccfbf1" fillOpacity="0.4" />

        {/* Image 3 Inspired Playful Color Dots */}
        <circle cx="120" cy="120" r="14" fill="#f59e0b" fillOpacity="0.75" />
        <circle cx="1240" cy="180" r="18" fill="#ec4899" fillOpacity="0.70" />
        <circle cx="1180" cy="740" r="16" fill="#10b981" fillOpacity="0.65" />
        <circle cx="280" cy="820" r="12" fill="#6366f1" fillOpacity="0.60" />

        {/* Dotted Texture Accent Fields */}
        <rect x="1160" y="460" width="90" height="120" rx="8" fill="url(#arch-dots-light)" />
        <rect x="140" y="680" width="110" height="90" rx="8" fill="url(#arch-dots-light)" />

        {/* Minimal Hairline Accents */}
        <line x1="220" y1="200" x2="280" y2="200" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="1200" y1="360" x2="1200" y2="440" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>

      {/* ── DARK MODE SVG CANVAS ─────────────────────────────────────────── */}
      <svg
        className="hidden dark:block absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <pattern id="arch-dots-dark" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.75" fill="#94a3b8" fillOpacity="0.16" />
          </pattern>
        </defs>

        {/* Left Side: Arched Silhouette Columns */}
        <rect x="-60" y="80" width="160" height="420" rx="80" fill="#312e81" fillOpacity="0.35" />
        <rect x="30" y="440" width="120" height="380" rx="60" fill="#1e1b4b" fillOpacity="0.45" />

        {/* Right Side: Tall Arched Silhouette Columns */}
        <rect x="1320" y="-40" width="160" height="520" rx="80" fill="#78350f" fillOpacity="0.25" />
        <rect x="1260" y="320" width="140" height="480" rx="70" fill="#831843" fillOpacity="0.30" />
        <rect x="1350" y="580" width="150" height="360" rx="75" fill="#134e4a" fillOpacity="0.30" />

        {/* Playful Glowing Color Dots */}
        <circle cx="120" cy="120" r="14" fill="#fbbf24" fillOpacity="0.65" />
        <circle cx="1240" cy="180" r="18" fill="#f472b6" fillOpacity="0.60" />
        <circle cx="1180" cy="740" r="16" fill="#34d399" fillOpacity="0.60" />
        <circle cx="280" cy="820" r="12" fill="#818cf8" fillOpacity="0.55" />

        {/* Dotted Texture Fields */}
        <rect x="1160" y="460" width="90" height="120" rx="8" fill="url(#arch-dots-dark)" />
        <rect x="140" y="680" width="110" height="90" rx="8" fill="url(#arch-dots-dark)" />

        {/* Hairline Accents */}
        <line x1="220" y1="200" x2="280" y2="200" stroke="#64748b" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="1200" y1="360" x2="1200" y2="440" stroke="#64748b" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    </div>
  );
};

export default BackgroundArchedGeometry;
