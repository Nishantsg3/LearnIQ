import React from 'react';

/**
 * Direction 7: Organic Botanical Illustration & Earthy Editorial Art
 * Inspired directly by the user's reference art:
 * - Overlapping semi-transparent organic fluid blobs (sage green, mustard ochre, warm sand).
 * - Detailed botanical vector leaves (monstera fronds, golden fern, delicate ink branches with berries).
 * - Radiating sunburst linework, delicate dashed framing curves, and stippled pebble dot clusters.
 * - Anchored in margins/corners to leave the central card workspace 100% clear.
 * - Distinct light (warm linen #F9F8F5) and dark (deep forest charcoal #121614) palettes.
 */
const BackgroundOrganicBotanical = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#F9F8F5] dark:bg-[#111614]"
    >
      {/* ── BASE TEXTURED ROOM FOUNDATION ─────────────────────────────────── */}
      {/* Light Mode: Warm organic linen / museum cream */}
      <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#FDFCF9_0%,#F9F8F5_60%,#F1EFEA_100%)]" />
      {/* Dark Mode: Deep forest charcoal & twilight spruce */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#18201C_0%,#111614_60%,#0A0E0C_100%)]" />

      {/* ── VECTOR BOTANICAL ILLUSTRATION CANVAS ──────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle paper grain filter */}
          <filter id="botanical-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.035 0" />
          </filter>

          {/* Central Protection Mask: Keeps the middle 65% clean for reading */}
          <mask id="botanical-center-mask">
            <rect width="1440" height="900" fill="white" />
            <ellipse cx="720" cy="460" rx="460" ry="280" fill="black" opacity="0.85" />
          </mask>
        </defs>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* LIGHT MODE BOTANICAL ILLUSTRATION                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <g className="dark:hidden transition-opacity duration-700">

          {/* ── TOP-RIGHT BOTANICAL CLUSTER ─────────────────────────────────── */}
          <g transform="translate(1020, -70)">
            {/* 1. Large Pale Sage Organic Base Blob */}
            <path
              d="M260 140 C380 120 520 220 540 360 C560 500 440 600 300 620 C160 640 60 520 60 380 C60 240 140 160 260 140 Z"
              fill="#A9C7B5"
              fillOpacity="0.45"
            />

            {/* 2. Overlapping Olive Leaf Green Organic Shape */}
            <path
              d="M160 180 C260 140 360 180 390 280 C420 380 340 480 230 490 C120 500 70 410 70 310 C70 210 100 200 160 180 Z"
              fill="#5A8F70"
              fillOpacity="0.55"
            />

            {/* 3. Small Warm Sand Accent Pebble */}
            <path
              d="M80 380 C130 360 170 390 170 430 C170 470 120 510 70 490 C20 470 30 400 80 380 Z"
              fill="#D6C4A5"
              fillOpacity="0.65"
            />

            {/* 4. Radiating Sunburst Linework */}
            <g transform="translate(420, 200)" stroke="#22382F" strokeWidth="1.2" opacity="0.65">
              <circle cx="0" cy="0" r="32" fill="none" strokeWidth="1" strokeDasharray="3 3" />
              {/* Radial Sunburst Spikes */}
              {Array.from({ length: 32 }).map((_, i) => {
                const angle = (i * 360) / 32;
                const rad = (angle * Math.PI) / 180;
                const rInner = 38 + (i % 2 === 0 ? 0 : 5);
                const rOuter = 65 + (i % 3 === 0 ? 12 : i % 2 === 0 ? 6 : 0);
                return (
                  <line
                    key={i}
                    x1={Math.cos(rad) * rInner}
                    y1={Math.sin(rad) * rInner}
                    x2={Math.cos(rad) * rOuter}
                    y2={Math.sin(rad) * rOuter}
                  />
                );
              })}
            </g>

            {/* 5. Stippled Organic Dotted Texture Cluster */}
            <g fill="#6B8E7B" opacity="0.65">
              <circle cx="480" cy="380" r="7" />
              <circle cx="505" cy="395" r="9" />
              <circle cx="475" cy="410" r="6" />
              <circle cx="520" cy="425" r="11" />
              <circle cx="495" cy="440" r="8" />
              <circle cx="470" cy="455" r="6" />
              <circle cx="525" cy="460" r="7" />
              <circle cx="500" cy="475" r="9" />
              <circle cx="480" cy="495" r="5" />
            </g>

            {/* 6. Stylized Monstera / Tropical Cutout Leaf (Muted Seafoam Teal) */}
            <g transform="translate(200, 300) scale(1.05)">
              <path
                d="M120 180 C110 130 90 90 40 70 C-10 50 -60 70 -80 120 C-100 170 -90 230 -50 280 C-10 330 60 350 110 310 C140 280 130 220 120 180 Z"
                fill="#3E8984"
                fillOpacity="0.75"
              />
              {/* Fenestration Cutouts in Monstera (Negative Space Holes) */}
              <g fill="#F9F8F5">
                <ellipse cx="20" cy="130" rx="9" ry="24" transform="rotate(-30 20 130)" />
                <ellipse cx="-20" cy="160" rx="9" ry="28" transform="rotate(-15 -20 160)" />
                <ellipse cx="50" cy="190" rx="8" ry="22" transform="rotate(-40 50 190)" />
                <ellipse cx="-40" cy="220" rx="9" ry="25" transform="rotate(10 -40 220)" />
                <ellipse cx="30" cy="240" rx="8" ry="18" transform="rotate(-25 30 240)" />
                <circle cx="-5" cy="205" r="5" />
              </g>
              {/* Leaf Stem Tail */}
              <path d="M100 310 Q140 370 210 400" stroke="#3E8984" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
            </g>

            {/* 7. Delicate Golden Olive Fern Frond */}
            <g transform="translate(70, 360) rotate(15)" stroke="#B38E46" fill="#B38E46" opacity="0.85">
              <path d="M0 60 Q80 20 160 0" strokeWidth="2" fill="none" />
              {/* Pinnate Leaflets */}
              <path d="M30 50 C40 30 60 35 60 50 C60 65 40 60 30 50 Z" />
              <path d="M50 42 C65 20 85 25 85 40 C85 55 65 52 50 42 Z" />
              <path d="M75 33 C95 10 115 15 115 30 C115 45 95 42 75 33 Z" />
              <path d="M105 23 C125 0 145 5 145 20 C145 35 125 32 105 23 Z" />
              <path d="M135 12 C155 -10 175 -5 175 10 C175 25 155 22 135 12 Z" />
              {/* Downward Leaflets */}
              <path d="M40 54 C45 75 30 85 20 75 C10 65 25 58 40 54 Z" />
              <path d="M65 46 C70 68 55 78 45 68 C35 58 50 50 65 46 Z" />
              <path d="M90 37 C95 59 80 69 70 59 C60 49 75 41 90 37 Z" />
              <path d="M120 27 C125 49 110 59 100 49 C90 39 105 31 120 27 Z" />
            </g>

            {/* 8. Fine Ink Botanical Branch with Leaves & Berries (Dark Green Line Art) */}
            <g stroke="#1A3328" strokeWidth="1.5" fill="none" opacity="0.85">
              <path d="M-20 120 Q60 60 180 80 T320 60" />
              {/* Delicate Leaf Contours */}
              <path d="M30 95 C25 65 55 55 65 75 C75 95 45 105 30 95 Z" fill="#2D4D3D" fillOpacity="0.4" />
              <path d="M80 85 C85 50 115 45 120 65 C125 85 95 95 80 85 Z" fill="#2D4D3D" fillOpacity="0.3" />
              <path d="M140 78 C150 40 180 40 180 60 C180 80 155 88 140 78 Z" fill="#2D4D3D" fillOpacity="0.4" />
              <path d="M210 72 C225 35 255 40 250 60 C245 80 220 85 210 72 Z" fill="#2D4D3D" fillOpacity="0.3" />
              <path d="M270 65 C290 30 320 40 310 60 C300 80 280 80 270 65 Z" fill="#2D4D3D" fillOpacity="0.4" />
              {/* Botanical Berries */}
              <circle cx="110" cy="50" r="3.5" fill="#B38E46" stroke="none" />
              <circle cx="170" cy="42" r="3.5" fill="#B38E46" stroke="none" />
              <circle cx="240" cy="40" r="3.5" fill="#B38E46" stroke="none" />
            </g>
          </g>

          {/* ── BOTTOM-LEFT BOTANICAL WREATH & OCHRE ACCENTS ─────────────────── */}
          <g transform="translate(-110, 520)">
            {/* 1. Fluid Warm Mustard Ochre Organic Blob */}
            <path
              d="M120 160 C240 80 340 140 380 240 C420 340 340 460 220 440 C100 420 40 320 50 220 C60 140 80 180 120 160 Z"
              fill="#D49B35"
              fillOpacity="0.55"
            />

            {/* 2. Overlapping Soft Eucalyptus Teal Fluid Shape */}
            <path
              d="M220 220 C340 180 440 240 440 340 C440 440 340 500 240 480 C140 460 120 360 140 280 C160 220 180 240 220 220 Z"
              fill="#86ADA0"
              fillOpacity="0.5"
            />

            {/* 3. Small Mustard Floating Island Dot */}
            <circle cx="280" cy="180" r="18" fill="#D49B35" fillOpacity="0.7" />

            {/* 4. Elegant Sweeping Botanical Ellipse & Wreath Arc */}
            <path
              d="M160 40 C320 -10 500 80 540 260 C580 440 440 580 260 580"
              stroke="#1A3328"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              fill="none"
              opacity="0.5"
            />

            {/* 5. Delicate Arching Vine with Seed Pods & Eucalyptus Leaves */}
            <g stroke="#1A3328" strokeWidth="1.4" fill="none" opacity="0.85">
              <path d="M120 220 Q200 80 360 40" />
              {/* Slender Pointed Leaves */}
              <path d="M170 140 C170 100 200 90 220 110 C240 130 200 155 170 140 Z" fill="#FFFFFF" fillOpacity="0.7" />
              <path d="M230 95 C235 60 270 55 285 75 C300 95 265 110 230 95 Z" fill="#FFFFFF" fillOpacity="0.7" />
              <path d="M300 65 C310 30 345 30 355 50 C365 70 330 80 300 65 Z" fill="#FFFFFF" fillOpacity="0.7" />
              {/* Seed Pod Droplets */}
              <circle cx="250" cy="55" r="3" fill="#D49B35" stroke="none" />
              <circle cx="310" cy="35" r="3" fill="#D49B35" stroke="none" />
              <circle cx="370" cy="35" r="3" fill="#D49B35" stroke="none" />
            </g>

            {/* 6. Hand-Drawn Botanical Flower Blossom Cluster (Bottom-Right of cluster) */}
            <g transform="translate(320, 320)" stroke="#1A3328" strokeWidth="1.3" fill="#FFFFFF" fillOpacity="0.75" opacity="0.9">
              {/* Flower Petals */}
              <path d="M0 0 C-10 -25 10 -25 0 0 Z" />
              <path d="M0 0 C15 -20 30 -5 0 0 Z" />
              <path d="M0 0 C25 5 20 25 0 0 Z" />
              <path d="M0 0 C5 25 -15 25 0 0 Z" />
              <path d="M0 0 C-25 15 -25 -10 0 0 Z" />
              {/* Stem Sprig with Berries */}
              <path d="M0 0 Q20 25 40 30" fill="none" />
              <circle cx="35" cy="22" r="2.5" fill="#5A8F70" stroke="none" />
              <circle cx="45" cy="30" r="2.5" fill="#5A8F70" stroke="none" />
              <circle cx="42" cy="40" r="2.5" fill="#5A8F70" stroke="none" />
            </g>
          </g>
        </g>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DARK MODE BOTANICAL ILLUSTRATION (LUMINOUS FOREST & EMERALD)        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <g className="hidden dark:block transition-opacity duration-700">

          {/* ── TOP-RIGHT BOTANICAL CLUSTER ─────────────────────────────────── */}
          <g transform="translate(1020, -70)">
            {/* 1. Large Deep Emerald Base Blob */}
            <path
              d="M260 140 C380 120 520 220 540 360 C560 500 440 600 300 620 C160 640 60 520 60 380 C60 240 140 160 260 140 Z"
              fill="#134E4A"
              fillOpacity="0.4"
            />

            {/* 2. Overlapping Luminous Teal Organic Shape */}
            <path
              d="M160 180 C260 140 360 180 390 280 C420 380 340 480 230 490 C120 500 70 410 70 310 C70 210 100 200 160 180 Z"
              fill="#0F766E"
              fillOpacity="0.5"
            />

            {/* 3. Small Sand/Umber Accent Pebble */}
            <path
              d="M80 380 C130 360 170 390 170 430 C170 470 120 510 70 490 C20 470 30 400 80 380 Z"
              fill="#785A36"
              fillOpacity="0.5"
            />

            {/* 4. Radiating Sunburst Linework (Glowing Ivory) */}
            <g transform="translate(420, 200)" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.6">
              <circle cx="0" cy="0" r="32" fill="none" strokeWidth="1" strokeDasharray="3 3" stroke="#2DD4BF" />
              {Array.from({ length: 32 }).map((_, i) => {
                const angle = (i * 360) / 32;
                const rad = (angle * Math.PI) / 180;
                const rInner = 38 + (i % 2 === 0 ? 0 : 5);
                const rOuter = 65 + (i % 3 === 0 ? 12 : i % 2 === 0 ? 6 : 0);
                return (
                  <line
                    key={i}
                    x1={Math.cos(rad) * rInner}
                    y1={Math.sin(rad) * rInner}
                    x2={Math.cos(rad) * rOuter}
                    y2={Math.sin(rad) * rOuter}
                  />
                );
              })}
            </g>

            {/* 5. Stippled Organic Dotted Texture Cluster */}
            <g fill="#2DD4BF" opacity="0.65">
              <circle cx="480" cy="380" r="7" />
              <circle cx="505" cy="395" r="9" />
              <circle cx="475" cy="410" r="6" />
              <circle cx="520" cy="425" r="11" />
              <circle cx="495" cy="440" r="8" />
              <circle cx="470" cy="455" r="6" />
              <circle cx="525" cy="460" r="7" />
              <circle cx="500" cy="475" r="9" />
              <circle cx="480" cy="495" r="5" />
            </g>

            {/* 6. Stylized Monstera / Tropical Cutout Leaf (Luminous Phosphor Seafoam) */}
            <g transform="translate(200, 300) scale(1.05)">
              <path
                d="M120 180 C110 130 90 90 40 70 C-10 50 -60 70 -80 120 C-100 170 -90 230 -50 280 C-10 330 60 350 110 310 C140 280 130 220 120 180 Z"
                fill="#14B8A6"
                fillOpacity="0.5"
              />
              {/* Fenestration Cutouts in Monstera (Dark Cutouts) */}
              <g fill="#111614">
                <ellipse cx="20" cy="130" rx="9" ry="24" transform="rotate(-30 20 130)" />
                <ellipse cx="-20" cy="160" rx="9" ry="28" transform="rotate(-15 -20 160)" />
                <ellipse cx="50" cy="190" rx="8" ry="22" transform="rotate(-40 50 190)" />
                <ellipse cx="-40" cy="220" rx="9" ry="25" transform="rotate(10 -40 220)" />
                <ellipse cx="30" cy="240" rx="8" ry="18" transform="rotate(-25 30 240)" />
                <circle cx="-5" cy="205" r="5" />
              </g>
              <path d="M100 310 Q140 370 210 400" stroke="#5EEAD4" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
            </g>

            {/* 7. Radiant Golden Fern Frond */}
            <g transform="translate(70, 360) rotate(15)" stroke="#F59E0B" fill="#F59E0B" opacity="0.85">
              <path d="M0 60 Q80 20 160 0" strokeWidth="2" fill="none" />
              <path d="M30 50 C40 30 60 35 60 50 C60 65 40 60 30 50 Z" />
              <path d="M50 42 C65 20 85 25 85 40 C85 55 65 52 50 42 Z" />
              <path d="M75 33 C95 10 115 15 115 30 C115 45 95 42 75 33 Z" />
              <path d="M105 23 C125 0 145 5 145 20 C145 35 125 32 105 23 Z" />
              <path d="M135 12 C155 -10 175 -5 175 10 C175 25 155 22 135 12 Z" />
              <path d="M40 54 C45 75 30 85 20 75 C10 65 25 58 40 54 Z" />
              <path d="M65 46 C70 68 55 78 45 68 C35 58 50 50 65 46 Z" />
              <path d="M90 37 C95 59 80 69 70 59 C60 49 75 41 90 37 Z" />
              <path d="M120 27 C125 49 110 59 100 49 C90 39 105 31 120 27 Z" />
            </g>

            {/* 8. Fine Glowing Botanical Branch */}
            <g stroke="#E2E8F0" strokeWidth="1.5" fill="none" opacity="0.85">
              <path d="M-20 120 Q60 60 180 80 T320 60" />
              <path d="M30 95 C25 65 55 55 65 75 C75 95 45 105 30 95 Z" fill="#2DD4BF" fillOpacity="0.25" />
              <path d="M80 85 C85 50 115 45 120 65 C125 85 95 95 80 85 Z" fill="#2DD4BF" fillOpacity="0.2" />
              <path d="M140 78 C150 40 180 40 180 60 C180 80 155 88 140 78 Z" fill="#2DD4BF" fillOpacity="0.25" />
              <path d="M210 72 C225 35 255 40 250 60 C245 80 220 85 210 72 Z" fill="#2DD4BF" fillOpacity="0.2" />
              <path d="M270 65 C290 30 320 40 310 60 C300 80 280 80 270 65 Z" fill="#2DD4BF" fillOpacity="0.25" />
              <circle cx="110" cy="50" r="3.5" fill="#FBBF24" stroke="none" />
              <circle cx="170" cy="42" r="3.5" fill="#FBBF24" stroke="none" />
              <circle cx="240" cy="40" r="3.5" fill="#FBBF24" stroke="none" />
            </g>
          </g>

          {/* ── BOTTOM-LEFT BOTANICAL WREATH & OCHRE ACCENTS ─────────────────── */}
          <g transform="translate(-110, 520)">
            {/* 1. Fluid Luminous Amber Ochre Blob */}
            <path
              d="M120 160 C240 80 340 140 380 240 C420 340 340 460 220 440 C100 420 40 320 50 220 C60 140 80 180 120 160 Z"
              fill="#D97706"
              fillOpacity="0.45"
            />

            {/* 2. Overlapping Forest Teal Fluid Shape */}
            <path
              d="M220 220 C340 180 440 240 440 340 C440 440 340 500 240 480 C140 460 120 360 140 280 C160 220 180 240 220 220 Z"
              fill="#0D9488"
              fillOpacity="0.4"
            />

            <circle cx="280" cy="180" r="18" fill="#F59E0B" fillOpacity="0.6" />

            <path
              d="M160 40 C320 -10 500 80 540 260 C580 440 440 580 260 580"
              stroke="#5EEAD4"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              fill="none"
              opacity="0.45"
            />

            <g stroke="#E2E8F0" strokeWidth="1.4" fill="none" opacity="0.85">
              <path d="M120 220 Q200 80 360 40" />
              <path d="M170 140 C170 100 200 90 220 110 C240 130 200 155 170 140 Z" fill="#1E293B" fillOpacity="0.6" />
              <path d="M230 95 C235 60 270 55 285 75 C300 95 265 110 230 95 Z" fill="#1E293B" fillOpacity="0.6" />
              <path d="M300 65 C310 30 345 30 355 50 C365 70 330 80 300 65 Z" fill="#1E293B" fillOpacity="0.6" />
              <circle cx="250" cy="55" r="3" fill="#FBBF24" stroke="none" />
              <circle cx="310" cy="35" r="3" fill="#FBBF24" stroke="none" />
              <circle cx="370" cy="35" r="3" fill="#FBBF24" stroke="none" />
            </g>

            <g transform="translate(320, 320)" stroke="#E2E8F0" strokeWidth="1.3" fill="#1E293B" fillOpacity="0.75" opacity="0.9">
              <path d="M0 0 C-10 -25 10 -25 0 0 Z" />
              <path d="M0 0 C15 -20 30 -5 0 0 Z" />
              <path d="M0 0 C25 5 20 25 0 0 Z" />
              <path d="M0 0 C5 25 -15 25 0 0 Z" />
              <path d="M0 0 C-25 15 -25 -10 0 0 Z" />
              <path d="M0 0 Q20 25 40 30" fill="none" />
              <circle cx="35" cy="22" r="2.5" fill="#2DD4BF" stroke="none" />
              <circle cx="45" cy="30" r="2.5" fill="#2DD4BF" stroke="none" />
              <circle cx="42" cy="40" r="2.5" fill="#2DD4BF" stroke="none" />
            </g>
          </g>
        </g>
      </svg>

      {/* ── TACTILE ORGANIC GRAIN TEXTURE OVERLAY ─────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{ filter: 'url(#botanical-grain)' }}
      />
    </div>
  );
};

export default BackgroundOrganicBotanical;
