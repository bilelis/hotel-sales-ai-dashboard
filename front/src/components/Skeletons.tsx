import type { CSSProperties } from 'react';

const sk = (h: number, w = '100%'): CSSProperties => ({ height: h, width: w });

function SkCard({ className, i, children }: { className: string; i: number; children: React.ReactNode }) {
  return <div className={`card ${className}`} style={{ '--i': i } as CSSProperties}>{children}</div>;
}

export function DashboardSkeleton() {
  return (
    <div className="overview-grid" role="status" aria-label="Loading dashboard">
      <SkCard className="c2" i={0}><div className="sk" style={sk(12, '50%')} /><div className="sk mt-4" style={sk(44)} /></SkCard>
      <SkCard className="c2" i={1}><div className="sk" style={sk(12, '40%')} /><div className="sk mt-4" style={sk(34, '70%')} /></SkCard>
      <SkCard className="c2" i={2}><div className="sk" style={sk(12, '40%')} /><div className="sk mt-4" style={sk(34, '70%')} /></SkCard>
      <SkCard className="tall" i={3}><div className="sk" style={sk(12, '60%')} /><div className="sk mx-auto my-6" style={{ ...sk(150, '150px'), borderRadius: '50%' }} /><div className="sk" style={sk(70)} /></SkCard>
      <SkCard className="c3" i={4}><div className="sk" style={sk(12, '35%')} /><div className="sk mt-4" style={sk(150)} /></SkCard>
      <SkCard className="c3" i={5}><div className="sk" style={sk(12, '30%')} /><div className="sk mt-4" style={sk(150)} /></SkCard>
      <SkCard className="c3" i={6}><div className="sk" style={sk(12, '35%')} /><div className="sk mt-4" style={sk(150)} /></SkCard>
      <SkCard className="c4" i={7}><div className="sk" style={sk(12, '30%')} /><div className="sk mt-4" style={sk(150)} /></SkCard>
    </div>
  );
}

export function ErrorCard({ message, onRetry, busy }: { message: string; onRetry: () => void; busy: boolean }) {
  return (
    <div className="card errcard" role="alert">
      <h2>We couldn’t load the dashboard</h2>
      <p>{message}</p>
      <button className="btn" onClick={onRetry} disabled={busy}>{busy ? 'Retrying…' : 'Retry'}</button>
    </div>
  );
}
