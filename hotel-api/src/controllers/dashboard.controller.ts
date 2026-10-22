import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { DashboardService } from '../services/dashboard.service.js';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const asOf = _req.query.asOf ? String(_req.query.asOf) : dbManager.getAsOfDate();
    const service = new DashboardService(db);
    const data = await service.getDashboard(asOf);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
