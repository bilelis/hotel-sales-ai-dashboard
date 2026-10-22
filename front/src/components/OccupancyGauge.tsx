import { Card } from './Card';
import { useCountUp, useReveal } from '../hooks/motion';

const smooth = (p: [number, number][]) =>
  p.reduce((d, [x, y], i, a) => (i ? `${d}C${(a[i - 1][0] + x) / 2} ${a[i - 1][1]} ${(a[i - 1][0] + x) / 2} ${y} ${x} ${y}` : `M${x} ${y}`), '');

export function OccupancyGauge({ occ }: { occ: number[] }) {
  const on = useReveal();
  const now = occ.length ? occ[occ.length - 1] : 0;
  const shown = useCountUp(now, 1400);
  const lo = Math.min(...occ) - 5, hi = Math.max(...occ) + 5;
  const pts: [number, number][] = occ.length > 1 ? occ.map((v, i) => [(i / (occ.length - 1)) * 300, 76 - ((v - lo) / (hi - lo || 1)) * 66]) : [];
  const line = pts.length ? smooth(pts) : '';
  return (
    <Card i={6} className="c3" label="Occupancy">
      <h2>Occupancy</h2>
      <div className="gauge">
        <svg viewBox="0 0 200 108" role="img" aria-label={`Occupancy today ${Math.round(now)} percent`}>
          <defs><linearGradient id="lgd"><stop offset="0" stopColor="#d8f26a" /><stop offset="1" stopColor="#7fd13b" /></linearGradient></defs>
          <path d="M20 100A80 80 0 0 1 180 100" pathLength={100} fill="none" stroke="var(--line)" strokeWidth="16" strokeLinecap="round" />
          <path d="M20 100A80 80 0 0 1 180 100" pathLength={100} fill="none" stroke="url(#lgd)" strokeWidth="16" strokeLinecap="round"
            style={{ strokeDasharray: `${on ? now : 0} 100`, transition: 'stroke-dasharray 1.4s var(--ease)' }} />
        </svg>
        <div><b>{Math.round(shown)}%</b>rooms occupied today</div>
      </div>
      {line && (
        <svg className="area" viewBox="0 0 300 80" preserveAspectRatio="none" role="img" aria-label="Occupancy over the last 14 days">
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b6e23a" stopOpacity=".55" /><stop offset="1" stopColor="#b6e23a" stopOpacity="0" /></linearGradient></defs>
          <path d={`${line}L300 80L0 80Z`} fill="url(#ag)" style={{ opacity: on ? 1 : 0, transition: 'opacity 1.2s var(--ease) .4s' }} />
          <path d={line} fill="none" stroke="#7fd13b" strokeWidth="2.5" strokeLinecap="round" pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: 'stroke-dashoffset 1.6s var(--ease)' }} />
        </svg>
      )}
    </Card>
  );
}
