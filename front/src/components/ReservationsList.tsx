import { Card } from './Card';
import { eur, initials } from '../format';
import type { Reservation } from '../types';

export function ReservationsList({
  res,
  onViewAll,
}: {
  res: Reservation[];
  onViewAll?: () => void;
}) {
  return (
    <Card i={4} className="c3" label="Reservations">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-white text-sm">Recent Reservations</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition"
          >
            View All ({res.length}) →
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-800/60">
        {res.length === 0 && <p className="dl py-4">No recent reservations.</p>}
        {res.map((r, k) => (
          <div
            className="tx cursor-pointer hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition"
            key={`${r.n}-${r.ci}-${k}`}
            onClick={onViewAll}
          >
            <i aria-hidden="true" className="bg-slate-800 text-amber-300 font-bold">
              {initials(r.n)}
            </i>
            <div>
              <b className="text-white hover:text-amber-300 transition">{r.n}</b>
              <small className="text-slate-400">{r.t} · {r.ci} → {r.co}</small>
            </div>
            <span className="text-right">
              <span className="font-mono font-bold text-slate-200">{eur(r.v)}</span>
              <em
                className={`text-[10px] font-bold block ${
                  r.s === 'Completed' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {r.s}
              </em>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
