import { Card } from './Card';
import { useReveal } from '../hooks/motion';
import { eurM } from '../format';

const COLORS = ['#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#ec4899', '#f97316'];
const R = 60, C = 2 * Math.PI * R;

export function DepartmentDonut({
  dept,
  onViewDetails,
}: {
  dept: [string, number][];
  onViewDetails?: () => void;
}) {
  const on = useReveal();
  const total = dept.reduce((s, [, v]) => s + v, 0);
  let offset = 0;

  return (
    <Card i={3} className="tall" label="Revenue by department">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-white text-sm">Revenue by Department</h2>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            Ledger →
          </button>
        )}
      </div>

      <div className="donut my-3">
        <svg viewBox="0 0 190 190" role="img" aria-label={`Revenue by department, total ${eurM(total)}`}>
          <circle cx="95" cy="95" r={R} fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="24" />
          {total > 0 &&
            dept.map(([name, v], i) => {
              const len = (v / total) * C;
              const off = offset;
              offset += len;
              return (
                <circle
                  key={name}
                  cx="95"
                  cy="95"
                  r={R}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="24"
                  transform="rotate(-90 95 95)"
                  style={{
                    strokeDasharray: on ? `${Math.max(len - 2, 0)} ${C}` : `0 ${C}`,
                    strokeDashoffset: -off,
                    transition: `stroke-dasharray 1.2s var(--ease) ${i * 0.12}s`,
                  }}
                />
              );
            })}
        </svg>
        <div>
          <span>Total revenue</span>
          <b className="font-mono text-amber-400">{eurM(total)}</b>
        </div>
      </div>

      {total === 0 ? (
        <p className="dl">No revenue data yet.</p>
      ) : (
        <ul className="lg">
          {dept.map(([name, v], i) => (
            <li key={name}>
              <i style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-300">{name}</span>
              <b className="font-mono">{Math.round((v / total) * 100)}%</b>
            </li>
          ))}
        </ul>
      )}

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="btn2 mt-auto w-full text-center hover:border-amber-500/50"
        >
          View Full Breakdown
        </button>
      )}
    </Card>
  );
}
