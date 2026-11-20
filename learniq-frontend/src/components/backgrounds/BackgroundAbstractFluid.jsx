import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Direction 8: Abstract Organic Geometry & Fluid Strata
 *
 * Dynamically calibrated across 3 domain-specific 4-color palettes:
 * 1. STUDENT DOMAIN (/login, /student/*):
 *    - Light: Terracotta (#C35A38), Scholar Indigo (#4338CA), Warm Honey (#D97706), Academic Sage (#2D6A4F)
 *    - Dark: Terracotta (#E27D60), Luminous Indigo (#818CF8), Ochre Gold (#FBBF24), Bioluminescent Sage (#52B788)
 * 2. ADMIN DOMAIN (/admin-access, /admin/*):
 *    - Light: Command Spruce (#0F766E), Telemetry Cyan (#0284C7), Authority Brass (#B45309), Ledger Emerald (#047857)
 *    - Dark: Command Teal (#14B8A6), Precision Cyan (#38BDF8), Signal Gold (#F59E0B), Mint Emerald (#34D399)
 * 3. ONBOARDING & RECOVERY DOMAIN (/register, /forgot-password, /verify-otp):
 *    - Light: Royal Iris (#6D28D9), Rose Coral (#BE123C), Sky Azure (#0284C7), Heather Slate (#475569)
 *    - Dark: Amethyst (#A78BFA), Blush Rose (#FB7185), Astral Blue (#60A5FA), Moonlit Slate (#94A3B8)
 */
const PALETTES = {
  // 1. STUDENT DOMAIN (/login, /student/*) - Royal Amethyst, Sky Azure, Crimson Red, Mint Emerald
  student: {
    light: {
      color1: { start: '#A78BFA', end: '#6366F1' }, // Royal Amethyst / Iris
      color2: { start: '#38BDF8', end: '#0284C7' }, // Sky Azure
      color3: { start: '#F87171', end: '#DC2626' }, // Vibrant Crimson Red (Heart Card)
      color4: { start: '#34D399', end: '#059669' }, // Mint Emerald
      accentLine: '#4338CA',
      accentDot: '#6366F1',
      ringStroke: '#A78BFA',
      cross: '#0284C7'
    },
    dark: {
      color1: { start: '#C4B5FD', end: '#4F46E5' }, // Luminous Royal Amethyst
      color2: { start: '#7DD3FC', end: '#0369A1' }, // Precision Azure
      color3: { start: '#FCA5A5', end: '#B91C1C' }, // Luminous Crimson
      color4: { start: '#6EE7B7', end: '#047857' }, // Bioluminescent Emerald
      accentLine: '#E0E7FF',
      accentDot: '#818CF8',
      ringStroke: '#38BDF8',
      cross: '#F87171'
    }
  },
  // 2. ADMIN DOMAIN (/admin-access, /admin/*) - Pure Royal Violet & Electric Indigo Architectural Palette
  admin: {
    light: {
      color1: { start: '#C4B5FD', end: '#7C3AED' }, // Luminous Amethyst to Royal Violet
      color2: { start: '#818CF8', end: '#4F46E5' }, // Electric Indigo
      color3: { start: '#A78BFA', end: '#6D28D9' }, // Deep Imperial Purple
      color4: { start: '#93C5FD', end: '#3B82F6' }, // Refined Twilight Blue
      accentLine: '#6D28D9',
      accentDot: '#7C3AED',
      ringStroke: '#A78BFA',
      cross: '#818CF8'
    },
    dark: {
      color1: { start: '#DDD6FE', end: '#5B21B6' }, // Deep Luminous Violet
      color2: { start: '#A5B4FC', end: '#3730A3' }, // Midnight Indigo
      color3: { start: '#C4B5FD', end: '#4C1D95' }, // Astral Amethyst
      color4: { start: '#BFDBFE', end: '#1E3A8A' }, // Deep Twilight Slate Blue
      accentLine: '#EDE9FE',
      accentDot: '#A78BFA',
      ringStroke: '#818CF8',
      cross: '#C4B5FD'
    }
  },
  // 3. ONBOARDING & RECOVERY DOMAIN (/register, /forgot-password, /verify-otp) - Aurora Jade, Aquamarine Cyan, Solar Gold
  onboarding: {
    light: {
      color1: { start: '#34D399', end: '#059669' }, // Aurora Jade / Emerald
      color2: { start: '#22D3EE', end: '#0891B2' }, // Electric Aquamarine
      color3: { start: '#FCD34D', end: '#D97706' }, // Radiant Solar Gold
      color4: { start: '#64748B', end: '#334155' }, // Celestial Slate
      accentLine: '#065F46',
      accentDot: '#059669',
      ringStroke: '#22D3EE',
      cross: '#D97706'
    },
    dark: {
      color1: { start: '#6EE7B7', end: '#047857' }, // Luminous Aurora Jade
      color2: { start: '#67E8F9', end: '#0E7490' }, // High-Luminance Aqua
      color3: { start: '#FDE68A', end: '#92400E' }, // Luminous Bronze Gold
      color4: { start: '#94A3B8', end: '#1E293B' }, // Deep Midnight Slate
      accentLine: '#ECFDF5',
      accentDot: '#34D399',
      ringStroke: '#67E8F9',
      cross: '#FCD34D'
    }
  }
};

const FluidDefs = ({ p }) => (
  <defs>
    {/* Subtle tactile paper / frosted acrylic grain */}
    <filter id="abstract-grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
      <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.035 0" />
    </filter>

    {/* Gradients for Light Mode - Dynamic per Palette */}
    <linearGradient id="fluid-color-1-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.light.color1.start} stopOpacity="0.55" />
      <stop offset="100%" stopColor={p.light.color1.end} stopOpacity="0.45" />
    </linearGradient>

    <linearGradient id="fluid-color-2-light" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor={p.light.color2.start} stopOpacity="0.50" />
      <stop offset="100%" stopColor={p.light.color2.end} stopOpacity="0.40" />
    </linearGradient>

    <linearGradient id="fluid-color-3-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.light.color3.start} stopOpacity="0.60" />
      <stop offset="100%" stopColor={p.light.color3.end} stopOpacity="0.45" />
    </linearGradient>

    <linearGradient id="fluid-color-4-light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.light.color4.start} stopOpacity="0.45" />
      <stop offset="100%" stopColor={p.light.color4.end} stopOpacity="0.30" />
    </linearGradient>

    {/* Gradients for Dark Mode - Dynamic per Palette */}
    <linearGradient id="fluid-color-1-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.dark.color1.start} stopOpacity="0.55" />
      <stop offset="100%" stopColor={p.dark.color1.end} stopOpacity="0.40" />
    </linearGradient>

    <linearGradient id="fluid-color-2-dark" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor={p.dark.color2.start} stopOpacity="0.50" />
      <stop offset="100%" stopColor={p.dark.color2.end} stopOpacity="0.35" />
    </linearGradient>

    <linearGradient id="fluid-color-3-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.dark.color3.start} stopOpacity="0.55" />
      <stop offset="100%" stopColor={p.dark.color3.end} stopOpacity="0.38" />
    </linearGradient>

    <linearGradient id="fluid-color-4-dark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={p.dark.color4.start} stopOpacity="0.45" />
      <stop offset="100%" stopColor={p.dark.color4.end} stopOpacity="0.30" />
    </linearGradient>
  </defs>
);

const TopRightGroup = ({ p }) => (
  <>
    {/* LIGHT MODE: Organic Fluid Composition */}
    <g className="dark:hidden transition-opacity duration-700">
      {/* Primary Fluid Blob: Color 2 */}
      <path
        d="M180 120 C340 90 480 180 520 320 C560 480 430 590 290 610 C150 630 50 510 50 360 C50 210 100 130 180 120 Z"
        fill="url(#fluid-color-2-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Overlapping Fluid Blob: Color 1 */}
      <path
        d="M120 180 C260 110 390 190 410 310 C430 430 330 520 210 530 C90 540 20 440 30 310 C40 180 80 190 120 180 Z"
        fill="url(#fluid-color-1-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Tertiary Flow Blob: Color 3 */}
      <path
        d="M260 220 C360 170 450 230 460 330 C470 430 390 500 290 490 C190 480 160 410 180 320 C200 230 220 230 260 220 Z"
        fill="url(#fluid-color-3-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Micro-Accent 1: Floating Dimensional Pill Pebble */}
      <circle cx="70" cy="460" r="26" fill="#FBF9F5" stroke={p.light.ringStroke} strokeWidth="2" strokeDasharray="4 3" opacity="0.75" />
      <circle cx="70" cy="460" r="13" fill="url(#fluid-color-3-light)" opacity="0.8" />

      {/* Micro-Accent 2: Modernist Dot Matrix */}
      <g transform="translate(300, 120)" fill={p.light.accentDot} opacity="0.45">
        {[0, 1, 2, 3, 4].map(col =>
          [0, 1, 2, 3].map(row => (
            <circle key={`tr-dot-${col}-${row}`} cx={col * 16} cy={row * 16} r="2.2" />
          ))
        )}
      </g>

      {/* Micro-Accent 3: Sine Wave Squiggle */}
      <path
        d="M 15 220 Q 27 208, 39 220 T 63 220 T 87 220 T 111 220"
        fill="none"
        stroke={p.light.accentLine}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Micro-Accent 4: Delicate Crosses & Open Circles */}
      <g transform="translate(220, 170)" stroke={p.light.cross} strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <line x1="-5" y1="0" x2="5" y2="0" />
        <line x1="0" y1="-5" x2="0" y2="5" />
      </g>
      <g transform="translate(40, 360)" stroke={p.light.accentDot} strokeWidth="1.5" fill="none" opacity="0.6">
        <circle cx="0" cy="0" r="6" />
      </g>
    </g>

    {/* DARK MODE: Bioluminescent Fluid Composition */}
    <g className="hidden dark:block transition-opacity duration-700">
      {/* Primary Fluid Blob: Color 2 */}
      <path
        d="M180 120 C340 90 480 180 520 320 C560 480 430 590 290 610 C150 630 50 510 50 360 C50 210 100 130 180 120 Z"
        fill="url(#fluid-color-2-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Overlapping Fluid Blob: Color 1 */}
      <path
        d="M120 180 C260 110 390 190 410 310 C430 430 330 520 210 530 C90 540 20 440 30 310 C40 180 80 190 120 180 Z"
        fill="url(#fluid-color-1-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Tertiary Intersecting Accent: Color 3 */}
      <path
        d="M260 220 C360 170 450 230 460 330 C470 430 390 500 290 490 C190 480 160 410 180 320 C200 230 220 230 260 220 Z"
        fill="url(#fluid-color-3-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Micro-Accent 1: Luminous Dimensional Ring */}
      <circle cx="70" cy="460" r="26" fill="#101418" stroke={p.dark.ringStroke} strokeWidth="2" strokeDasharray="4 3" opacity="0.8" />
      <circle cx="70" cy="460" r="13" fill="url(#fluid-color-3-dark)" opacity="0.75" />

      {/* Micro-Accent 2: Modernist Dot Matrix */}
      <g transform="translate(300, 120)" fill={p.dark.accentDot} opacity="0.5">
        {[0, 1, 2, 3, 4].map(col =>
          [0, 1, 2, 3].map(row => (
            <circle key={`dark-tr-dot-${col}-${row}`} cx={col * 16} cy={row * 16} r="2.2" />
          ))
        )}
      </g>

      {/* Micro-Accent 3: Sine Wave Squiggle */}
      <path
        d="M 15 220 Q 27 208, 39 220 T 63 220 T 87 220 T 111 220"
        fill="none"
        stroke={p.dark.accentLine}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Micro-Accent 4: Delicate Crosses & Rings */}
      <g transform="translate(220, 170)" stroke={p.dark.cross} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="-5" y1="0" x2="5" y2="0" />
        <line x1="0" y1="-5" x2="0" y2="5" />
      </g>
      <g transform="translate(40, 360)" stroke={p.dark.accentDot} strokeWidth="1.5" fill="none" opacity="0.7">
        <circle cx="0" cy="0" r="6" />
      </g>
    </g>
  </>
);

