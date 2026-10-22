import { Router } from 'express';
import { getSettings } from '../controllers/settings.controller.js';

export const settingsRouter = Router();

settingsRouter.get('/settings', getSettings);
