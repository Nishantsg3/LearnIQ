import React from 'react';

/**
 * Direction 3: The "LearnIQ Energy" Gradient Mesh (Brand-Derived)
 * - Directly derived from the authentic LearnIQ Energy Q logo palette:
 *   Signature Violet (#6D28D9), Interactive Purple (#7C3AED), Radiant Lavender (#C084FC),
 *   Electric Iris (#4F46E5), and Ivory Spark Glow (#F5F3FF).
 * - Light: Airy, luminous canvas with brand gradient clouds softly diffused in the margins.
 * - Dark: Deep space void (#08090E) with glowing cosmic brand nebulas and an ambient beacon bloom.
 * - Perfectly branded, modern, cohesive, and calm.
 */
const BackgroundEnergyMesh = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
    >
      {/* ── LIGHT MODE: Airy Luminous Canvas & Diffused Brand Clouds ───────── */}
      <div className="dark:hidden absolute inset-0 bg-[#F9F9FC]">
        {/* Upper Brand Violet & Lavender Mesh Cloud */}
        <div
          className="absolute -top-[20%] right-[5%] w-[65vw] h-[55vw] rounded-full filter blur-[140px] opacity-25 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(192, 132, 252, 0.3) 45%, transparent 70%)'
          }}
        />

        {/* Top-Left Soft Electric Indigo Bloom */}
        <div
          className="absolute -top-[15%] -left-[10%] w-[55vw] h-[50vw] rounded-full filter blur-[130px] opacity-20 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(129, 140, 248, 0.25) 50%, transparent 70%)'
          }}
        />

        {/* Lower Right Secondary Lavender Glow */}
        <div
          className="absolute -bottom-[20%] right-[15%] w-[50vw] h-[50vw] rounded-full filter blur-[150px] opacity-20 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(221, 214, 254, 0.3) 50%, transparent 70%)'
          }}
        />

        {/* Bottom-Left Cool Iris Mist */}
        <div
          className="absolute -bottom-[15%] -left-[15%] w-[55vw] h-[45vw] rounded-full filter blur-[140px] opacity-15 mix-blend-multiply"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.35) 0%, transparent 65%)'
          }}
        />

        {/* Brand Core Spark Halo Refraction (Centered subtle beacon) */}
        <div
          className="absolute top-[18%] right-[22%] w-[25vw] h-[25vw] rounded-full filter blur-[100px] opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(245, 243, 255, 0.9) 0%, rgba(216, 180, 254, 0.3) 60%, transparent 80%)'
          }}
        />
      </div>

      {/* ── DARK MODE: Deep Space Void & Glowing Cosmic Brand Nebulas ──────── */}
      <div className="hidden dark:block absolute inset-0 bg-[#08090D]">
        {/* Core LearnIQ Nebula Bloom (Upper Right Corner) */}
        <div
          className="absolute -top-[25%] right-[0%] w-[70vw] h-[65vw] rounded-full filter blur-[160px] opacity-40"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(109, 40, 217, 0.5) 0%, rgba(76, 29, 149, 0.3) 50%, transparent 75%)'
          }}
        />

        {/* Electric Purple Energy Swirl (Center Right) */}
        <div
          className="absolute top-[20%] right-[10%] w-[50vw] h-[45vw] rounded-full filter blur-[150px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(88, 28, 135, 0.2) 60%, transparent 80%)'
          }}
        />

        {/* Deep Stellar Indigo Foundation (Bottom Left) */}
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[65vw] h-[60vw] rounded-full filter blur-[160px] opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(49, 46, 129, 0.5) 0%, rgba(30, 27, 75, 0.3) 55%, transparent 75%)'
          }}
        />

        {/* Iconic Starburst Spark Beacon (Top 2 o'clock position from logo) */}
        <div
          className="absolute top-[15%] right-[25%] w-[18vw] h-[18vw] rounded-full filter blur-[80px] opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(245, 243, 255, 0.6) 0%, rgba(192, 132, 252, 0.3) 40%, transparent 70%)'
          }}
        />

        {/* Sub-Perceptual Star Dust Texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 243, 255, 0.9) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>
    </div>
  );
};

export default BackgroundEnergyMesh;
