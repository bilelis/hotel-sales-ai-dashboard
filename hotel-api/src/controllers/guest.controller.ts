import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { GuestRepository } from '../repositories/guest.repository.js';

export async function getGuests(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new GuestRepository(db);

    const { page, limit, search, nationality, vipLevel } = req.query;

    const result = await repo.find({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      search: search ? String(search) : undefined,
      nationality: nationality ? String(nationality) : undefined,
      vipLevel: vipLevel ? String(vipLevel) : undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getGuestById(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new GuestRepository(db);

    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid guest id' });
      return;
    }

    const result = await repo.findById(id);
    if (!result) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}
