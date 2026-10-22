import { Router } from 'express';
import { getChannels, getAnalytics, postRevenueEntry } from '../controllers/analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.get('/channels', getChannels);
analyticsRouter.get('/analytics', getAnalytics);
analyticsRouter.post('/revenue', postRevenueEntry);

