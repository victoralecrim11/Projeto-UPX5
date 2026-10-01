import { Router } from 'express';
import { config } from '../config.js';
import { db, toPublicUser } from '../db/store.js';
import { currentUser } from '../middleware/auth.js';

export const bootstrapRouter = Router();

/**
 * Carga inicial do frontend: todas as coleções visíveis para o usuário em uma chamada.
 * Usuários e auditoria são retornados apenas para administradores.
 */
bootstrapRouter.get('/bootstrap', (req, res) => {
  const user = currentUser(req);
  const isAdmin = user.role === 'ADMIN';
  res.json({
    user: toPublicUser(user),
    demoMode: config.demoMode,
    referenceDate: config.referenceDate,
    organization: db.organization,
    units: db.units,
    points: db.points,
    tariffs: db.tariffs,
    goals: db.goals,
    records: db.records,
    alerts: db.alerts,
    recommendations: db.recommendations,
    automations: db.automations,
    automationLogs: db.automationLogs,
    notifications: db.notifications,
    thresholds: db.thresholds,
    users: isAdmin ? db.users.map(toPublicUser) : [],
    auditLogs: isAdmin ? db.auditLogs : [],
  });
});
