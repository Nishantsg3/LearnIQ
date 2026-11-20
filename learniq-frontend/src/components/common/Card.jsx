import React from 'react';

/**
 * LearnIQ Card & Surface Panel Component
 * Supports default, premium, glass, and interactive variants with standardized border radii and shadows.
 */
export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  chromeRim = false,
  className = '',
  onClick,
  ...props
}) => {
  const isClickable = Boolean(onClick);

  const paddingStyles = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  }[padding] || 'p-5 sm:p-6';

  const variantStyles = {
    default: 'bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl shadow-2xs',
    premium: 'apple-card rounded-2xl',
    glass: 'card-glass rounded-2xl',
    subtle: 'bg-slate-50 dark:bg-[#13161c] border border-slate-200/70 dark:border-[#222630] rounded-2xl shadow-2xs'
  }[variant] || 'bg-white dark:bg-[#15181e] border border-slate-200/90 dark:border-[#262a33] rounded-2xl shadow-2xs';

  const interactiveStyles = isClickable
    ? 'cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-transform duration-100'
    : '';

  const chromeRimClass = chromeRim ? 'chrome-rim' : '';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      className={`${variantStyles} ${paddingStyles} ${interactiveStyles} ${chromeRimClass} text-slate-900 dark:text-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80 dark:border-[#262a33] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', as = 'h3', ...props }) => {
  const Tag = as || 'h3';
  return (
    <Tag className={`text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`min-w-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200/80 dark:border-[#262a33] ${className}`} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
