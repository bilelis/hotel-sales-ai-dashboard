import type { Db, Document } from 'mongodb';
import { COLLECTIONS } from '../database/collections.js';
import type { DateRange, DailyKpiDocument, MonthlyKpiDocument } from '../models/kpi.model.js';
import * as P from '../pipelines.js';

export class DashboardRepository {
  constructor(private db: Db) {}

  private col(name: string) {
    return this.db.collection<any>(name);
  }

  private async agg<T extends Document = any>(name: string, pipeline: Document[]): Promise<T[]> {
    return this.col(name).aggregate<T>(pipeline).toArray();
  }

  public async getKpis(range: DateRange) {
    const results = await this.agg(COLLECTIONS.DAILY_KPIS, P.kpis(range));
    return results[0] ?? null;
  }

  public async getMonthlyKpis(year: number) {
    return this.agg(COLLECTIONS.MONTHLY_KPIS, P.monthlyKpis(year));
  }

  public async getMonthlyKpiById(yearMonth: string): Promise<MonthlyKpiDocument | null> {
    return this.col(COLLECTIONS.MONTHLY_KPIS).findOne({ _id: yearMonth });
  }

  public async getDepartmentRevenue(range: DateRange) {
    return this.agg(COLLECTIONS.RESERVATIONS, P.deptRevenue(range));
  }

  public async getChannelPerformance(range: DateRange) {
    return this.agg(COLLECTIONS.RESERVATIONS, P.channels(range));
  }

  public async getTopGuests(range: DateRange, limit: number = 5) {
    return this.agg(COLLECTIONS.RESERVATIONS, P.topGuests(range, limit));
  }

  public async getGuestsByNationality(range: DateRange, limit: number = 5) {
    return this.agg(COLLECTIONS.RESERVATIONS, P.nationalities(range, limit));
  }

  public async getMonthlySplit(fromYM: string, toYM: string) {
    return this.agg(COLLECTIONS.DEPARTMENT_REVENUE_MONTHLY, P.monthlySplit(fromYM, toYM));
  }

  public async getRecentReservations(status: string, limit: number = 3) {
    const sortField = status === 'Checked-out' ? { checkOut: -1, _id: -1 } : { checkIn: -1, _id: -1 };
    return this.col(COLLECTIONS.RESERVATIONS)
      .find({ status })
      .sort(sortField as any)
      .limit(limit)
      .toArray();
  }

  public async getLatestReservations(limit: number = 5) {
    return this.col(COLLECTIONS.RESERVATIONS)
      .find({ confirmationCode: { $ne: 'GAP-HOUSE-LEDGER' } })
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
  }

  public async getDailyOccupancyPoints(from: Date, to: Date): Promise<DailyKpiDocument[]> {
    return this.col(COLLECTIONS.DAILY_KPIS)
      .find({ date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .toArray();
  }
}
