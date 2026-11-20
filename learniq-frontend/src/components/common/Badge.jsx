import React from 'react';

/**
 * LearnIQ Status Badge Component
 * Standardized status indicators with WCAG AA compliance across light and dark themes.
 * Supported variants: Active, Draft, Scheduled, Completed, Success, Warning, Danger, Neutral.
 */
export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs'
  }[size] || 'px-2.5 py-0.5 text-[11px]';

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2'
  }[size] || 'w-1.5 h-1.5';

  const iconSizes = {
    sm: 11,
    md: 13
  }[size] || 11;

  const variantStyles = {
    active: {
      badge: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60',
      dot: 'bg-violet-500'
    },
    draft: {
      badge: 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400'
    },
    scheduled: {
      badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
      dot: 'bg-sky-500'
    },
    completed: {
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
      dot: 'bg-emerald-500'
    },
    success: {
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
      dot: 'bg-emerald-500'
    },
    warning: {
      badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      dot: 'bg-amber-500'
    },
    danger: {
      badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
      dot: 'bg-rose-500'
    },
    neutral: {
      badge: 'bg-slate-50 dark:bg-[#1a1d24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#262a33]',
      dot: 'bg-slate-400'
    }
  }[variant] || {
    badge: 'bg-slate-50 dark:bg-[#1a1d24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#262a33]',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border tracking-tight select-none ${sizeStyles} ${variantStyles.badge} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes} ${variantStyles.dot}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon size={iconSizes} className="shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