const BottomLeftGroup = ({ p }) => (
  <>
    {/* LIGHT MODE: Organic Fluid Composition */}
    <g className="dark:hidden transition-opacity duration-700">
      {/* Base Fluid Blob: Color 1 */}
      <path
        d="M140 120 C320 80 480 200 460 360 C440 500 320 580 180 560 C40 540 -20 440 -10 300 C0 160 50 140 140 120 Z"
        fill="url(#fluid-color-1-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Overlapping Fluid Blob: Color 3 */}
      <path
        d="M200 160 C340 130 420 220 430 330 C440 450 350 510 230 500 C110 490 60 410 70 300 C80 190 120 170 200 160 Z"
        fill="url(#fluid-color-3-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Tertiary Flow Blob: Color 4 */}
      <path
        d="M100 240 C200 190 300 250 310 340 C320 430 250 490 170 480 C90 470 50 410 60 330 C70 250 80 250 100 240 Z"
        fill="url(#fluid-color-4-light)"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Micro-Accent 5: Dot Matrix Cluster */}
      <g transform="translate(380, 190)" fill={p.light.accentDot} opacity="0.45">
        {[0, 1, 2, 3].map(col =>
          [0, 1, 2, 3].map(row => (
            <circle key={`bl-dot-${col}-${row}`} cx={col * 15} cy={row * 15} r="2" />
          ))
        )}
      </g>

      {/* Micro-Accent 6: Sine Wave Squiggle */}
      <path
        d="M 330 130 Q 342 118, 354 130 T 378 130 T 402 130"
        fill="none"
        stroke={p.light.accentLine}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Micro-Accent 7: Geometric Corner Angle & Cross */}
      <g transform="translate(430, 90)" stroke={p.light.cross} strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
        <path d="M-6 -6 L-6 4 L4 4" fill="none" />
      </g>
      <g transform="translate(460, 160)" stroke={p.light.accentDot} strokeWidth="1.5" strokeLinecap="round" opacity="0.65">
        <line x1="-5" y1="0" x2="5" y2="0" />
        <line x1="0" y1="-5" x2="0" y2="5" />
      </g>
    </g>

    {/* DARK MODE: Bioluminescent Fluid Composition */}
    <g className="hidden dark:block transition-opacity duration-700">
      {/* Base Fluid Blob: Color 1 */}
      <path
        d="M140 120 C320 80 480 200 460 360 C440 500 320 580 180 560 C40 540 -20 440 -10 300 C0 160 50 140 140 120 Z"
        fill="url(#fluid-color-1-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Overlapping Fluid Blob: Color 3 */}
      <path
        d="M200 160 C340 130 420 220 430 330 C440 450 350 510 230 500 C110 490 60 410 70 300 C80 190 120 170 200 160 Z"
        fill="url(#fluid-color-3-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Tertiary Flow Blob: Color 4 */}
      <path
        d="M100 240 C200 190 300 250 310 340 C320 430 250 490 170 480 C90 470 50 410 60 330 C70 250 80 250 100 240 Z"
        fill="url(#fluid-color-4-dark)"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Micro-Accent 5: Dot Matrix Cluster */}
      <g transform="translate(380, 190)" fill={p.dark.accentDot} opacity="0.45">
        {[0, 1, 2, 3].map(col =>
          [0, 1, 2, 3].map(row => (
            <circle key={`dark-bl-dot-${col}-${row}`} cx={col * 15} cy={row * 15} r="2" />
          ))
        )}
      </g>

      {/* Micro-Accent 6: Sine Wave Squiggle */}
      <path
        d="M 330 130 Q 342 118, 354 130 T 378 130 T 402 130"
        fill="none"
        stroke={p.dark.accentLine}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Micro-Accent 7: Geometric Corner Angle & Cross */}
      <g transform="translate(430, 90)" stroke={p.dark.cross} strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <path d="M-6 -6 L-6 4 L4 4" fill="none" />
      </g>
      <g transform="translate(460, 160)" stroke={p.dark.accentDot} strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="-5" y1="0" x2="5" y2="0" />
        <line x1="0" y1="-5" x2="0" y2="5" />
      </g>
    </g>
  </>
);

