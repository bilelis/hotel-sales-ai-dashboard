import { useEffect, useRef, useState } from 'react';

export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** false on first paint, true one frame later: lets CSS transitions animate "from" -> "to" on mount. */
export function useReveal() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (reducedMotion()) { setOn(true); return; }
    let id = requestAnimationFrame(() => { id = requestAnimationFrame(() => setOn(true)); });
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

/** Eased count-up from the previous value to `target`. */
export function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (reducedMotion()) { setV(target); prev.current = target; return; }
    const from = prev.current, start = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      setV(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) id = requestAnimationFrame(tick); else prev.current = target;
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, ms]);
  return v;
}
