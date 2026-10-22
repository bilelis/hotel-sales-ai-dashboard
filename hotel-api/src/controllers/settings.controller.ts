import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { AnalyticsRepository } from '../repositories/analytics.repository.js';
import { config } from '../config/index.js';

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new AnalyticsRepository(db);

    const info = await repo.getHotelMeta();

    res.json({
      hotel: info.meta,
      stats: {
        totalRooms: info.totalRooms,
        totalGuests: info.totalGuests,
        totalReservations: info.totalReservations,
      },
      roomTypes: info.roomTypes,
      system: {
        dataAsOf: dbManager.getAsOfDate(),
        ollamaHost: config.ollamaHost,
        ollamaModel: config.model,
        database: config.dbName,
        port: config.port,
        version: '1.2.0',
      },
    });
  } catch (err) {
    next(err);
  }
}
