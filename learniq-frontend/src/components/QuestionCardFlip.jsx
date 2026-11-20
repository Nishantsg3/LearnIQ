import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

/**
 * QuestionCardFlip — Premium 3D Interactive Two-Sided Examination & Review Card.
 *
 * Front side: Question text, choices, selection states, question navigation.
 * Back side: In-depth pedagogical solution, verified answer key, discrepancy breakdown.
 *
 * Accessible: Respects prefers-reduced-motion with instant clean transition.
 */
const QuestionCardFlip = ({
  frontContent,
  backContent,
  isFlipped = false,
  onFlip,
  canFlip = true,
  flipButtonLabel = "Show Solution",
  backButtonLabel = "Back to Question",
  className = ""
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const listener = (e) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const flipped = onFlip ? isFlipped : internalFlipped;
  const handleToggle = () => {
    if (!canFlip) return;
    if (onFlip) {
      onFlip(!isFlipped);
    } else {
      setInternalFlipped(prev => !prev);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Reduced-Motion Mode: Simple Instant Tab Transition */}
      {reducedMotion ? (
        <div className="w-full">
          {!flipped ? (
            <div className="w-full">
              {frontContent}
              {canFlip && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-300/80 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-sm text-violet-700 dark:text-violet-300 font-semibold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
                  >
                    <Sparkles size={14} className="text-violet-500 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                    <span>{flipButtonLabel}</span>
                    <RotateCw size={12} className="opacity-70 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full">
              <div className="bg-white dark:bg-[#13171f] rounded-2xl border-2 border-slate-300 dark:border-white/20 p-6 sm:p-8 shadow-sm flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                      Solution & Rationale
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Pedagogical Answer Verification
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 space-y-4">
                  {backContent}
                </div>
              </div>
              {canFlip && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-300/80 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-sm text-violet-700 dark:text-violet-300 font-semibold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
                  >
                    <ArrowLeft size={14} className="text-violet-500 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
                    <span>{backButtonLabel}</span>
                    <RotateCw size={12} className="opacity-70 group-hover:-rotate-180 transition-transform duration-500" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Standard 3D Perspective Card Flip Container */
        <div className="perspective-1000 w-full min-h-0">
          <div
            className={`w-full transition-transform duration-500 transform-style-3d relative ${
              flipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT FACE */}
            <div className={`w-full backface-hidden ${flipped ? 'pointer-events-none' : ''}`}>
              {frontContent}
              {canFlip && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-300/80 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-sm text-violet-700 dark:text-violet-300 font-semibold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
                  >
                    <Sparkles size={14} className="text-violet-500 group-hover:rotate-12 transition-transform" aria-hidden="true" />
                    <span>{flipButtonLabel}</span>
                    <RotateCw size={12} className="opacity-70 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* BACK FACE (SOLUTIONS / EXPLANATION) */}
            <div
              className={`absolute inset-0 w-full h-full rotate-y-180 backface-hidden flex flex-col ${
                !flipped ? 'pointer-events-none' : ''
              }`}
            >
              <div className="flex-1 min-h-0 bg-white dark:bg-[#13171f] rounded-2xl border-2 border-slate-300 dark:border-white/20 p-6 sm:p-8 shadow-sm flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                      Solution & Rationale
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Pedagogical Answer Verification
                    </p>
                  </div>
                </div>

                <div className="flex-1 min-h-0 space-y-4">
                  {backContent}
                </div>
              </div>

              {canFlip && (
                <div className="mt-4 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-300/80 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-sm text-violet-700 dark:text-violet-300 font-semibold text-xs sm:text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 group"
                  >
                    <ArrowLeft size={14} className="text-violet-500 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
                    <span>{backButtonLabel}</span>
                    <RotateCw size={12} className="opacity-70 group-hover:-rotate-180 transition-transform duration-500" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCardFlip;
