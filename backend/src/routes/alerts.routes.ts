import { Router } from 'express';
import { db, newId, nowIso, persist } from '../db/store.js';
import { notFound, parseBody } from '../lib/http.js';
import { currentUser, requireRoles } from '../middleware/auth.js';
import { treatAlertSchema } from '../schemas.js';
import { audit } from '../services/audit.js';

export const alertsRouter = Router();

// ---------- Alertas ----------
alertsRouter.get('/alerts', (_req, res) => {
  res.json(db.alerts);
});

alertsRouter.get('/alerts/:id', (req, res) => {
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) throw notFound('Alerta');
  res.json({
    ...alert,
    recommendations: db.recommendations.filter((r) => r.alertId === alert.id),
  });
});

alertsRouter.post('/alerts/:id/view', (req, res) => {
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) throw notFound('Alerta');
  if (alert.status === 'NOVO') {
    alert.status = 'VISUALIZADO';
    alert.timeline.push({
      id: newId('tl'),
      date: nowIso(),
      title: 'Alerta visualizado pelo operador',
      description: 'Aberto para consulta detalhada.',
      user: currentUser(req).name,
    });
    persist();
  }
  res.json(alert);
});

alertsRouter.post('/alerts/:id/treat', requireRoles('ADMIN', 'OPERACAO', 'GESTOR'), (req, res) => {
  const alert = db.alerts.find((a) => a.id === req.params.id);
  if (!alert) throw notFound('Alerta');
  const { observation, action } = parseBody(treatAlertSchema, req.body);
  const user = currentUser(req);
  const previousStatus = alert.status;
  const now = nowIso();

  Object.assign(alert, {
    status: 'TRATADO',
    treatedAt: now,
    treatedBy: user.name,
    treatmentObservation: observation,
    treatmentAction: action,
  });
  alert.timeline.push({
    id: newId('tl'),
    date: now,
    title: 'Alerta marcado como tratado',
    description: `${action}. Observação: ${observation}`,
    user: user.name,
  });

  audit(user, {
    action: 'Tratamento de Alerta de Energia',
    entity: 'EnergyAlert',
    entityId: alert.id,
    oldValue: previousStatus,
    newValue: 'TRATADO',
    details: `Ação registrada: "${action}". Obs: "${observation}".`,
  });
  persist();
  res.json(alert);
});

// ---------- Recomendações (IA explicável) ----------
alertsRouter.get('/recommendations', (_req, res) => {
  res.json(db.recommendations);
});

// ---------- Notificações ----------
alertsRouter.get('/notifications', (_req, res) => {
  res.json(db.notifications);
});

alertsRouter.post('/notifications/read-all', (_req, res) => {
  db.notifications.forEach((n) => (n.read = true));
  persist();
  res.status(204).end();
});

alertsRouter.post('/notifications/:id/read', (req, res) => {
  const notification = db.notifications.find((n) => n.id === req.params.id);
  if (!notification) throw notFound('Notificação');
  notification.read = true;
  persist();
  res.json(notification);
});
