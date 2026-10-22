// Offline check: runs the real pipelines, tools and dashboard builder against the NDJSON export
// using an in-memory MongoDB emulator (mingo). No MongoDB or Ollama needed.
//   npm run check            (DATA_DIR defaults to ../hotel_mongo/data)
import { Aggregator, Query } from 'mingo';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { dashboard } from '../src/dashboard.js';
import { runTool } from '../src/tools.js';

const DIR = process.env.DATA_DIR ?? '../hotel_mongo/data';
const revive = (o: any): any => Array.isArray(o) ? o.map(revive)
  : o && typeof o === 'object' ? ('$date' in o ? new Date(o.$date) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, revive(v)]))) : o;
const data: Record<string, any[]> = {};
for (const f of readdirSync(DIR).filter(f => f.endsWith('.ndjson')))
  data[f.replace('.ndjson', '')] = readFileSync(join(DIR, f), 'utf8').trim().split('\n').map(l => revive(JSON.parse(l)));

const db: any = { collection: (n: string) => ({
  aggregate: (p: any[]) => ({ toArray: async () => new Aggregator(p).run(data[n]) }),
  find: (q: any) => { let c = new Query(q).find(data[n]);
    const h: any = { sort: (s: any) => { c = c.sort(s); return h; }, limit: (k: number) => { c = c.limit(k); return h; }, toArray: async () => c.all() }; return h; },
  findOne: async (q: any) => new Query(q).find(data[n]).next() ?? null,
}) };
const ctx = { db, asOf: '2026-10-17' };
let bad = 0;
const eq = (name: string, got: unknown, want: unknown, tol = 0.51) => {
  const ok = typeof want === 'number' ? Math.abs((got as number) - want) <= tol : got === want;
  if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', name, '->', got, ok ? '' : `(expected ${want})`);
};

const k: any = await runTool('get_kpis', { from: '2026-01-01', to: '2026-10-17' }, ctx);
eq('get_kpis revpar YTD 2026', k.revpar, 220.9, 0.06);
const dept: any[] = await runTool('revenue_by_department', { from: '2026-01-01', to: '2026-10-17' }, ctx) as any[];
eq('Rooms revenue YTD', dept[0].revenue, 3854973); eq('top department', dept[0].department, 'Rooms');
const m: any[] = await runTool('get_monthly_kpis', { year: '2026' }, ctx) as any[];   // string on purpose: models often send strings
eq('Sep 2026 occupancy', m.find(x => x.month === 9).occupancyPct, 75.3, 0.05);
eq('Sep 2026 RevPAR', m.find(x => x.month === 9).revpar, 278.95, 0.01);
const ch: any[] = await runTool('revenue_by_channel', {}, ctx) as any[];
console.log('channels:', ch.map(c => `${c.channel} ${c.roomRevenue} ADR ${c.adr} canc ${c.cancellationRatePct}%`).join(' | '));
eq('channels listed', ch.length, 9, 0);
console.log('top guests:', JSON.stringify(await runTool('top_guests', { limit: 2 }, ctx)));
console.log('nationalities:', JSON.stringify(await runTool('guests_by_nationality', { limit: 3 }, ctx)));
console.log('bad date  ->', JSON.stringify(await runTool('get_kpis', { from: '2026-13-45' }, ctx)));
console.log('bad range ->', JSON.stringify(await runTool('get_kpis', { from: '2026-05-01', to: '2026-01-01' }, ctx)));
console.log('unknown   ->', JSON.stringify(await runTool('drop_database', {}, ctx)));

const D: any = await dashboard(db, '2026-10-17');
eq('dashboard rev', D.rev, 7974381.5, 1); eq('dashboard last month', D.last.label, 'Sep 2026');
eq('dashboard months', D.months.length, 9, 0); eq('dashboard occ points', D.occ.length, 14, 0);
console.log('dashboard:', JSON.stringify({ period: D.period, asof: D.asof, yoy: +D.yoy.toFixed(1), revpar: D.revpar, revparYoy: +D.revparYoy.toFixed(1), last: D.last, res: D.res.slice(0, 2), guests: D.guests }));
console.log(bad ? `\n${bad} CHECK(S) FAILED` : '\nALL CHECKS PASSED'); process.exit(bad ? 1 : 0);
