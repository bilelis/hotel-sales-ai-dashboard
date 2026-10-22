import { Router } from 'express';
import { getGuests, getGuestById } from '../controllers/guest.controller.js';

export const guestRouter = Router();

guestRouter.get('/guests', getGuests);
guestRouter.get('/guests/:id', getGuestById);
