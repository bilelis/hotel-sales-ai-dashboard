import { Router } from 'express';
import {
  getReservations,
  getReservationById,
  updateReservationStatus,
  createReservation,
  addFolioCharge,
} from '../controllers/reservation.controller.js';

export const reservationRouter = Router();

reservationRouter.get('/reservations', getReservations);
reservationRouter.get('/reservations/:id', getReservationById);
reservationRouter.patch('/reservations/:id/status', updateReservationStatus);
reservationRouter.post('/reservations/:id/charges', addFolioCharge);
reservationRouter.post('/reservations/:id/checkout', (req, res, next) => {
  req.body.status = 'Checked-out';
  return updateReservationStatus(req, res, next);
});
reservationRouter.patch('/reservations/:id/checkout', (req, res, next) => {
  req.body.status = 'Checked-out';
  return updateReservationStatus(req, res, next);
});
reservationRouter.post('/reservations', createReservation);

