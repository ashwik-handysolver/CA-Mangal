import { useEffect, useRef, useState } from 'react';

// Animates a number from 0 to `target` (ease-out). Respects reduced motion.
export function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !target) {
      raf.current = requestAnimationFrame(() => setValue(target || 0));
      return () => cancelAnimationFrame(raf.current);
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

export function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const on = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [breakpoint]);
  return mobile;
}

// Drag-down-to-dismiss behaviour shared by every bottom sheet.
export function useSheetDrag(onClose) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const handlers = {
    onTouchStart: (e) => { startY.current = e.touches[0].clientY; setDragging(true); },
    onTouchMove: (e) => setDy(Math.max(0, e.touches[0].clientY - startY.current)),
    onTouchEnd: () => {
      setDragging(false);
      if (dy > 110) onClose();
      else setDy(0);
    },
  };
  const style = { transform: dy ? `translateY(${dy}px)` : undefined, transition: dragging ? 'none' : 'transform 0.25s ease' };
  return { handlers, style };
}

export function useLockBodyScroll(onEscape) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onEscape?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onEscape]);
}
