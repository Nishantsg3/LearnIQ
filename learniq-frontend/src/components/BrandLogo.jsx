import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BRANDING } from '../config/branding';

/**
 * Authentic LearnIQ Brand Component.
 * Dynamically theme-calibrated to the 3 Institutional Domains:
 * 1. Admin Domain (/admin*, /admin-access): Royal Violet & Electric Indigo
 * 2. Student Domain (/student*, /login): Royal Amethyst & Deep Indigo / Azure
 * 3. Onboarding Domain (/register, /forgot-password, /verify-otp, /reset-password): Aurora Jade & Aquamarine Emerald
 */
export const BrandLogo = ({
  size = 'md',
  variant = 'wordmark',
  subtitle = '',
  className = '',
  linkTo = '',
  theme = 'auto',
  inverted = false,
  domain, // optional override: 'admin' | 'student' | 'onboarding'
  onClick
}) => {
  const location = useLocation();
  const currentPath = location?.pathname || '';

  // Resolve active institutional theme domain
  const activeDomain = domain || (
    currentPath.startsWith('/admin') || currentPath === '/admin-access'
      ? 'admin'
      : currentPath === '/register' || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/verify-otp') || currentPath.startsWith('/reset-password')
      ? 'onboarding'
      : 'student'
  );

  const handleLogoClick = (e) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const scrollContainers = [
      document.querySelector('.dashboard-content'),
      document.querySelector('main'),
      document.querySelector('.h-full.overflow-y-auto'),
      document.documentElement,
      document.body
    ];
    scrollContainers.forEach(container => {
      if (container && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.querySelectorAll('[class*="overflow-y-auto"]').forEach(el => {
      try {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Safe ignore
      }
    });

    if (onClick) onClick(e);
  };

  // Dimension tokens
  const metrics = {
    sm: { markSize: 'w-6 h-6', boxSize: 'w-8 h-8 rounded-lg', text: 'text-[15px]', sub: 'text-[9px]' },
    md: { markSize: 'w-7 h-7', boxSize: 'w-9 h-9 rounded-xl', text: 'text-base font-extrabold', sub: 'text-[10px]' },
    lg: { markSize: 'w-9 h-9', boxSize: 'w-11 h-11 rounded-xl', text: 'text-xl font-extrabold', sub: 'text-xs' },
    xl: { markSize: 'w-12 h-12', boxSize: 'w-14 h-14 rounded-2xl', text: 'text-2xl font-black', sub: 'text-xs' }
  }[size] || { markSize: 'w-7 h-7', boxSize: 'w-9 h-9 rounded-xl', text: 'text-base font-extrabold', sub: 'text-[10px]' };

  // Resolve theme contrast modes
  const isDarkContainer = inverted || theme === 'dark';
  const isLightContainer = theme === 'light';

  const learnTextColor = isDarkContainer
    ? 'text-white'
    : isLightContainer
    ? 'text-slate-900'
    : 'text-slate-900 dark:text-white';

  // Domain-Aware Palette Styles
  const paletteTokens = {
    admin: {
      iqGradient: 'bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-600 dark:from-violet-400 dark:via-violet-300 dark:to-indigo-400',
      subtitle: isDarkContainer ? 'text-violet-300' : isLightContainer ? 'text-violet-700' : 'text-violet-700 dark:text-violet-300',
      jewelBorder: 'border-violet-500/30 dark:border-violet-400/20 group-hover:border-violet-500/60 dark:group-hover:border-violet-400/50 shadow-violet-500/10',
      jewelGlow: 'group-hover:shadow-[0_0_12px_rgba(124,58,237,0.35)]'
    },
    student: {
      iqGradient: 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 dark:from-indigo-400 dark:via-sky-300 dark:to-indigo-300',
      subtitle: isDarkContainer ? 'text-indigo-300' : isLightContainer ? 'text-indigo-700' : 'text-indigo-700 dark:text-indigo-300',
      jewelBorder: 'border-indigo-500/30 dark:border-indigo-400/20 group-hover:border-indigo-500/60 dark:group-hover:border-indigo-400/50 shadow-indigo-500/10',
      jewelGlow: 'group-hover:shadow-[0_0_12px_rgba(99,102,241,0.35)]'
    },
    onboarding: {
      iqGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300',
      subtitle: isDarkContainer ? 'text-emerald-300' : isLightContainer ? 'text-emerald-700' : 'text-emerald-700 dark:text-emerald-300',
      jewelBorder: 'border-emerald-500/30 dark:border-emerald-400/20 group-hover:border-emerald-500/60 dark:group-hover:border-emerald-400/50 shadow-emerald-500/10',
      jewelGlow: 'group-hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]'
    }
  }[activeDomain];

  const subtitleColor = paletteTokens.subtitle;

  const taglineColor = isDarkContainer
    ? 'text-slate-300'
    : isLightContainer
    ? 'text-slate-600'
    : 'text-slate-600 dark:text-slate-300';

  // Authentic Energy Q mark badge
  const markElement = (
    <div
      className={`${metrics.boxSize} bg-slate-100/90 dark:bg-[#090b10] border ${paletteTokens.jewelBorder} ${paletteTokens.jewelGlow} flex items-center justify-center shrink-0 shadow-xs overflow-hidden transition-all duration-300`}
    >
      <img
        src={BRANDING.logos.icon}
        alt={variant === 'mark' && !linkTo ? 'LearnIQ' : ''}
        role={variant === 'mark' && !linkTo ? undefined : 'presentation'}
        className={`${metrics.markSize} object-contain transition-transform duration-200 group-hover:scale-105`}
        loading="eager"
      />
    </div>
  );

  if (variant === 'mark') {
    if (linkTo) {
      return (
        <Link
          to={linkTo}
          onClick={handleLogoClick}
          className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center shrink-0 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${className}`}
          aria-label="LearnIQ Home"
        >
          {markElement}
        </Link>
      );
    }
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {markElement}
      </div>
    );
  }

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {markElement}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline leading-none font-bold tracking-tight">
          <span className={`${learnTextColor} ${metrics.text}`}>
            LEARN
          </span>
          <span className={`${paletteTokens.iqGradient} bg-clip-text text-transparent ml-1 ${metrics.text}`}>
            IQ
          </span>
        </div>
        {subtitle ? (
          <span className={`font-semibold uppercase tracking-wider ${subtitleColor} mt-1 truncate ${metrics.sub}`}>
            {subtitle}
          </span>
        ) : variant === 'full' ? (
          <span className={`font-medium tracking-widest ${taglineColor} mt-1 truncate ${metrics.sub}`}>
            ASSESS • ANALYZE • ADVANCE
          </span>
        ) : null}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        onClick={handleLogoClick}
        className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        aria-label="LearnIQ Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
