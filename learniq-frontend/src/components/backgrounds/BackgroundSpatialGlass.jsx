import React from 'react';

/**
 * BackgroundSpatialGlass — Translucent Layered Glass Background Canvas
 *
 * Renders an ambient backdrop using:
 * - Corner-anchored translucent panels with CSS backdrop-filter blur and specular border highlights.
 * - Blurred chromatic conic gradients producing soft ambient backlighting.
 * - Dual-theme radial gradient room base with smooth CSS opacity transitions.
 */
const BackgroundSpatialGlass = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#F8F9FC] dark:bg-[#090A0F]"
    >
      {/* ── ROOM ILLUMINATION & AMBIENT BASE ──────────────────────────────── */}
      {/* Light Mode: Warm architectural gallery base with subtle room shading */}
      <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#FFFFFF_0%,#F3F4F8_60%,#E9EBF2_100%)]" />
      {/* Dark Mode: Deep obsidian slate void with soft atmospheric overhead fill */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_120%_100%_at_50%_0%,#111420_0%,#090A0F_65%,#050608_100%)]" />

      {/* ── TOP-RIGHT CORNER: PRISMATIC GLASS PAVILION ─────────────────────── */}
      <div
        className="absolute -top-24 -right-24 w-[720px] h-[720px] pointer-events-none"
        style={{
          maskImage: 'radial-gradient(circle 420px at 70% 30%, black 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle 420px at 70% 30%, black 50%, transparent 95%)'
        }}
      >
        {/* Saturated Chromatic Emitter Underneath (Vivid Indigo + Violet + Coral) */}
        <div
          className="absolute top-16 right-16 w-[480px] h-[480px] rounded-[48px] rotate-[-12deg] opacity-75 dark:opacity-45 transition-opacity duration-700"
          style={{
            background: 'conic-gradient(from 140deg at 50% 50%, #4338CA 0deg, #7C3AED 90deg, #F43F5E 180deg, #06B6D4 270deg, #4338CA 360deg)',
            filter: 'blur(70px)',
          }}
        />

        {/* Spatial Glass Slab 1: Primary Heavy Monolith (-18deg) */}
        <div
          className="absolute top-20 right-14 w-[500px] h-[380px] rounded-[36px] transition-all duration-700"
          style={{
            transform: 'rotate(-18deg)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.25) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: `
              0 24px 60px -12px rgba(67, 56, 202, 0.22),
              0 12px 24px -6px rgba(0, 0, 0, 0.08),
              inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
              inset 0 -1px 2px 0 rgba(67, 56, 202, 0.15)
            `
          }}
        >
          {/* Subtle internal architectural bevel line */}
          <div className="absolute inset-x-8 top-12 h-[1px] bg-gradient-to-r from-white/90 via-white/40 to-transparent" />
        </div>

        {/* Spatial Glass Slab 1 (Dark Mode Variant) */}
        <div
          className="hidden dark:block absolute top-20 right-14 w-[500px] h-[380px] rounded-[36px] transition-all duration-700"
          style={{
            transform: 'rotate(-18deg)',
            backdropFilter: 'blur(36px) saturate(160%)',
            WebkitBackdropFilter: 'blur(36px) saturate(160%)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: `
              0 30px 80px -15px rgba(0, 0, 0, 0.85),
              0 0 50px -10px rgba(124, 58, 237, 0.35),
              inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 2px 0 rgba(124, 58, 237, 0.2)
            `
          }}
        >
          <div className="absolute inset-x-8 top-12 h-[1px] bg-gradient-to-r from-violet-300/40 via-white/20 to-transparent" />
        </div>

        {/* Spatial Glass Slab 2: Interlocking Cross-Facet (-4deg, Double Refraction) */}
        <div
          className="absolute top-44 right-32 w-[420px] h-[300px] rounded-[32px] transition-all duration-700"
          style={{
            transform: 'rotate(-4deg)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(244, 63, 94, 0.08) 50%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `
              0 20px 45px -10px rgba(244, 63, 94, 0.18),
              0 8px 18px -4px rgba(0, 0, 0, 0.06),
              inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)
            `
          }}
        />

        {/* Spatial Glass Slab 2 (Dark Mode Variant) */}
        <div
          className="hidden dark:block absolute top-44 right-32 w-[420px] h-[300px] rounded-[32px] transition-all duration-700"
          style={{
            transform: 'rotate(-4deg)',
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(244, 63, 94, 0.06) 50%, rgba(124, 58, 237, 0.09) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: `
              0 25px 65px -12px rgba(0, 0, 0, 0.8),
              0 0 35px -5px rgba(244, 63, 94, 0.25),
              inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.45)
            `
          }}
        />

        {/* Specular Light-Prism Edge (Crystalline Ray) */}
        <div
          className="absolute top-32 right-24 w-[280px] h-[2px] rotate-[-18deg] bg-gradient-to-r from-transparent via-white dark:via-violet-200 to-transparent opacity-80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
        />
      </div>

      {/* ── BOTTOM-LEFT CORNER: ARCHITECTURAL MINERAL GLASS & TEAL PRISM ──── */}
      <div
        className="absolute -bottom-24 -left-24 w-[740px] h-[740px] pointer-events-none"
        style={{
          maskImage: 'radial-gradient(circle 440px at 30% 70%, black 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle 440px at 30% 70%, black 50%, transparent 95%)'
        }}
      >
        {/* Saturated Chromatic Emitter Underneath (Vivid Teal + Mineral Cyan + Indigo) */}
        <div
          className="absolute bottom-16 left-16 w-[500px] h-[500px] rounded-[52px] rotate-[15deg] opacity-75 dark:opacity-40 transition-opacity duration-700"
          style={{
            background: 'conic-gradient(from 320deg at 50% 50%, #0D9488 0deg, #0284C7 110deg, #4F46E5 220deg, #06B6D4 310deg, #0D9488 360deg)',
            filter: 'blur(75px)',
          }}
        />

        {/* Spatial Glass Slab A: Grounded Architectural Foundation (14deg) */}
        <div
          className="absolute bottom-20 left-16 w-[520px] h-[390px] rounded-[40px] transition-all duration-700"
          style={{
            transform: 'rotate(14deg)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.30) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `
              0 26px 65px -14px rgba(13, 148, 136, 0.22),
              0 14px 28px -6px rgba(0, 0, 0, 0.08),
              inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
              inset 0 -1px 2px 0 rgba(13, 148, 136, 0.15)
            `
          }}
        >
          <div className="absolute inset-x-8 bottom-12 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-white/90" />
        </div>

        {/* Spatial Glass Slab A (Dark Mode Variant) */}
        <div
          className="hidden dark:block absolute bottom-20 left-16 w-[520px] h-[390px] rounded-[40px] transition-all duration-700"
          style={{
            transform: 'rotate(14deg)',
            backdropFilter: 'blur(36px) saturate(160%)',
            WebkitBackdropFilter: 'blur(36px) saturate(160%)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: `
              0 32px 85px -18px rgba(0, 0, 0, 0.85),
              0 0 50px -10px rgba(13, 148, 136, 0.35),
              inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 2px 0 rgba(13, 148, 136, 0.2)
            `
          }}
        >
          <div className="absolute inset-x-8 bottom-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/20 to-teal-200/40" />
        </div>

        {/* Spatial Glass Slab B: Interlocking Translucent Prow (26deg) */}
        <div
          className="absolute bottom-40 left-32 w-[430px] h-[310px] rounded-[34px] transition-all duration-700"
          style={{
            transform: 'rotate(26deg)',
            backdropFilter: 'blur(26px) saturate(190%)',
            WebkitBackdropFilter: 'blur(26px) saturate(190%)',
            background: 'linear-gradient(150deg, rgba(255, 255, 255, 0.60) 0%, rgba(6, 182, 212, 0.10) 45%, rgba(13, 148, 136, 0.14) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: `
              0 22px 50px -10px rgba(6, 182, 212, 0.20),
              0 8px 18px -4px rgba(0, 0, 0, 0.06),
              inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)
            `
          }}
        />

        {/* Spatial Glass Slab B (Dark Mode Variant) */}
        <div
          className="hidden dark:block absolute bottom-40 left-32 w-[430px] h-[310px] rounded-[34px] transition-all duration-700"
          style={{
            transform: 'rotate(26deg)',
            backdropFilter: 'blur(30px) saturate(170%)',
            WebkitBackdropFilter: 'blur(30px) saturate(170%)',
            background: 'linear-gradient(150deg, rgba(255, 255, 255, 0.07) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(13, 148, 136, 0.12) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: `
              0 28px 70px -15px rgba(0, 0, 0, 0.8),
              0 0 35px -5px rgba(6, 182, 212, 0.25),
              inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.45)
            `
          }}
        />

        {/* Specular Teal Hairline Highlight */}
        <div
          className="absolute bottom-36 left-28 w-[300px] h-[2px] rotate-[26deg] bg-gradient-to-r from-transparent via-white dark:via-cyan-200 to-transparent opacity-85 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
        />
      </div>

      {/* ── CENTER STAGE ISOLATION VIGNETTE ───────────────────────────────── */}
      {/* Ensures absolute clarity and zero color fight in the main content reading area */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 600px at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 80%)',
        }}
      />
    </div>
  );
};

export default BackgroundSpatialGlass;
