import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { chatRouter } from './chat.routes.js';
import { reservationRouter } from './reservation.routes.js';
import { guestRouter } from './guest.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { settingsRouter } from './settings.routes.js';
import { tablesRouter } from './tables.routes.js';
import { authRouter } from './auth.routes.js';

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use(healthRouter);
apiRouter.use(dashboardRouter);
apiRouter.use(chatRouter);
apiRouter.use(reservationRouter);
apiRouter.use(guestRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(settingsRouter);
apiRouter.use(tablesRouter);

