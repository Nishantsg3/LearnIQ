import React from 'react';

/**
 * Direction 1: Ambient Glass & Deep Aurora (Linear / Apple Inspired)
 * - Light: Crisp off-white (#FAFAFC) with ultra-diffuse prism refraction (soft teal, warm peach, faint violet).
 * - Dark: Deep obsidian (#0A0A0A) with midnight indigo, deep teal, and ambient amethyst aurora glows.
 * - Pure atmospheric depth, zero clip-art or distracting foreground elements.
 */
const BackgroundAmbientAurora = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
    >
      {/* ── LIGHT MODE: Ambient Frosted Glass & Iridescent Prism ─────────── */}
      <div className="dark:hidden absolute inset-0 bg-[#FAFAFC]">
        {/* Soft Iridescent Ambient Bleeds */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-pulse duration-[12000ms]"
          style={{
            background: 'radial-gradient(circle, rgba(167, 243, 208, 0.5) 0%, rgba(199, 210, 254, 0.3) 50%, transparent 70%)'
          }}
        />
        <div
          className="absolute -top-[15%] -right-[15%] w-[65vw] h-[65vw] rounded-full mix-blend-multiply filter blur-[140px] opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(233, 213, 255, 0.6) 0%, rgba(254, 215, 226, 0.4) 45%, transparent 70%)'
          }}
        />
        <div
          className="absolute -bottom-[20%] right-[10%] w-[55vw] h-[55vw] rounded-full mix-blend-multiply filter blur-[130px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(254, 240, 138, 0.35) 0%, rgba(254, 205, 211, 0.4) 40%, rgba(224, 231, 255, 0.2) 70%, transparent 80%)'
          }}
        />
        <div
          className="absolute bottom-[5%] -left-[15%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[130px] opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(186, 230, 253, 0.5) 0%, rgba(221, 214, 254, 0.3) 50%, transparent 70%)'
          }}
        />

        {/* Micro Glass Shimmer / Prismatic Edge Light */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.8) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* ── DARK MODE: Deep Obsidian & Midnight Luminous Aurora ──────────── */}
      <div className="hidden dark:block absolute inset-0 bg-[#0A0A0A]">
        {/* Deep Indigo Core Bloom */}
        <div
          className="absolute -top-[25%] left-[15%] w-[70vw] h-[60vw] rounded-full filter blur-[150px] opacity-45"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(67, 56, 202, 0.45) 0%, rgba(49, 46, 129, 0.25) 50%, transparent 75%)'
          }}
        />

        {/* Midnight Teal Luminous Bleed */}
        <div
          className="absolute top-[20%] -left-[20%] w-[60vw] h-[60vw] rounded-full filter blur-[160px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(15, 118, 110, 0.4) 0%, rgba(19, 78, 74, 0.2) 55%, transparent 75%)'
          }}
        />

        {/* Deep Amethyst / Violet Bloom */}
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[160px] opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(109, 40, 217, 0.4) 0%, rgba(88, 28, 135, 0.25) 50%, transparent 75%)'
          }}
        />

        {/* Ultra-subtle Cosmic Violet Horizon Light */}
        <div
          className="absolute top-[40%] right-[20%] w-[45vw] h-[35vw] rounded-full filter blur-[140px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)'
          }}
        />

        {/* Fine Star-Field Texture Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(248, 250, 252, 0.9) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
    </div>
  );
};

export default BackgroundAmbientAurora;
