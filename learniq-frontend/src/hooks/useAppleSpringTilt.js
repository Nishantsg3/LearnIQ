import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * useAppleSpringTilt
 *
 * Implements Apple tvOS / VisionOS 3D tactile card interaction:
 * - High-speed hardware-accelerated 3D Perspective Tilt (rotateX, rotateY) driven by cursor.
 * - Dynamic Directional Shadow that shifts opposite to the tilt angle.
 * - Specular Glare Coordinates (--glare-x, --glare-y) following the pointer.
 * - Critically-damped spring settle on pointer leave with zero jitter.
 * - Tactile compression on pointer-down (scale 0.975).
 * - Automatic disable during active motion to prevent CSS transition fighting.
 * - Automatic graceful degradation for prefers-reduced-motion.
 */
export function useAppleSpringTilt({
  maxTilt = 12,        // Maximum tilt degrees (12-14 deg for visible 3D presence)
  perspective = 1100,  // 3D perspective distance in px
  scaleOnHover = 1.035, // Visibly elegant physical lift
  scaleOnActive = 0.975 // Tactile press feedback
} = {}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isHoveredRef = useRef(false);
  const isPressedRef = useRef(false);
  const rafId = useRef(null);

  // Target values
  const targetX = useRef(0);
  const targetY = useRef(0);
  const glareX = useRef(50);
  const glareY = useRef(50);
  const glareOpacity = useRef(0);

  // Current interpolated values (smooth spring physics)
  const currentX = useRef(0);
  const currentY = useRef(0);
  const updateTransformRef = useRef(null);

  const updateTransform = useCallback(() => {
    if (!cardRef.current) return;

    // Responsive lerp factor (0.20 for immediate responsiveness with spring smoothness)
    const lerp = 0.20;
    currentX.current += (targetX.current - currentX.current) * lerp;
    currentY.current += (targetY.current - currentY.current) * lerp;

    const el = cardRef.current;
    const pressed = isPressedRef.current;
    const hovered = isHoveredRef.current;
    const scale = pressed ? scaleOnActive : (hovered ? scaleOnHover : 1);

    // Disable CSS transition during active cursor tracking so 16ms rAF is not throttled
    el.style.transition = 'none';

    // 3D Perspective tilt with dynamic shadow offset
    el.style.transform = `perspective(${perspective}px) rotateX(${currentX.current.toFixed(2)}deg) rotateY(${currentY.current.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
    el.style.setProperty('--glare-x', `${glareX.current.toFixed(1)}%`);
    el.style.setProperty('--glare-y', `${glareY.current.toFixed(1)}%`);
    el.style.setProperty('--glare-opacity', glareOpacity.current.toFixed(2));

    // Calculate dynamic lighting shadow offset
    const shadowOffsetX = (-currentY.current * 1.5).toFixed(1);
    const shadowOffsetY = (currentX.current * 1.5 + 16).toFixed(1);
    el.style.setProperty('--card-shadow-x', `${shadowOffsetX}px`);
    el.style.setProperty('--card-shadow-y', `${shadowOffsetY}px`);

    // Continue animation loop if still moving or hovered
    const deltaX = Math.abs(targetX.current - currentX.current);
    const deltaY = Math.abs(targetY.current - currentY.current);

    if (hovered || deltaX > 0.05 || deltaY > 0.05) {
      if (updateTransformRef.current) {
        rafId.current = requestAnimationFrame(updateTransformRef.current);
      }
    } else {
      // Settle completely and re-enable smooth CSS transition for next leave/enter
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = pressed ? `scale3d(${scaleOnActive}, ${scaleOnActive}, ${scaleOnActive})` : 'none';
      rafId.current = null;
    }
  }, [perspective, scaleOnHover, scaleOnActive]);

  useEffect(() => {
    updateTransformRef.current = updateTransform;
  }, [updateTransform]);

  const handlePointerMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize from -1 to 1 (center is 0, 0)
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    // RotateX is driven by Y coordinate (tilt forward/backward)
    // RotateY is driven by X coordinate (tilt left/right)
    targetX.current = -normY * maxTilt;
    targetY.current = normX * maxTilt;

    // Glare position in percentage
    glareX.current = (x / rect.width) * 100;
    glareY.current = (y / rect.height) * 100;
    glareOpacity.current = 1;

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateTransform);
    }
  }, [maxTilt, updateTransform]);

  const handlePointerEnter = useCallback(() => {
    isHoveredRef.current = true;
    setIsHovered(true);
    glareOpacity.current = 1;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateTransform);
    }
  }, [updateTransform]);

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    isPressedRef.current = false;
    setIsHovered(false);
    setIsPressed(false);
    targetX.current = 0;
    targetY.current = 0;
    glareOpacity.current = 0;

    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateTransform);
    }
  }, [updateTransform]);

  const handlePointerDown = useCallback(() => {
    isPressedRef.current = true;
    setIsPressed(true);
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateTransform);
    }
  }, [updateTransform]);

  const handlePointerUp = useCallback(() => {
    isPressedRef.current = false;
    setIsPressed(false);
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(updateTransform);
    }
  }, [updateTransform]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return {
    ref: cardRef,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
    },
    isHovered,
    isPressed,
  };
}
