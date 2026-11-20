import React from 'react';

/**
 * Direction 2: Nested Topography (Layered Fluid Contour Waves)
 * Inspired by user Reference Image 4.
 * Organic nested fluid contour waves blooming from one side with layered pastel depths
 * and expansive clean negative space for reading and forms.
 */
const BackgroundNestedTopography = ({ className = '' }) => {
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
          <filter id="topo-blur-light" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Layer 1: Outermost Soft Peach-Ivory Contour */}
        <path
          d="M 1440,0 L 1050,0 C 940,120 900,240 980,360 C 1040,450 1020,560 920,640 C 820,720 780,800 850,900 L 1440,900 Z"
          fill="#fdf2f8"
          fillOpacity="0.85"
        />

        {/* Layer 2: Soft Rose-Lavender Contour */}
        <path
          d="M 1440,50 L 1140,50 C 1030,160 1000,280 1060,380 C 1120,470 1100,560 1010,640 C 930,710 920,800 980,880 L 1440,880 Z"
          fill="#fce7f3"
          fillOpacity="0.75"
        />

        {/* Layer 3: Vibrant Soft Fuchsia Contour */}
        <path
          d="M 1440,120 L 1220,120 C 1130,220 1100,320 1150,400 C 1200,480 1170,570 1100,640 C 1040,700 1040,780 1100,840 L 1440,840 Z"
          fill="#f472b6"
          fillOpacity="0.45"
        />

        {/* Layer 4: Deep Violet Core Contour */}
        <path
          d="M 1440,200 L 1290,200 C 1220,290 1200,370 1230,430 C 1270,490 1250,560 1200,610 C 1150,660 1160,730 1210,780 L 1440,780 Z"
          fill="#8b5cf6"
          fillOpacity="0.40"
        />

        {/* Layer 5: Inner Deep Violet Core */}
        <path
          d="M 1440,280 L 1350,280 C 1300,340 1280,410 1310,460 C 1340,510 1330,560 1280,600 C 1250,630 1260,680 1300,720 L 1440,720 Z"
          fill="#6d28d9"
          fillOpacity="0.30"
        />

        {/* Soft Organic Accent Rings in Negative Space */}
        <circle cx="280" cy="220" r="140" fill="#ede9fe" fillOpacity="0.4" />
        <circle cx="210" cy="740" r="180" fill="#fdf4ff" fillOpacity="0.5" />
      </svg>

      {/* ── DARK MODE SVG CANVAS ─────────────────────────────────────────── */}
      <svg
        className="hidden dark:block absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        {/* Layer 1: Outermost Subtle Nebula Wave */}
        <path
          d="M 1440,0 L 1050,0 C 940,120 900,240 980,360 C 1040,450 1020,560 920,640 C 820,720 780,800 850,900 L 1440,900 Z"
          fill="#1e1b4b"
          fillOpacity="0.45"
        />

        {/* Layer 2: Muted Deep Rose / Burgundy */}
        <path
          d="M 1440,50 L 1140,50 C 1030,160 1000,280 1060,380 C 1120,470 1100,560 1010,640 C 930,710 920,800 980,880 L 1440,880 Z"
          fill="#4a044e"
          fillOpacity="0.40"
        />

        {/* Layer 3: Vibrant Plum Contour */}
        <path
          d="M 1440,120 L 1220,120 C 1130,220 1100,320 1150,400 C 1200,480 1170,570 1100,640 C 1040,700 1040,780 1100,840 L 1440,840 Z"
          fill="#701a75"
          fillOpacity="0.45"
        />

        {/* Layer 4: Deep Saturated Violet Core */}
        <path
          d="M 1440,200 L 1290,200 C 1220,290 1200,370 1230,430 C 1270,490 1250,560 1200,610 C 1150,660 1160,730 1210,780 L 1440,780 Z"
          fill="#581c87"
          fillOpacity="0.55"
        />

        {/* Layer 5: Luminous Violet Heart */}
        <path
          d="M 1440,280 L 1350,280 C 1300,340 1280,410 1310,460 C 1340,510 1330,560 1280,600 C 1250,630 1260,680 1300,720 L 1440,720 Z"
          fill="#7c3aed"
          fillOpacity="0.35"
        />

        {/* Negative space subtle ambient glow */}
        <circle cx="280" cy="220" r="160" fill="#312e81" fillOpacity="0.25" filter="blur(60px)" />
        <circle cx="210" cy="740" r="180" fill="#1e1b4b" fillOpacity="0.30" filter="blur(70px)" />
      </svg>
    </div>
  );
};

export default BackgroundNestedTopography;
