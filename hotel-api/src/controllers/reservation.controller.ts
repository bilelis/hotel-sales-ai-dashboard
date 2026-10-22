import type { Request, Response, NextFunction } from 'express';
import { dbManager } from '../database/connection.js';
import { ReservationRepository } from '../repositories/reservation.repository.js';

export async function getReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new ReservationRepository(db);

    const { page, limit, status, search, sortBy, sortOrder } = req.query;

    const result = await repo.find({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      sortOrder: (sortOrder === 'asc' ? 'asc' : 'desc') as any,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getReservationById(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new ReservationRepository(db);

    const reservation = await repo.findById(req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    res.json(reservation);
  } catch (err) {
    next(err);
  }
}

export async function updateReservationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new ReservationRepository(db);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const exists = await repo.findById(req.params.id);
    if (!exists) {
      res.status(404).json({ error: `Reservation '${req.params.id}' not found` });
      return;
    }

    await repo.updateStatus(req.params.id, status);
    const updated = await repo.findById(req.params.id);
    res.json({ success: true, reservation: updated });
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new ReservationRepository(db);

    const created = await repo.create(req.body);
    res.status(201).json({ success: true, reservation: created });
  } catch (err) {
    next(err);
  }
}

export async function addFolioCharge(req: Request, res: Response, next: NextFunction) {
  try {
    const db = dbManager.getDb();
    const repo = new ReservationRepository(db);
    const { department, amount, description, date } = req.body;

    if (!amount || isNaN(Number(amount))) {
      res.status(400).json({ error: 'Valid charge amount is required' });
      return;
    }

    const result = await repo.addCharge(req.params.id, {
      department: department || 'Food & Beverage',
      amount: Number(amount),
      description: description || 'Guest charge',
      date,
    });

    if (!result) {
      res.status(404).json({ error: `Reservation '${req.params.id}' not found` });
      return;
    }

    res.status(201).json({
      success: true,
      charge: result.charge,
      reservation: result.reservation,
    });
  } catch (err) {
    next(err);
  }
}

