import React from 'react';
import BrandLogo from './BrandLogo';
import BackgroundAbstractFluid from './backgrounds/BackgroundAbstractFluid';
import { ShieldCheck, Compass, Lock, Activity, Sparkles } from 'lucide-react';

/**
 * AuthLayout
 *
 * Strict 100vh/100vw containment layout for all authentication screens:
 * - Fits completely on 1440x900 and 375x667 with ZERO window scrolling.
 * - Colors extracted from BackgroundAbstractFluid: warm museum linen (#FBF9F5) in light,
 *   deep twilight obsidian (#101418) in dark.
 * - Ambient architectural watermarks and fine datum lines eliminate empty void without crowding.
 * - Perfectly centered brand masthead and clean minimalist footer.
 */
const AuthLayout = ({
  children,
  variant = "student",
  maxWidth = "max-w-[430px]"
}) => {
  const isAdmin = variant === 'admin';
  const isOnboarding = variant === 'onboarding';

  return (
    <div className="relative w-full max-w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between items-center px-3 py-2 sm:px-6 sm:py-3 font-sans bg-[#FBF9F5] dark:bg-[#101418] text-[#1E293B] dark:text-[#F1F5F9] transition-colors duration-300 selection:bg-[#E5A638]/30 selection:text-[#1E293B] dark:selection:bg-[#6366F1]/30 dark:selection:text-[#F1F5F9]">

      {/* ── GLOBAL ARTISTIC FLUID BACKGROUND (DIRECTION 8 DYNAMIC PALETTE) ──────── */}
      <BackgroundAbstractFluid scope={variant} />

      {/* ── AMBIENT ARCHITECTURAL WATERMARK & SOFT SPOTLIGHT ───────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center z-10" aria-hidden="true">
        {/* Soft Radial Ambient Spotlight with Apple Float Drift */}
        <div className={`w-[720px] h-[720px] rounded-full blur-[150px] opacity-40 transition-all duration-700 animate-apple-float ${
          isAdmin
            ? 'bg-gradient-to-tr from-[#6366F1]/18 via-[#FB7185]/12 to-transparent dark:from-[#818CF8]/25 dark:via-[#FB7185]/15'
            : isOnboarding
            ? 'bg-gradient-to-tr from-[#10B981]/18 via-[#06B6D4]/12 to-transparent dark:from-[#10B981]/25 dark:via-[#06B6D4]/15'
            : 'bg-gradient-to-tr from-[#4F46E5]/18 via-[#6366F1]/12 to-transparent dark:from-[#4F46E5]/25 dark:via-[#6366F1]/15'
        }`} />

        {/* Large Glowing Energy Q Vector Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] opacity-[0.045] dark:opacity-[0.07] transition-opacity duration-500 scale-105 pointer-events-none">
          <svg viewBox="0 0 300 300" fill="none" className="w-full h-full">
            <circle cx="150" cy="150" r="105" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className={
              isAdmin ? 'text-[#6366F1] dark:text-[#818CF8]' : isOnboarding ? 'text-[#F43F5E] dark:text-[#FB7185]' : 'text-[#0F766E] dark:text-[#2DD4BF]'
            } />
            <circle cx="150" cy="150" r="82" stroke="currentColor" strokeWidth="3" strokeDasharray="6 8" className={
              isAdmin ? 'text-[#FB7185] dark:text-[#F43F5E]' : isOnboarding ? 'text-[#F59E0B] dark:text-[#FBBF24]' : 'text-[#14B8A6] dark:text-[#5EEAD4]'
            } />
            <path d="M205 205 L265 265" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className={
              isAdmin ? 'text-[#6366F1] dark:text-[#818CF8]' : isOnboarding ? 'text-[#F43F5E] dark:text-[#FB7185]' : 'text-[#0F766E] dark:text-[#2DD4BF]'
            } />
            <circle cx="218" cy="82" r="5" fill="currentColor" className={isAdmin ? "text-[#38BDF8]" : isOnboarding ? "text-[#F59E0B]" : "text-[#14B8A6]"} />
            <circle cx="82" cy="218" r="4" fill="currentColor" className={isAdmin ? "text-[#FB7185]" : isOnboarding ? "text-[#9333EA]" : "text-[#0F766E]"} />
          </svg>
        </div>
      </div>

      {/* ── FLANKING ARCHITECTURAL DATUM MARGINS (ELIMINATES DESKTOP VOID) ──────── */}
      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10 hidden xl:flex justify-between items-center text-[10px] font-mono text-[#8DA399]/60 dark:text-[#64748B]/50" aria-hidden="true">
        {/* Left Editorial Telemetry Column */}
        <div className="flex flex-col gap-4 max-w-[220px]">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-600' : isOnboarding ? 'bg-emerald-500' : 'bg-indigo-600'}`} />
            <span className="font-semibold tracking-wider uppercase text-[#7E6B8F] dark:text-[#94A3B8]">
              {isAdmin ? "GOV.CORE // ADMIN" : isOnboarding ? "ONBOARD.CORE // RECOVERY" : "CORE.SPEC // LIQ-2026"}
            </span>
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-[#8DA399]/40 to-transparent dark:from-white/10" />
          <p className="text-[9px] leading-relaxed font-sans text-[#7E6B8F]/80 dark:text-[#94A3B8]/70">
            {isAdmin
              ? "Institutional administration & faculty management gateway."
              : isOnboarding
              ? "Candidate identity registration & cryptographic credential recovery."
              : "Standardized adaptive assessment & proctored testing terminal."}
          </p>
          <div className="flex items-center gap-1.5 text-[9px] text-[#8DA399] dark:text-[#64748B]">
            <Compass size={11} />
            <span>40° 42' 46" N • 74° 00' 21" W</span>
          </div>
        </div>

        {/* Right Editorial Telemetry Column */}
        <div className="flex flex-col items-end gap-4 max-w-[220px] text-right">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider uppercase text-[#7E6B8F] dark:text-[#94A3B8]">
              {isOnboarding ? "IDENTITY PROVISIONING" : "TELEMETRY NOMINAL"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="h-px w-24 bg-gradient-to-l from-[#8DA399]/40 to-transparent dark:from-white/10" />
          <p className="text-[9px] leading-relaxed font-sans text-[#7E6B8F]/80 dark:text-[#94A3B8]/70">
            TLS 1.3 cryptographic state isolation • tamper-evident proctoring.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] text-[#8DA399] dark:text-[#64748B]">
            <Lock size={11} />
            <span>CIPHER: AES-GCM-256</span>
          </div>
        </div>
      </div>

      {/* ── CENTERED BRAND MASTHEAD (COMPACT 100VH ANCHOR) ─────────────────────── */}
      <header className={`w-full ${maxWidth} flex flex-col items-center justify-center z-20 shrink-0 mb-1 sm:mb-2 text-center`}>
        <BrandLogo
          size="sm"
          variant="wordmark"
          linkTo={isAdmin ? "/admin-access" : "/login"}
        />

        <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#FAF5EE]/90 dark:bg-[#12161F]/80 border border-[#E8DEC8]/80 dark:border-white/10 backdrop-blur-md shadow-2xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-600' : isOnboarding ? 'bg-emerald-500' : 'bg-indigo-600'} animate-pulse`} />
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#7E6B8F] dark:text-[#94A3B8]">
            {isAdmin ? "Institutional Governance Console" : "Standardized Examination System"}
          </span>
        </div>
      </header>

      {/* ── CENTRAL FLOATING VISION PRO GLASS STAGE ───────────────────────────── */}
      <main className={`w-full ${maxWidth} relative z-20 flex-1 min-h-0 flex flex-col items-center justify-center py-1 overflow-y-auto no-scrollbar`}>
        {children}
      </main>

      {/* ── REFINED COMPACT SYSTEM FOOTER ─────────────────────────────────────── */}
      <footer className={`w-full ${maxWidth} flex items-center justify-between text-[10px] text-[#7E6B8F] dark:text-[#64748B] font-mono pt-1.5 pb-1 border-t border-[#EAE4DC]/80 dark:border-white/5 z-20 shrink-0`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className={isAdmin ? "text-violet-600 dark:text-violet-400" : isOnboarding ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"} />
          <span>LearnIQ Assessment Hall</span>
        </div>
        <span className="text-[#8DA399] dark:text-[#64748B]">v2.4.0 • 2026</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
