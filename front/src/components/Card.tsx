import type { CSSProperties, ReactNode } from 'react';

export function Card({ i = 0, className = '', label, children }: { i?: number; className?: string; label?: string; children: ReactNode }) {
  return <section className={`card ${className}`} style={{ '--i': i } as CSSProperties} aria-label={label}>{children}</section>;
}

export function Delta({ v, text }: { v: number; text: string }) {
  const up = v >= 0;
  return <span className="dl"><span className={up ? 'up' : 'dn'}>{up ? '↑ +' : '↓ −'}{Math.abs(v).toFixed(1).replace('.', ',')}%</span> {text}</span>;
}
