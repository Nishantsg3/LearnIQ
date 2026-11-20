import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LearnIQ Standard Button Component
 * Features subtle skeuomorphic depth, tactile active states, accessible focus rings,
 * and WCAG AA contrast compliance across both Light and Dark themes.
 */
export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:pointer-events-none cursor-pointer select-none';

  const sizeStyles = {
    sm: 'min-h-[36px] sm:min-h-[38px] px-3.5 py-1.5 text-[11px]',
    md: 'min-h-[44px] px-5 py-2.5 text-xs',
    lg: 'min-h-[48px] px-6 py-3 text-sm tracking-wide'
  }[size] || 'min-h-[44px] px-5 py-2.5 text-xs';

  const variantStyles = {
    primary: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white border border-violet-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_0_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(124,58,237,0.25)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_2px_4px_0_rgba(0,0,0,0.12),0_6px_16px_-2px_rgba(124,58,237,0.35)]',
    secondary: 'bg-white dark:bg-[#1a1d24] border border-slate-300 dark:border-[#2b303c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#222630] hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-[#3d4454] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),0_1px_2px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.2)]',
    destructive: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_0_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(225,29,72,0.25)]',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_0_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(225,29,72,0.25)]',
    'subtle-destructive': 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-800 dark:hover:text-rose-300 shadow-2xs',
    outline: 'bg-transparent border border-slate-300 dark:border-[#2b303c] text-slate-700 dark:text-slate-200 hover:bg-violet-50/50 dark:hover:bg-[#1a1d24] hover:text-violet-900 dark:hover:text-white',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50/50 dark:hover:bg-[#1a1d24]',
    accent: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm'
  }[variant] || 'bg-violet-600 hover:bg-violet-700 text-white';

  const iconSize = {
    sm: 13,
    md: 15,
    lg: 17
  }[size] || 15;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={iconSize} className="animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={iconSize} className="shrink-0" aria-hidden="true" />
      ) : null}

      {children && <span>{children}</span>}

      {!isLoading && IconRight && (
        <IconRight size={iconSize} className="shrink-0" aria-hidden="true" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
