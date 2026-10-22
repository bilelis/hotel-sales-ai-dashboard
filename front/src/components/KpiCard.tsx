import { Card, Delta } from './Card';
import { useCountUp } from '../hooks/motion';

export function KpiCard({
  i,
  label,
  subtitle,
  value,
  delta,
  format,
}: {
  i: number;
  label: string;
  subtitle?: string;
  value: number;
  delta: number;
  format: (v: number) => string;
}) {
  const shown = useCountUp(value);
  return (
    <Card i={i} className="c2" label={label}>
      <div className="lbl">
        <span className="font-bold text-white text-xs">{label}</span>
        <span aria-hidden="true" className="text-slate-500">···</span>
      </div>
      {subtitle && (
        <span className="text-[10.5px] text-amber-400/90 font-medium tracking-wide block mt-0.5 leading-snug">
          {subtitle}
        </span>
      )}
      <div className="val" aria-label={format(value)}>{format(shown)}</div>
      <Delta v={delta} text="from last year" />
    </Card>
  );
}
