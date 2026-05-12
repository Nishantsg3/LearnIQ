import React from 'react';

/**
 * LearnIQ Energy Q Logo Component
 * 
 * Refined Brand Identity:
 * - Premium Intelligent Assessment Platform aesthetic
 * - Clean, sharp geometry with controlled glow
 * - Minimalist typography with wide kerning
 * 
 * Variants: 
 * - 'full': Icon + Wordmark (Stacked/Large)
 * - 'horizontal': Icon + Wordmark (Inline/Navbar)
 * - 'icon': Symbol only (Favicon/App Icon)
 */
const Logo = ({ variant = 'full', className = '', monochrome = false }) => {
  const primaryColor = monochrome ? 'currentColor' : '#7c3aed';
  const secondaryColor = monochrome ? 'currentColor' : '#a78bfa';

  const symbol = (
    <svg
      viewBox="0 0 100 100"
      className={`${variant === 'icon' ? 'w-full h-full' : 'w-10 h-10'} drop-shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all duration-500`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Energy Ring (Sharper edges, elegant geometry) */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />

      {/* Dynamic Swirl Layer (Refined energy ring) */}
      <path
        d="M50 10C72.0914 10 90 27.9086 90 50C90 72.0914 72.0914 90 50 90"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="5 15"
        className="animate-[spin_8s_linear_infinite]"
      />

      {/* The Q Tail (Thinner, refined) */}
      <path
        d="M68 68L85 85"
        stroke={primaryColor}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Inner Core Pulse */}
      <circle
        cx="50"
        cy="50"
        r="15"
        fill={primaryColor}
        className="animate-pulse opacity-20"
      />
    </svg>
  );

  const wordmark = (
    <div className={`flex flex-col ${variant === 'horizontal' ? 'ml-3' : 'mt-4 items-center'}`}>
      <div className="flex items-center tracking-[0.4em] font-black uppercase text-sm sm:text-base">
        <span className={monochrome ? 'text-current' : 'text-white'}>Learn</span>
        <span className={monochrome ? 'text-current' : 'text-violet-400'}>IQ</span>
      </div>
      {variant === 'full' && (
        <div className="text-[8px] font-bold tracking-[0.6em] uppercase text-white/30 mt-1">
          Assess • Analyze • Advance
        </div>
      )}
    </div>
  );

  if (variant === 'icon') return <div className={className}>{symbol}</div>;

  return (
    <div className={`flex ${variant === 'horizontal' ? 'items-center' : 'flex-col items-center'} ${className}`}>
      {symbol}
      {wordmark}
    </div>
  );
};

export default Logo;
