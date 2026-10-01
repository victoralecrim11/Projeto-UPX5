import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './lib/http.js';
import { authenticate } from './middleware/auth.js';
import { adminRouter } from './routes/admin.routes.js';
import { alertsRouter } from './routes/alerts.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { bootstrapRouter } from './routes/bootstrap.routes.js';
import { consumptionRouter } from './routes/consumption.routes.js';
import { managementRouter } from './routes/management.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  api.use('/auth', authRouter);

  // Tudo abaixo exige autenticação
  api.use(authenticate);
  api.use(bootstrapRouter);
  api.use(consumptionRouter);
  api.use(alertsRouter);
  api.use(managementRouter);
  api.use(adminRouter);

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
