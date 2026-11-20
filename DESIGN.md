# LearnIQ — Design System & Direction Brief

## 1. Vision & Purpose
LearnIQ is an academic assessment and examination platform. Its design language pairs the precision, restraint, and fluid tactile feedback of high-craft software with an authoritative academic visual identity. It avoids generic AI templates, purposeless gradient backgrounds, nested card traps, and robotic uppercase labels.

---

## 2. Palette & Semantic System
- **Brand Primary**: Violet / Deep Purple
  - Primary Action / Accent: `#7c3aed` (`violet-600`)
  - Primary Hover: `#6d28d9` (`violet-700`)
  - Subtle Tint / Fill: `rgba(124, 58, 237, 0.08)` (`violet-50` / `violet-950/40`)
  - Focus Ring: `rgba(124, 58, 237, 0.2)`
- **Canvas & Surfaces**:
  - **Light Theme**:
    - Canvas: `#f8fafc` (Slate 50)
    - Card / Surface: `#ffffff` (Pure white)
    - Border / Divider: `#e2e8f0` (Slate 200)
    - Primary Text: `#0f172a` (Slate 900)
    - Secondary Text: `#475569` (Slate 600)
    - Muted / Caption: `#64748b` (Slate 500)
  - **Dark Theme**:
    - Canvas: `#0e1015` (Deep neutral charcoal)
    - Elevated Surface: `#15181e` (Dark slate-charcoal)
    - Inset / Header Surface: `#111317`
    - Border / Divider: `#262a33`
    - Primary Text: `#f1f5f9` (Slate 100)
    - Secondary Text: `#cbd5e1` (Slate 300)
    - Muted / Caption: `#94a3b8` (Slate 400)
- **Semantic Feedback**:
  - **Success / Correct Key**: Emerald (`#10b981`, `#059669`, `#064e3b/30`)
  - **Error / Mistake / Destructive**: Rose (`#f43f5e`, `#e11d48`, `#881337/30`)
  - **Warning / Untimed / Notice**: Amber (`#f59e0b`, `#d97706`, `#78350f/30`)
  - Strict Rule: Blue is not used as a dominant brand color or competing accent.

- **Unmistakable Leaderboard Medal Hierarchy**:
  - **Rank 1 • Gold**:
    - Light: Background `bg-amber-500/10`, border `border-amber-400/60`, ring `ring-amber-400/30`, badge `bg-amber-100 text-amber-950 border-amber-300`, icon `text-amber-500`, top accent `from-amber-300 via-amber-400 to-yellow-500`.
    - Dark: Background `dark:bg-[#15181e]`, border `dark:border-amber-500/50`, ring `dark:ring-amber-400/25`, badge `dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700/60`, icon `dark:text-amber-400`.
  - **Rank 2 • Silver (Neutral Platinum Metallic — NOT Gold)**:
    - Light: Background `bg-slate-50`, border `border-slate-300`, ring `ring-slate-300/40`, badge `bg-slate-200 text-slate-800 border-slate-300`, icon `text-slate-500`, top accent `from-slate-200 via-slate-400 to-zinc-300`.
    - Dark: Background `dark:bg-[#15181e]`, border `dark:border-slate-600/70`, ring `dark:ring-slate-700/40`, badge `dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600`, icon `dark:text-slate-300`.
  - **Rank 3 • Bronze (Deep Burnished Copper/Brown — Distinctly Darker & Redder than Gold)**:
    - Light: Background `bg-orange-50/70`, border `border-[#c2410c]/40`, ring `ring-[#c2410c]/25`, badge `bg-[#ffedd5] text-[#7c2d12] border-[#ea580c]/50`, icon `text-[#c2410c]`, top accent `from-[#9a3412] via-[#c2410c] to-[#ea580c]`.
    - Dark: Background `dark:bg-[#15181e]`, border `dark:border-[#9a3412]/60`, ring `dark:ring-[#9a3412]/30`, badge `dark:bg-[#2a170d] dark:text-[#fdba74] dark:border-[#9a3412]/70`, icon `dark:text-[#ea580c]`.

---

## 3. Typography & Spacing Scale
- **Font Stack**: System editorial sans (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif)
- **Numerals**: `tabular-nums` for timers, scores, rankings, question counters.
- **Hierarchy**:
  - Hero / Page Title: `text-2xl` to `text-3xl` (`font-bold`, `tracking-tight`)
  - Section Heading: `text-lg` to `text-xl` (`font-semibold`)
  - Component / Subhead: `text-sm` to `text-base` (`font-medium`)
  - Body Text: `text-sm` (`leading-relaxed`, line length `65–75ch`)
  - Meta / Badges: `text-xs` (`font-medium`, sentence-case)
- **Anti-Pattern Bans**:
  - No screaming uppercase (`EMAIL ADDRESS`, `PASSWORD`, `ACADEMIC COCKPIT`, `SECTION 01`).
  - No decorative kicker/eyebrow labels sitting above primary headings.
  - No gradient text on body headings; emphasis comes from weight, clarity, and contrast.

---

## 4. Radii, Elevation & Shadows
- **Card & Surface Radii**: Harmonized to `rounded-xl` (12px) and `rounded-2xl` (16px). Pills (`rounded-full`) reserved exclusively for compact status tags and toggles.
- **Elevation**: Single declaration per surface. A clean 1px hairline border (`border-slate-200 dark:border-[#262a33]`) with subtle low-intensity ambient depth (`shadow-xs` / `shadow-sm`), eliminating blurry ghost cards and oversized harsh dropshadows.

---

## 5. Motion & Interaction (Apple Design Principles)
- **Tactile Response**: Instant `:active` feedback on interactive controls:
  `active:scale-[0.98] transition-transform duration-100 ease-out`
- **Interruptible Curves**: Smooth settle with `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Restraint**: Zero gratuitous entrance bounces or looping animations; motion only communicates system state, page navigation, or attempt progression.

---

## 6. Authentic Brand Asset (Single Source of Truth)
- Component: `src/components/BrandLogo.jsx`
- Artwork: Genuine LearnIQ "Energy Q" vector SVG with authentic gradient (`#C084FC` -> `#9333EA` -> `#6D28D9`), outer glow filter, inner ring, and spark beacon.
- Support: Adaptive `theme="dark" | "light" | "auto"` to guarantee crisp contrast across any container.

---

## 7. UX Copy & Natural Language
- Clear, purposeful language:
  - "Take test" / "Start practice" instead of "Initialize Assessment Attempt"
  - "Question 1 of 50" instead of "Question 01 • Objective Assessment"
  - "Mistakes (4)" instead of "Incorrect Telemetry"
  - "Welcome back, {name}" instead of "Academic Cockpit • Session 2026"
