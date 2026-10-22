import { Card, Delta } from './Card';
import { useCountUp, useReveal } from '../hooks/motion';
import { eur } from '../format';
import type { Last, MonthRevenue } from '../types';

export function RevenueBars({ last, months }: { last: Last; months: MonthRevenue[] }) {
  const on = useReveal();
  const shown = useCountUp(last.total);
  const max = Math.max(1, ...months.map(m => m.room), ...months.map(m => m.other));
  return (
    <Card i={5} className="c3" label="Revenue">
      <div className="lbl"><h2 style={{ color: 'var(--ink)' }}>Revenue</h2>
        <span className="legend"><span><i style={{ background: 'var(--blue)' }} />Rooms</span><span><i style={{ background: 'var(--lime)' }} />Other</span></span></div>
      <div className="val" aria-label={eur(last.total)}>{eur(shown)}</div>
      <Delta v={last.mom} text={`from last month · ${last.label}`} />
      <div className="bars" role="img" aria-label="Monthly revenue: rooms versus other departments">
        {months.map(m => (
          <div className="g" key={m.m}>
            {([['Rooms', m.room, 'var(--blue)'], ['Other', m.other, 'var(--lime)']] as const).map(([name, v, color]) => (
              <div key={name} className="b" title={`${m.m} · ${name}: ${eur(v)}`} style={{ background: color, height: on ? `${Math.max((v / max) * 100, 4)}%` : '0%' }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mo" aria-hidden="true">{months.map(m => <span key={m.m}>{m.m}</span>)}</div>
    </Card>
  );
}
