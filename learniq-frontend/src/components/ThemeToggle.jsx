import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggle
 *
 * Apple-grade single button with rotating sun/moon physics animation.
 * Features:
 * - Fluid 180° rotation and spring morph between Sun and Moon.
 * - Visible warm amber sun disc and luminous indigo moon crescent.
 * - Sized at min-h-[44px] to match topbar clock and profile capsules.
 * - Tactile active scale press feedback.
 * - Full accessible aria labeling.
 */
export const ThemeToggle = ({
  className = '',
  size = 'lg',
  showLabels = true
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    xs: 'h-[36px] min-h-[36px] max-h-[36px] px-3 py-1 text-xs',
    sm: 'h-[38px] min-h-[38px] max-h-[38px] px-3 py-1 text-xs',
    md: 'h-[42px] min-h-[42px] max-h-[42px] px-3.5 py-1.5 text-xs',
    lg: 'h-[44px] min-h-[44px] max-h-[44px] px-4 py-2 text-xs'
  }[size] || 'h-[44px] min-h-[44px] max-h-[44px] px-4 py-2 text-xs';

  const iconSizes = {
    xs: 15,
    sm: 16,
    md: 18,
    lg: 18
  }[size] || 18;

  return (
    <button
      type="button"
      role="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme (Currently Dark)' : 'Switch to dark theme (Currently Light)'}
      className={`group relative inline-flex items-center justify-center gap-2.5 rounded-xl font-mono font-bold select-none cursor-pointer
        border-2 border-slate-300 dark:border-white/20
        bg-white/95 dark:bg-[#141822]/95 backdrop-blur-md
        text-slate-800 dark:text-slate-100
        hover:bg-slate-100/90 dark:hover:bg-[#1c2230]
        hover:border-violet-500/70 dark:hover:border-violet-400/70
        hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/10
        active:scale-[0.96] shadow-xs transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2
        ${sizeClasses} ${className}`}
    >
      {/* Animated Rotating Morphing Icon Capsule */}
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        style={{ width: iconSizes + 6, height: iconSizes + 6 }}
      >
        {/* Sun Icon (Light Mode: Warm glowing amber with ray pulse) */}
        <Sun
          size={iconSizes}
          aria-hidden="true"
          className={`absolute text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDark
              ? 'rotate-180 scale-0 opacity-0 pointer-events-none'
              : 'rotate-0 scale-100 opacity-100 group-hover:rotate-90'
          }`}
        />

        {/* Moon Icon (Dark Mode: Radiant violet-indigo crescent) */}
        <Moon
          size={iconSizes}
          aria-hidden="true"
          className={`absolute text-indigo-400 dark:text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.7)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 group-hover:-rotate-45'
              : '-rotate-180 scale-0 opacity-0 pointer-events-none'
          }`}
        />
      </div>

      {showLabels && (
        <span className="capitalize tracking-tight font-semibold text-xs sm:text-sm hidden xs:inline">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
