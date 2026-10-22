import { Card } from './Card';

export function UpdateCard({ asof, yoy }: { asof: string; yoy: number }) {
  return (
    <Card i={0} className="dark c2" label="Update">
      <p>Update · {asof}</p>
      <h2>Revenue is <b>{Math.abs(yoy).toFixed(1).replace('.', ',')}% {yoy >= 0 ? 'up' : 'down'}</b> vs the same period last year</h2>
      <u>See details →</u>
    </Card>
  );
}
