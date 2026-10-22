import type { Db } from 'mongodb';
import { DashboardRepository } from '../repositories/dashboard.repository.js';
import type { DashboardResponse, FormattedReservation } from '../models/dashboard.model.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parseDate = (s: string) => new Date(`${s}T00:00:00Z`);
const toIsoDate = (x: Date) => (x instanceof Date ? x.toISOString().slice(0, 10) : String(x).slice(0, 10));
const shiftYear = (s: string, n: number) => `${Number(s.slice(0, 4)) + n}${s.slice(4)}`;
const calcPctChange = (current: number, previous: number) => (previous ? ((current - previous) / previous) * 100 : 0);

const addMonthsToYM = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + n;
  return `${Math.floor(totalMonths / 12)}-${String((totalMonths % 12) + 1).padStart(2, '0')}`;
};

const formatYMLabel = (ym: string) => `${MON[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

export class DashboardService {
  private repo: DashboardRepository;

  constructor(db: Db) {
    this.repo = new DashboardRepository(db);
  }

  public async getDashboard(asOf: string): Promise<DashboardResponse> {
    const makeRange = (fromStr: string, toStr: string) => {
      const from = parseDate(fromStr);
      // Ensure 'to' covers through the end of the active month so all current stays and charges are captured
      const [y, m] = toStr.split('-').map(Number);
      const to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      return { from, to };
    };

    const year = asOf.slice(0, 4);
    const from = `${year}-01-01`;
    const [prevYearFrom, prevYearTo] = [shiftYear(from, -1), shiftYear(asOf, -1)];

    // Parallel fetch of primary metrics
    const [
      kpisCurrent,
      kpisPrev,
      deptRevenueCurrent,
      deptRevenuePrev,
      channels,
      topGuests,
    ] = await Promise.all([
      this.repo.getKpis(makeRange(from, asOf)),
      this.repo.getKpis(makeRange(prevYearFrom, prevYearTo)),
      this.repo.getDepartmentRevenue(makeRange(from, asOf)),
      this.repo.getDepartmentRevenue(makeRange(prevYearFrom, prevYearTo)),
      this.repo.getChannelPerformance(makeRange(from, asOf)),
      this.repo.getTopGuests(makeRange(from, asOf), 3),
    ]);

    const sumRevenue = (items: Array<{ revenue: number }>) => items.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalRev = sumRevenue(deptRevenueCurrent);
    const totalRevPrev = sumRevenue(deptRevenuePrev);

    // Compute monthly trend data
    const curYM = asOf.slice(0, 7);
    const lastYM = addMonthsToYM(curYM, -1);
    const prevYM = addMonthsToYM(curYM, -2);

    const monthlySplitData = await this.repo.getMonthlySplit(addMonthsToYM(curYM, -8), curYM);
    const getTotalForYM = (ym: string) => {
      const match = monthlySplitData.find(item => item.ym === ym);
      return match ? match.room + match.other : 0;
    };

    const curTotal = getTotalForYM(curYM);
    const prevMonthTotal = getTotalForYM(lastYM);
    const activeYM = curTotal > 0 ? curYM : lastYM;
    const activeTotal = curTotal > 0 ? curTotal : prevMonthTotal;
    const activePrev = curTotal > 0 ? prevMonthTotal : getTotalForYM(prevYM);

    const activeKpis = await this.repo.getMonthlyKpiById(activeYM);

    // Recent reservations: show latest additions / check-outs at the top
    const formatRes = (r: any): FormattedReservation => {
      const checkInStr = toIsoDate(r.checkIn ?? r.check_in);
      const checkOutStr = toIsoDate(r.checkOut ?? r.check_out);
      const roomType = r.room?.type ?? r.room_type ?? 'Deluxe Room';
      const guestName = r.guestName ?? r.guest?.name ?? 'Guest';
      const nights = r.nights ?? 1;
      const rate = r.ratePerNight ?? r.rate_per_night ?? 0;
      const total = r.totalCharges || (nights * rate) || 0;

      let statusLabel = r.status || 'Confirmed';
      if (statusLabel === 'Checked-out') statusLabel = 'Completed';

      return {
        n: guestName,
        t: roomType,
        ci: checkInStr.slice(5),
        co: checkOutStr.slice(5),
        v: Math.round(total * 100) / 100,
        s: statusLabel,
      };
    };

    const [latestReservations, recentDaysKpis] = await Promise.all([
      this.repo.getLatestReservations(5),
      this.repo.getDailyOccupancyPoints(
        new Date(+parseDate(asOf) - 13 * 864e5),
        parseDate(asOf)
      ),
    ]);

    return {
      period: `Jan ${year} – ${MON[Number(asOf.slice(5, 7)) - 1]} ${year}`,
      asof: `${MON[Number(asOf.slice(5, 7)) - 1]} ${Number(asOf.slice(8))}, ${year}`,
      rev: totalRev,
      yoy: calcPctChange(totalRev, totalRevPrev),
      revpar: kpisCurrent?.revpar ?? 0,
      revparYoy: calcPctChange(kpisCurrent?.revpar ?? 0, kpisPrev?.revpar ?? 0),
      last: {
        label: formatYMLabel(activeYM),
        total: activeTotal,
        mom: calcPctChange(activeTotal, activePrev),
        occ: activeKpis?.occupancyPct ?? 0,
        adr: activeKpis?.adr ?? 0,
        revpar: activeKpis?.revpar ?? 0,
      },
      months: monthlySplitData.map(item => ({
        m: MON[Number(item.ym.slice(5)) - 1],
        room: item.room,
        other: item.other,
      })),
      dept: deptRevenueCurrent.map(item => [item.department, item.revenue]),
      res: latestReservations.map(formatRes),
      occ: recentDaysKpis.map((day: any) => day.occupancyPct),
      ch: channels.map(c => [c.channel, c.roomRevenue, c.adr, c.cancellationRatePct]),
      guests: topGuests.map(g => [g.name, g.spend, g.stays]),
    };
  }
}

// Standalone function for backward compatibility
export async function dashboard(db: Db, asOf: string): Promise<DashboardResponse> {
  const service = new DashboardService(db);
  return service.getDashboard(asOf);
}
