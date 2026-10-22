import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { AnalyticsRepository } from '../repositories/analytics.repository.js';

export async function getChannels(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new AnalyticsRepository(db);
    const asOf = req.query.asOf ? String(req.query.asOf) : dbManager.getAsOfDate();

    const channels = await repo.getChannelStats(asOf);
    res.json({ asOf, channels });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new AnalyticsRepository(db);
    const asOf = req.query.asOf ? String(req.query.asOf) : dbManager.getAsOfDate();
    const year = Number(asOf.slice(0, 4));

    const [channels, monthly2026, monthly2025, deptMonthly] = await Promise.all([
      repo.getChannelStats(asOf),
      repo.getMonthlyKpis(year),
      repo.getMonthlyKpis(year - 1),
      repo.getDepartmentMonthly(`${year - 1}-01`, `${year}-12`),
    ]);

    res.json({
      asOf,
      channels,
      monthlyKpis: monthly2026,
      monthlyKpisPrev: monthly2025,
      departmentMonthly: deptMonthly,
    });
  } catch (err) {
    next(err);
  }
}

export async function postRevenueEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new AnalyticsRepository(db);
    const { department, amount, description, date, yearMonth, reservationId } = req.body;

    if (!amount || isNaN(Number(amount))) {
      res.status(400).json({ error: 'Valid revenue amount is required' });
      return;
    }

    const result = await repo.postRevenue({
      department: department || 'Food & Beverage',
      amount: Number(amount),
      description,
      date,
      yearMonth,
      reservationId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

