import type { Request, Response } from 'express';
import { dbManager } from '../database/connection.js';
import { config } from '../config/index.js';

export async function getHealth(_req: Request, res: Response) {
  const isDbHealthy = await dbManager.ping();
  const asOf = dbManager.getAsOfDate();

  res.json({
    status: isDbHealthy ? 'healthy' : 'degraded',
    ok: true,
    database: {
      connected: isDbHealthy,
      name: config.dbName,
    },
    dataAsOf: asOf,
    aiModel: {
      host: config.ollamaHost,
      name: config.model,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