const BackgroundAbstractFluid = ({ scope: propScope }) => {
  let location;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    location = useLocation();
  } catch {
    location = null;
  }
  const pathname = location?.pathname || '';

  let activeScope = propScope;
  if (!activeScope) {
    if (pathname.startsWith('/admin')) {
      activeScope = 'admin';
    } else if (
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/verify-otp') ||
      pathname.startsWith('/reset-password')
    ) {
      activeScope = 'onboarding';
    } else {
      activeScope = 'student';
    }
  }

  const p = PALETTES[activeScope] || PALETTES.student;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#FBF9F5] dark:bg-[#101418]"
    >
      {/* ── BASE TEXTURED ROOM FOUNDATION ─────────────────────────────────── */}
      <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#FFFFFF_0%,#FBF9F5_60%,#F3EFE8_100%)]" />
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#161B22_0%,#101418_60%,#0A0D10_100%)]" />

      {/* ── TOP-RIGHT ARTISTIC FLUID CLUSTER (RESPONSIVE CORNER ANCHOR) ──── */}
      <div className="absolute -top-12 -right-12 sm:-top-16 sm:-right-16 lg:-top-20 lg:-right-20 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] lg:w-[620px] lg:h-[620px] pointer-events-none select-none">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 540 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <FluidDefs p={p} />
          <TopRightGroup p={p} />
        </svg>
      </div>

      {/* ── BOTTOM-LEFT ARTISTIC FLUID CLUSTER (RESPONSIVE CORNER ANCHOR) ─── */}
      <div className="absolute -bottom-12 -left-12 sm:-bottom-16 sm:-left-16 lg:-bottom-20 lg:-left-20 w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] lg:w-[580px] lg:h-[580px] pointer-events-none select-none">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="-30 70 520 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <FluidDefs p={p} />
          <BottomLeftGroup p={p} />
        </svg>
      </div>

      {/* ── SUBTLE TACTILE SURFACE GRAIN ──────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="abstract-grain-full" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.035 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#abstract-grain-full)" opacity="0.8" />
      </svg>
    </div>
  );
};

export default BackgroundAbstractFluid;
