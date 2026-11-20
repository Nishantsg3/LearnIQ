import React, { useState } from 'react';
import BackgroundAbstractFluid from '../components/backgrounds/BackgroundAbstractFluid';
import BackgroundOrganicBotanical from '../components/backgrounds/BackgroundOrganicBotanical';
import BackgroundAcademicTopography from '../components/backgrounds/BackgroundAcademicTopography';
import BackgroundSpatialGlassVariants from '../components/backgrounds/BackgroundSpatialGlassVariants';
import BackgroundSpatialGlass from '../components/backgrounds/BackgroundSpatialGlass';
import BackgroundEditorialArt from '../components/backgrounds/BackgroundEditorialArt';
import BackgroundAmbientAurora from '../components/backgrounds/BackgroundAmbientAurora';
import BackgroundArchitecturalGrain from '../components/backgrounds/BackgroundArchitecturalGrain';
import BackgroundEnergyMesh from '../components/backgrounds/BackgroundEnergyMesh';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import { Sparkles, ArrowRight, Check, Trophy } from 'lucide-react';

const BackgroundShowcase = () => {
  const [selectedDirection, setSelectedDirection] = useState('dir8_abstract_fluid'); // 'dir8_abstract_fluid' | 'dir7_botanical' | 'dir6_topography' | '5c_sweetspot' | '5a_minimal' | '5b_dramatic' | '5_original' | 'editorial' | 'aurora' | 'architectural' | 'energy'

  return (
    <div className="relative min-h-screen font-sans transition-colors duration-300">

      {/* ── BACKGROUND LAYER UNDERNEATH ─────────────────────────────────── */}
      {selectedDirection === 'dir8_abstract_fluid' && <BackgroundAbstractFluid />}
      {selectedDirection === 'dir7_botanical' && <BackgroundOrganicBotanical />}
      {selectedDirection === 'dir6_topography' && <BackgroundAcademicTopography />}
      {selectedDirection === '5c_sweetspot' && <BackgroundSpatialGlassVariants variant="balanced" />}
      {selectedDirection === '5a_minimal' && <BackgroundSpatialGlassVariants variant="minimal" />}
      {selectedDirection === '5b_dramatic' && <BackgroundSpatialGlassVariants variant="dramatic" />}
      {selectedDirection === '5_original' && <BackgroundSpatialGlass />}
      {selectedDirection === 'editorial' && <BackgroundEditorialArt />}
      {selectedDirection === 'aurora' && <BackgroundAmbientAurora />}
      {selectedDirection === 'architectural' && <BackgroundArchitecturalGrain />}
      {selectedDirection === 'energy' && <BackgroundEnergyMesh />}

      {/* ── FOREGROUND CONTENT (HIGH-CONTRAST ISOLATION) ─────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top Control Bar */}
        <header className="px-6 py-4 border-b border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 sticky top-0 transition-colors">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" variant="wordmark" subtitle="Design Lab" />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-white/10">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Direction 8 Abstract Organic Geometry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direction Selector Tabs */}
            <div className="flex bg-slate-200/60 dark:bg-white/[0.08] p-1 rounded-xl border border-slate-300/60 dark:border-white/10 text-xs font-semibold backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelectedDirection('dir8_abstract_fluid')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDirection === 'dir8_abstract_fluid'
                    ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ★ 8. Abstract Organic Geometry
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirection('dir7_botanical')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDirection === 'dir7_botanical'
                    ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                7. Botanical
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirection('dir6_topography')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDirection === 'dir6_topography'
                    ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                6. Silk Aurora
              </button>
              <button
                type="button"
                onClick={() => setSelectedDirection('5c_sweetspot')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedDirection === '5c_sweetspot'
                    ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                5C: Glass
              </button>
            </div>

            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* Center Stage: Hero & Component Evaluation Cards */}
        <main className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-center space-y-10">

          {/* Hero Heading Area */}
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 border border-slate-900/10 dark:border-white/15 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 backdrop-blur-md">
              <Sparkles size={13} className="text-violet-600 dark:text-violet-400" />
              <span>
                {selectedDirection === 'dir8_abstract_fluid' && 'DIRECTION 8 • ABSTRACT ORGANIC GEOMETRY (FLUID STRATA & MICRO-ACCENTS)'}
                {selectedDirection === 'dir7_botanical' && 'DIRECTION 7 • ORGANIC BOTANICAL ILLUSTRATION (EARTHY EDITORIAL ART)'}
                {selectedDirection === 'dir6_topography' && 'DIRECTION 6 • ACADEMIC AURORA & TOPOGRAPHIC FLOW (GENERATIVE CARTOGRAPHY)'}
                {selectedDirection === '5c_sweetspot' && 'DIRECTION 5C • THE SWEET SPOT (BALANCED ACADEMIC POISE)'}
                {selectedDirection === '5a_minimal' && 'DIRECTION 5A • MINIMAL ARCHITECTURAL (FEWER SLABS, SOFTER TONES)'}
                {selectedDirection === '5b_dramatic' && 'DIRECTION 5B • DRAMATIC MONUMENTAL (LARGER SLABS, DEEP SHADOWS)'}
                {selectedDirection === '5_original' && 'DIRECTION 5-ORIG • SPATIAL GLASS (ORIGINAL CHROMATIC)'}
                {selectedDirection === 'editorial' && 'DIRECTION 4 • EDITORIAL ART & SPATIAL GEOMETRY (APPLE VISION PRO / MODERN MUSEUM)'}
                {selectedDirection === 'aurora' && 'DIRECTION 1 • AMBIENT GLASS & DEEP AURORA (LINEAR / APPLE INSPIRED)'}
                {selectedDirection === 'architectural' && 'DIRECTION 2 • ARCHITECTURAL GRAIN & MONOLITH (EDITORIAL / MINIMALIST)'}
                {selectedDirection === 'energy' && 'DIRECTION 3 • THE "LEARNIQ ENERGY" GRADIENT MESH (BRAND-DERIVED)'}
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              {selectedDirection === 'dir8_abstract_fluid' && 'Abstract Organic Geometry & Fluid Strata'}
              {selectedDirection === 'dir7_botanical' && 'Organic Botanical & Illustrated Earth Art'}
              {selectedDirection === 'dir6_topography' && 'Sweeping Silk Aurora & Harmonic Dunes'}
              {selectedDirection === '5c_sweetspot' && 'Harmonic Architectural Glass & Muted Violet'}
              {selectedDirection === '5a_minimal' && 'Serene Architectural Glass & Alabaster Stone'}
              {selectedDirection === '5b_dramatic' && 'Monumental Terraced Glass & Deep Shadows'}
              {selectedDirection === '5_original' && 'Spatial Prismatic Glass & Architectural Room'}
              {selectedDirection === 'editorial' && 'Sculptural Geometry & Spatial Glass'}
              {selectedDirection === 'aurora' && 'Atmospheric Glass & Aurora Depth'}
              {selectedDirection === 'architectural' && 'Tactile Monolith & Architectural Shadow'}
              {selectedDirection === 'energy' && 'Dynamic Cosmic Brand Energy'}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-xl mx-auto">
              {selectedDirection === 'dir8_abstract_fluid' && 'Overlapping semi-transparent fluid blobs in terracotta, muted violet, and amber, enriched with minimalist micro-doodles: dot matrices, sine waves, and subtle geometric crosses.'}
              {selectedDirection === 'dir7_botanical' && 'Overlapping semi-transparent sage and ochre fluid forms, detailed monstera and fern fronds, delicate botanical branches, radiating sunburst, and stippled dot textures.'}
              {selectedDirection === 'dir6_topography' && 'Grand, silky fluid gradient waves weaving through space with multi-stop gradients of deep indigo, cyan, teal, and champagne gold. Zero technical clutter.'}
              {selectedDirection === '5c_sweetspot' && 'The Sweet Spot: Harmonic dual-slab elevation, warm alabaster stone and muted violet tones, soft rounded corners, and balanced physical depth.'}
              {selectedDirection === '5a_minimal' && 'Subtle and minimal: Single architectural rounded glass tablet in each corner, whisper-quiet shadows, and warm ambient stone tones.'}
              {selectedDirection === '5b_dramatic' && 'Monumental presence: Grand terraced glass monoliths, deep atmospheric drop shadows, and rich warm ambient depth.'}
              {selectedDirection === '5_original' && 'Multi-plane interlocking glass slabs, saturated chromatic foundation, and specular light hairlines.'}
              {selectedDirection === 'editorial' && 'Harmonic vector contour strata, floating optical glass lenses, and architectural coordinate watermarks.'}
              {selectedDirection === 'aurora' && 'Designed with ultra-soft refraction in light mode and glowing obsidian aurora in dark mode.'}
              {selectedDirection === 'architectural' && 'Inspired by modern museum architecture and tactile fine-art paper grain with a sweeping monolithic curve.'}
              {selectedDirection === 'energy' && 'Derived directly from the official LearnIQ Energy Q color spectrum.'}
            </p>
          </div>

          {/* Realistic Product Mockup Cards Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1: Candidate Hero / Auth Sample */}
            <div className="bg-white/80 dark:bg-[#12151d]/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-lg space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Candidate Portal
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </div>
              <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
                Next Assessment Session
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Experience high-velocity proctored assessments with synchronized timer integrity and responsive feedback.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Enter Examination Hall</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Interactive Game-Style HUD Stat Card */}
            <div className="bg-white/80 dark:bg-[#12151d]/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-lg flex flex-col justify-between space-y-4 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Performance HUD
                </span>
                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-200/80 dark:border-violet-800/40">
                  <Trophy size={16} />
                </div>
              </div>
              <div>
                <span className="text-4xl font-serif font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  92.4%
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                  Mastery Percentile • Batch Rank #1
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full" style={{ width: '92.4%' }} />
              </div>
            </div>

            {/* Card 3: Form Input / Contrast Test Card */}
            <div className="bg-white/80 dark:bg-[#12151d]/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-lg space-y-4 transition-all">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Contrast Verification Form
              </span>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    readOnly
                    value="candidate@learniq.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discipline Track
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                    <span>Applied Algorithms</span>
                    <Check size={14} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
};

export default BackgroundShowcase;
