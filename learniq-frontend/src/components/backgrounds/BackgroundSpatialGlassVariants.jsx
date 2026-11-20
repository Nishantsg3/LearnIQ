import React from 'react';

/**
 * Direction 5 Refinements: Apple Vision Pro + Modern University Library
 * Architectural, academic, tactile glass with warm stone & muted violet tones.
 *
 * Variants:
 * - 'minimal' (5A): Fewer slabs, whisper-quiet shadows, softer warm tones.
 * - 'dramatic' (5B): Grand architectural monoliths, deep atmospheric shadows, rich warmth.
 * - 'balanced' (5C): The sweet spot. Harmonic dual slabs, balanced depth, pure poise.
 */
const BackgroundSpatialGlassVariants = ({ variant = 'balanced' }) => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 transition-colors duration-700 bg-[#F9F8F5] dark:bg-[#0B0C10]"
    >
      {/* ── ROOM FOUNDATION: WARM ALABASTER STONE / DEEP SLATE CARBON ─────── */}
      <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_110%_90%_at_50%_-10%,#FFFDF9_0%,#F5F2EB_55%,#EBE7DE_100%)]" />
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_110%_90%_at_50%_-10%,#151620_0%,#0B0C10_60%,#07080B_100%)]" />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VARIANT 5A: MINIMAL ARCHITECTURAL (SUBTLE, SERENE)                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {variant === 'minimal' && (
        <>
          {/* Top-Right: Single serene rounded glass tablet */}
          <div
            className="absolute -top-20 -right-20 w-[640px] h-[640px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 380px at 70% 30%, black 45%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle 380px at 70% 30%, black 45%, transparent 90%)'
            }}
          >
            {/* Soft Warm Violet & Honey Amber Emitter */}
            <div
              className="absolute top-20 right-20 w-[420px] h-[420px] rounded-[56px] rotate-[-8deg] opacity-50 dark:opacity-30 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(135deg, #7C6F9B 0%, #B89C82 60%, #E8D9C8 100%)',
                filter: 'blur(80px)',
              }}
            />

            {/* Quiet Glass Tablet */}
            <div
              className="absolute top-24 right-20 w-[460px] h-[340px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(-8deg)',
                backdropFilter: 'blur(28px) saturate(140%)',
                WebkitBackdropFilter: 'blur(28px) saturate(140%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.60) 0%, rgba(245, 242, 235, 0.25) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.85)',
                boxShadow: `
                  0 20px 45px -10px rgba(124, 111, 155, 0.12),
                  0 8px 18px -4px rgba(0, 0, 0, 0.04),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.9)
                `
              }}
            />
            {/* Dark Variant */}
            <div
              className="hidden dark:block absolute top-24 right-20 w-[460px] h-[340px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(-8deg)',
                backdropFilter: 'blur(32px) saturate(130%)',
                WebkitBackdropFilter: 'blur(32px) saturate(130%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: `
                  0 25px 60px -15px rgba(0, 0, 0, 0.75),
                  0 0 35px -5px rgba(124, 111, 155, 0.2),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.3)
                `
              }}
            />
          </div>

          {/* Bottom-Left: Soft Stone Glass Pedestal */}
          <div
            className="absolute -bottom-20 -left-20 w-[640px] h-[640px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 380px at 30% 70%, black 45%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle 380px at 30% 70%, black 45%, transparent 90%)'
            }}
          >
            <div
              className="absolute bottom-20 left-20 w-[420px] h-[420px] rounded-[56px] rotate-[8deg] opacity-50 dark:opacity-25 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(135deg, #B89C82 0%, #7C6F9B 70%, #9B8BAF 100%)',
                filter: 'blur(80px)',
              }}
            />

            <div
              className="absolute bottom-24 left-20 w-[460px] h-[330px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(8deg)',
                backdropFilter: 'blur(28px) saturate(140%)',
                WebkitBackdropFilter: 'blur(28px) saturate(140%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(245, 242, 235, 0.30) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: `
                  0 20px 45px -10px rgba(184, 156, 130, 0.14),
                  0 8px 18px -4px rgba(0, 0, 0, 0.04),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.9)
                `
              }}
            />
            <div
              className="hidden dark:block absolute bottom-24 left-20 w-[460px] h-[330px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(8deg)',
                backdropFilter: 'blur(32px) saturate(130%)',
                WebkitBackdropFilter: 'blur(32px) saturate(130%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: `
                  0 25px 60px -15px rgba(0, 0, 0, 0.75),
                  0 0 35px -5px rgba(184, 156, 130, 0.18),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.3)
                `
              }}
            />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VARIANT 5B: DRAMATIC MONUMENTAL (GRAND, STRONG SHADOWS)             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {variant === 'dramatic' && (
        <>
          {/* Top-Right: Grand Architectural Terraced Monoliths */}
          <div
            className="absolute -top-28 -right-28 w-[780px] h-[780px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 460px at 70% 30%, black 50%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle 460px at 70% 30%, black 50%, transparent 95%)'
            }}
          >
            {/* Rich Atmospheric Glow (Muted Violet + Warm Umber) */}
            <div
              className="absolute top-16 right-16 w-[520px] h-[520px] rounded-[64px] rotate-[-10deg] opacity-70 dark:opacity-45 transition-opacity duration-700"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #4A3E65 0deg, #6B5B88 90deg, #A88B70 180deg, #5C4B77 270deg, #4A3E65 360deg)',
                filter: 'blur(75px)',
              }}
            />

            {/* Monumental Slab 1 (Base Grand Tablet) */}
            <div
              className="absolute top-20 right-16 w-[560px] h-[410px] rounded-[52px] transition-all duration-700"
              style={{
                transform: 'rotate(-10deg)',
                backdropFilter: 'blur(36px) saturate(160%)',
                WebkitBackdropFilter: 'blur(36px) saturate(160%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(245, 240, 230, 0.35) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.9)',
                boxShadow: `
                  0 35px 80px -15px rgba(74, 62, 101, 0.28),
                  0 15px 30px -8px rgba(0, 0, 0, 0.08),
                  inset 0 2px 3px 0 rgba(255, 255, 255, 0.95),
                  inset 0 -1.5px 3px 0 rgba(74, 62, 101, 0.12)
                `
              }}
            >
              <div className="absolute inset-x-12 top-14 h-[1px] bg-gradient-to-r from-white/95 via-white/50 to-transparent" />
            </div>
            <div
              className="hidden dark:block absolute top-20 right-16 w-[560px] h-[410px] rounded-[52px] transition-all duration-700"
              style={{
                transform: 'rotate(-10deg)',
                backdropFilter: 'blur(40px) saturate(150%)',
                WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.22)',
                boxShadow: `
                  0 40px 95px -20px rgba(0, 0, 0, 0.9),
                  0 0 60px -10px rgba(107, 91, 136, 0.35),
                  inset 0 2px 2px 0 rgba(255, 255, 255, 0.45),
                  inset 0 -1px 2px 0 rgba(107, 91, 136, 0.25)
                `
              }}
            >
              <div className="absolute inset-x-12 top-14 h-[1px] bg-gradient-to-r from-violet-200/50 via-white/20 to-transparent" />
            </div>

            {/* Monumental Slab 2 (Harmonic Stepped Facet -10deg parallel) */}
            <div
              className="absolute top-48 right-36 w-[450px] h-[310px] rounded-[40px] transition-all duration-700"
              style={{
                transform: 'rotate(-4deg)',
                backdropFilter: 'blur(28px) saturate(170%)',
                WebkitBackdropFilter: 'blur(28px) saturate(170%)',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.60) 0%, rgba(184, 156, 130, 0.12) 50%, rgba(92, 75, 119, 0.14) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: `
                  0 28px 60px -12px rgba(168, 139, 112, 0.22),
                  0 10px 22px -5px rgba(0, 0, 0, 0.06),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)
                `
              }}
            />
            <div
              className="hidden dark:block absolute top-48 right-36 w-[450px] h-[310px] rounded-[40px] transition-all duration-700"
              style={{
                transform: 'rotate(-4deg)',
                backdropFilter: 'blur(32px) saturate(150%)',
                WebkitBackdropFilter: 'blur(32px) saturate(150%)',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(168, 139, 112, 0.06) 50%, rgba(107, 91, 136, 0.10) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                boxShadow: `
                  0 32px 75px -15px rgba(0, 0, 0, 0.85),
                  0 0 40px -5px rgba(168, 139, 112, 0.25),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.45)
                `
              }}
            />
          </div>

          {/* Bottom-Left: Monumental Foundation */}
          <div
            className="absolute -bottom-28 -left-28 w-[780px] h-[780px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 460px at 30% 70%, black 50%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle 460px at 30% 70%, black 50%, transparent 95%)'
            }}
          >
            <div
              className="absolute bottom-16 left-16 w-[520px] h-[520px] rounded-[64px] rotate-[10deg] opacity-70 dark:opacity-40 transition-opacity duration-700"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, #8C7A6B 0deg, #5B4E77 120deg, #9C8A79 240deg, #8C7A6B 360deg)',
                filter: 'blur(75px)',
              }}
            />

            <div
              className="absolute bottom-20 left-16 w-[560px] h-[410px] rounded-[52px] transition-all duration-700"
              style={{
                transform: 'rotate(10deg)',
                backdropFilter: 'blur(36px) saturate(160%)',
                WebkitBackdropFilter: 'blur(36px) saturate(160%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(245, 240, 230, 0.35) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: `
                  0 35px 80px -15px rgba(140, 122, 107, 0.26),
                  0 15px 30px -8px rgba(0, 0, 0, 0.08),
                  inset 0 2px 3px 0 rgba(255, 255, 255, 0.95)
                `
              }}
            />
            <div
              className="hidden dark:block absolute bottom-20 left-16 w-[560px] h-[410px] rounded-[52px] transition-all duration-700"
              style={{
                transform: 'rotate(10deg)',
                backdropFilter: 'blur(40px) saturate(150%)',
                WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.22)',
                boxShadow: `
                  0 40px 95px -20px rgba(0, 0, 0, 0.9),
                  0 0 50px -10px rgba(140, 122, 107, 0.3),
                  inset 0 2px 2px 0 rgba(255, 255, 255, 0.45)
                `
              }}
            />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VARIANT 5C: THE "SWEET SPOT" (BALANCED HARMONY, PERFECT POISE)      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {variant === 'balanced' && (
        <>
          {/* Top-Right: Balanced Architectural Pavilion */}
          <div
            className="absolute -top-24 -right-24 w-[700px] h-[700px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 420px at 70% 30%, black 50%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(circle 420px at 70% 30%, black 50%, transparent 92%)'
            }}
          >
            {/* Luminous Warm Violet + Alabaster Honey Ambient Emitter */}
            <div
              className="absolute top-16 right-16 w-[460px] h-[460px] rounded-[52px] rotate-[-8deg] opacity-65 dark:opacity-35 transition-opacity duration-700"
              style={{
                background: 'conic-gradient(from 160deg at 50% 50%, #5B4E77 0deg, #7C6F9B 80deg, #C2A78F 180deg, #9C8573 260deg, #5B4E77 360deg)',
                filter: 'blur(75px)',
              }}
            />

            {/* Primary Glass Slab (-8deg) */}
            <div
              className="absolute top-20 right-16 w-[490px] h-[370px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(-8deg)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(245, 240, 232, 0.30) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.88)',
                boxShadow: `
                  0 24px 55px -12px rgba(91, 78, 119, 0.18),
                  0 10px 22px -5px rgba(0, 0, 0, 0.05),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
                  inset 0 -1px 2px 0 rgba(91, 78, 119, 0.10)
                `
              }}
            >
              <div className="absolute inset-x-10 top-12 h-[1px] bg-gradient-to-r from-white/90 via-white/40 to-transparent" />
            </div>
            <div
              className="hidden dark:block absolute top-20 right-16 w-[490px] h-[370px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(-8deg)',
                backdropFilter: 'blur(34px) saturate(140%)',
                WebkitBackdropFilter: 'blur(34px) saturate(140%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.015) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: `
                  0 30px 75px -15px rgba(0, 0, 0, 0.85),
                  0 0 45px -8px rgba(124, 111, 155, 0.28),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.35),
                  inset 0 -1px 2px 0 rgba(124, 111, 155, 0.18)
                `
              }}
            >
              <div className="absolute inset-x-10 top-12 h-[1px] bg-gradient-to-r from-violet-200/40 via-white/15 to-transparent" />
            </div>

            {/* Stepped Interlocking Facet (Parallel Aligned -4deg) */}
            <div
              className="absolute top-44 right-32 w-[410px] h-[290px] rounded-[36px] transition-all duration-700"
              style={{
                transform: 'rotate(-3deg)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(194, 167, 143, 0.10) 45%, rgba(91, 78, 119, 0.12) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.92)',
                boxShadow: `
                  0 18px 40px -10px rgba(194, 167, 143, 0.16),
                  0 8px 16px -4px rgba(0, 0, 0, 0.05),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)
                `
              }}
            />
            <div
              className="hidden dark:block absolute top-44 right-32 w-[410px] h-[290px] rounded-[36px] transition-all duration-700"
              style={{
                transform: 'rotate(-3deg)',
                backdropFilter: 'blur(28px) saturate(145%)',
                WebkitBackdropFilter: 'blur(28px) saturate(145%)',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(194, 167, 143, 0.05) 45%, rgba(124, 111, 155, 0.08) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                boxShadow: `
                  0 24px 60px -12px rgba(0, 0, 0, 0.8),
                  0 0 30px -5px rgba(194, 167, 143, 0.2),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4)
                `
              }}
            />
          </div>

          {/* Bottom-Left: Balanced Mineral Glass Foundation */}
          <div
            className="absolute -bottom-24 -left-24 w-[700px] h-[700px] pointer-events-none"
            style={{
              maskImage: 'radial-gradient(circle 420px at 30% 70%, black 50%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(circle 420px at 30% 70%, black 50%, transparent 92%)'
            }}
          >
            <div
              className="absolute bottom-16 left-16 w-[460px] h-[460px] rounded-[52px] rotate-[8deg] opacity-65 dark:opacity-30 transition-opacity duration-700"
              style={{
                background: 'conic-gradient(from 340deg at 50% 50%, #8C7A6B 0deg, #A89584 90deg, #6B5B88 200deg, #8C7A6B 360deg)',
                filter: 'blur(75px)',
              }}
            />

            <div
              className="absolute bottom-20 left-16 w-[490px] h-[370px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(8deg)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(245, 240, 232, 0.30) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.92)',
                boxShadow: `
                  0 24px 55px -12px rgba(140, 122, 107, 0.18),
                  0 10px 22px -5px rgba(0, 0, 0, 0.05),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
                  inset 0 -1px 2px 0 rgba(140, 122, 107, 0.10)
                `
              }}
            >
              <div className="absolute inset-x-10 bottom-12 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-white/90" />
            </div>
            <div
              className="hidden dark:block absolute bottom-20 left-16 w-[490px] h-[370px] rounded-[44px] transition-all duration-700"
              style={{
                transform: 'rotate(8deg)',
                backdropFilter: 'blur(34px) saturate(140%)',
                WebkitBackdropFilter: 'blur(34px) saturate(140%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.015) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: `
                  0 30px 75px -15px rgba(0, 0, 0, 0.85),
                  0 0 45px -8px rgba(140, 122, 107, 0.25),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.35)
                `
              }}
            />

            <div
              className="absolute bottom-40 left-32 w-[410px] h-[290px] rounded-[36px] transition-all duration-700"
              style={{
                transform: 'rotate(4deg)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                background: 'linear-gradient(150deg, rgba(255, 255, 255, 0.60) 0%, rgba(140, 122, 107, 0.08) 50%, rgba(107, 91, 136, 0.10) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                boxShadow: `
                  0 18px 40px -10px rgba(140, 122, 107, 0.16),
                  0 8px 16px -4px rgba(0, 0, 0, 0.05),
                  inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95)
                `
              }}
            />
            <div
              className="hidden dark:block absolute bottom-40 left-32 w-[410px] h-[290px] rounded-[36px] transition-all duration-700"
              style={{
                transform: 'rotate(4deg)',
                backdropFilter: 'blur(28px) saturate(145%)',
                WebkitBackdropFilter: 'blur(28px) saturate(145%)',
                background: 'linear-gradient(150deg, rgba(255, 255, 255, 0.07) 0%, rgba(140, 122, 107, 0.04) 50%, rgba(107, 91, 136, 0.08) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                boxShadow: `
                  0 24px 60px -12px rgba(0, 0, 0, 0.8),
                  0 0 30px -5px rgba(140, 122, 107, 0.2),
                  inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4)
                `
              }}
            />
          </div>
        </>
      )}

      {/* ── PRISTINE CENTER READING ARENA (NO TEXT CONFLICTS) ─────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 620px at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 85%)',
        }}
      />
    </div>
  );
};

export default BackgroundSpatialGlassVariants;
