import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';

const ALLOWED_COLLECTIONS = [
  'reservations',
  'guests',
  'rooms',
  'room_types',
  'folio_charges',
  'payments',
  'channels',
  'departments',
  'daily_kpis',
  'monthly_kpis',
  'department_revenue_monthly',
  'calendar',
  'meta',
];

export async function getTablesMetadata(_req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const cols = await db.listCollections().toArray();

    const tables = await Promise.all(
      cols
        .filter((c) => ALLOWED_COLLECTIONS.includes(c.name))
        .map(async (c) => {
          const count = await db.collection(c.name).countDocuments();
          const sample = await db.collection(c.name).findOne();
          return {
            name: c.name,
            count,
            fields: sample ? Object.keys(sample) : [],
          };
        })
    );

    res.json({ tables });
  } catch (err) {
    next(err);
  }
}

export async function getTableData(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const { tableName } = req.params;

    if (!ALLOWED_COLLECTIONS.includes(tableName)) {
      res.status(400).json({ error: `Table '${tableName}' is not accessible or does not exist.` });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';

    const col = db.collection(tableName);
    let filter: any = {};

    if (search) {
      const sample = await col.findOne();
      if (sample) {
        const stringFields = Object.entries(sample)
          .filter(([_, v]) => typeof v === 'string')
          .map(([k]) => k);

        if (stringFields.length > 0) {
          filter.$or = stringFields.map((f) => ({
            [f]: { $regex: search, $options: 'i' },
          }));
        }
      }
    }

    const [total, items] = await Promise.all([
      col.countDocuments(filter),
      col.find(filter).skip(skip).limit(limit).toArray(),
    ]);

    res.json({
      tableName,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
}
