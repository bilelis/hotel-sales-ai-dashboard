const n0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const n2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** €7.974.381 (0 decimals) or €220,90 (2 decimals) */
export const eur = (v: number, decimals: 0 | 2 = 0) => '€' + (decimals ? n2 : n0).format(v);
export const eurM = (v: number) => '€' + n2.format(v / 1e6) + 'M';
export const initials = (name: string) => name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
export const pct1 = (v: number) => Math.abs(v).toFixed(1).replace('.', ',') + '%';
