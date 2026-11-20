import React from 'react';
import { Server, Activity, ArrowLeft, Sparkles } from 'lucide-react';

/**
 * AuthServerWakingState
 *
 * Replaces red error banners during Render.com cold starts with a realistic,
 * reassuring system recovery experience.
 *
 * Strict realism:
 * - Elapsed seconds strictly capped at 25s (no 200+ second infinite counters).
 * - Realistic JVM container boot stages:
 *   "Spinning up container..." -> "Booting Java Spring runtime..." -> "Warming database connection pool..."
 * - Color-matched to BackgroundAbstractFluid Direction 8 palette.
 * - Compact vertical footprint to guarantee 100vh fit on mobile and desktop.
 */
const AuthServerWakingState = ({
  variant = 'student',
  elapsed = 0,
  onCancel,
  onSimulateAwake
}) => {
  const isAdmin = variant === 'admin';

  // Cap the displayed counter at 25s so it never looks like an infinite fake loop
  const displaySeconds = Math.min(elapsed, 25);
  const stagePercent = Math.min(15 + displaySeconds * 3.3, 96);

  // Realistic cloud server lifecycle phases
  let stageLabel = "Spinning up container...";
  if (displaySeconds >= 17) {
    stageLabel = "Warming database connection pool...";
  } else if (displaySeconds >= 8) {
    stageLabel = "Booting Java Spring runtime...";
  }

  return (
    <div
      className="w-full py-1 text-center animate-in fade-in zoom-in-95 duration-200"
      role="status"
      aria-live="polite"
    >
      {/* ── AMBIENT PULSING RADAR BEACON (COMPACT) ─────────────────────────── */}
      <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
        {/* Outer concentric pulsing ring */}
        <div
          className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
            isAdmin ? 'bg-[#14B8A6]' : 'bg-[#E5A638] dark:bg-[#6366F1]'
          }`}
          style={{ animationDuration: '2.5s' }}
        />
        {/* Soft aura glow */}
        <div
          className={`absolute -inset-1 rounded-full blur-lg opacity-30 ${
            isAdmin ? 'bg-[#14B8A6]' : 'bg-[#E5A638] dark:bg-[#6366F1]'
          }`}
        />

        {/* Core frosted jewel container */}
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-md border ${
          isAdmin
            ? 'bg-[#0F766E]/15 border-[#14B8A6]/40 text-[#0F766E] dark:text-[#2DD4BF]'
            : 'bg-[#E5A638]/15 dark:bg-[#6366F1]/20 border-[#E5A638]/40 dark:border-[#6366F1]/40 text-[#C35A38] dark:text-[#818CF8]'
        }`}>
          <Server size={22} className="animate-pulse" />

          {/* Status beacon dot */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A638] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D97706] border-2 border-white dark:border-[#0c0f18]" />
          </span>
        </div>
      </div>

      {/* ── STATUS BADGE ──────────────────────────────────────────────────── */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-2 border shadow-2xs ${
        isAdmin
          ? 'bg-[#EBF7F6] dark:bg-[#072421] border-[#B2E6E2] dark:border-[#134E48] text-[#0F766E] dark:text-[#2DD4BF]'
          : 'bg-[#FEF7EC] dark:bg-[#1E1B4B] border-[#FBDCA3] dark:border-[#3730A3] text-[#B45309] dark:text-[#A5B4FC]'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAdmin ? 'bg-[#14B8A6]' : 'bg-[#E5A638] dark:bg-[#818CF8]'}`} />
        <span>STANDBY INSTANCE • WAKING CORE</span>
      </div>

      {/* ── HEADLINE & EXPLANATION ────────────────────────────────────────── */}
      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1E293B] dark:text-[#F8FAFC] tracking-tight leading-snug mb-1">
        Establishing Secure Examination Link
      </h2>
      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] max-w-xs mx-auto font-sans leading-relaxed mb-3">
        Our dedicated server instances sleep when idle to conserve cloud compute.
        Auto-connecting as soon as the node is ready (~25s).
      </p>

      {/* ── METRIC & PROGRESS TILE (COMPACT 100VH FOOTPRINT) ──────────────── */}
      <div className="p-3 rounded-xl bg-[#FAF7F2]/90 dark:bg-[#0c0f18]/90 border border-[#E8DEC8]/80 dark:border-white/10 mb-3 text-left shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
            <Activity size={12} className={isAdmin ? "text-[#14B8A6] animate-spin" : "text-[#E5A638] dark:text-[#818CF8] animate-spin"} style={{ animationDuration: '4s' }} />
            <span>Node Telemetry</span>
          </span>
          <span className="font-bold text-[#1E293B] dark:text-[#F1F5F9]">
            {displaySeconds}s <span className="text-[#94A3B8] font-normal">/ 25s</span>
          </span>
        </div>

        {/* Shimmer progress bar */}
        <div className="w-full h-1.5 rounded-full bg-[#EAE4DC] dark:bg-white/10 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative ${
              isAdmin
                ? 'bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#2DD4BF]'
                : 'bg-gradient-to-r from-[#C35A38] via-[#E5A638] to-[#6366F1]'
            }`}
            style={{ width: `${stagePercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1.5 font-sans">
          <span className="truncate pr-2 font-medium">{stageLabel}</span>
          <span className="shrink-0 font-mono text-[9px] text-[#8DA399] dark:text-[#64748B]">HTTP/2</span>
        </div>
      </div>

      {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[#EAE4DC] dark:border-white/10 bg-white dark:bg-[#121620] hover:bg-[#FAF7F2] dark:hover:bg-[#1a2030] text-[#475569] dark:text-[#CBD5E1] text-[11px] font-semibold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E5A638]"
          >
            <ArrowLeft size={11} />
            <span>Return to Form</span>
          </button>
        )}

        {/* Immediate Simulation Bypass */}
        {onSimulateAwake && (
          <button
            type="button"
            onClick={onSimulateAwake}
            className={`inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer outline-none ${
              isAdmin
                ? 'bg-[#0F766E] hover:bg-[#115E59] text-white focus-visible:ring-2 focus-visible:ring-[#14B8A6]'
                : 'bg-[#C35A38] hover:bg-[#A94827] text-white focus-visible:ring-2 focus-visible:ring-[#E5A638]'
            }`}
            title="Bypass wait and authenticate immediately"
          >
            <Sparkles size={11} />
            <span>Simulate Server Awake</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthServerWakingState;
