import React from 'react';
import { useAppleSpringTilt } from '../hooks/useAppleSpringTilt';

/**
 * Apple3DTiltCard
 *
 * High-performance Apple tvOS / VisionOS 3D Parallax Card Container.
 * - Hardware-accelerated perspective 3D tilt with dynamic angle tracking.
 * - Multi-layer spatial depth with preserve-3d context.
 * - Directional holographic light glare following cursor position.
 * - Apple spring dampening on leave without frame jitter.
 * - Tactile pointer-down press compression.
 */
const Apple3DTiltCard = ({
  children,
  className = '',
  maxTilt = 13,
  perspective = 1100,
  scaleOnHover = 1.035,
  scaleOnActive = 0.975,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...props
}) => {
  const { ref, handlers, isHovered } = useAppleSpringTilt({
    maxTilt,
    perspective,
    scaleOnHover,
    scaleOnActive,
  });

  return (
    <div
      ref={ref}
      {...handlers}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      className={`relative transform-gpu will-change-transform select-none ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? 'var(--card-shadow-x, 0px) var(--card-shadow-y, 20px) 36px -8px rgba(0,0,0,0.35)'
          : undefined
      }}
      {...props}
    >
      {children}

      {/* Dynamic Specular Holographic Glare Layer (Light & Dark Mode) */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden z-30 apple-specular-glare"
        aria-hidden="true"
        style={{ transform: 'translateZ(18px)' }}
      />
    </div>
  );
};

export default React.memo(Apple3DTiltCard);
