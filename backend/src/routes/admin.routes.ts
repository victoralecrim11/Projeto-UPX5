import { Router } from 'express';
import { config } from '../config.js';
import { db, newId, persist, resetDatabase, toPublicUser, type StoredUser } from '../db/store.js';
import { HttpError, notFound, parseBody } from '../lib/http.js';
import { hashPassword } from '../lib/password.js';
import { currentUser, requireRoles } from '../middleware/auth.js';
import { thresholdsSchema, userCreateSchema, userUpdateSchema } from '../schemas.js';
import { audit } from '../services/audit.js';

export const adminRouter = Router();

// ---------- Usuários ----------
adminRouter.get('/users', requireRoles('ADMIN'), (_req, res) => {
  res.json(db.users.map(toPublicUser));
});

adminRouter.post('/users', requireRoles('ADMIN'), (req, res) => {
  const { password, ...data } = parseBody(userCreateSchema, req.body);
  if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new HttpError(409, 'Já existe um usuário com este e-mail.');
  }
  const user: StoredUser = {
    ...data,
    id: newId('usr'),
    organizationId: db.organization.id,
    active: true,
    passwordHash: hashPassword(password ?? config.demoPassword),
  };
  db.users.push(user);
  audit(currentUser(req), {
    action: 'Cadastro de Usuário',
    entity: 'User',
    entityId: user.id,
    newValue: `${user.name} <${user.email}> (${user.role})`,
  });
  persist();
  res.status(201).json(toPublicUser(user));
});

adminRouter.patch('/users/:id', requireRoles('ADMIN'), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) throw notFound('Usuário');
  const { password, ...data } = parseBody(userUpdateSchema, req.body);
  if (user.id === currentUser(req).id && data.active === false) {
    throw new HttpError(422, 'Você não pode desativar o próprio usuário.');
  }
  Object.assign(user, data);
  if (password) user.passwordHash = hashPassword(password);
  audit(currentUser(req), {
    action: 'Alteração de Usuário',
    entity: 'User',
    entityId: user.id,
    newValue: JSON.stringify(data),
  });
  persist();
  res.json(toPublicUser(user));
});

// ---------- Auditoria ----------
adminRouter.get('/audit-logs', requireRoles('ADMIN'), (_req, res) => {
  res.json(db.auditLogs);
});

// ---------- Configurações ----------
adminRouter.get('/settings/thresholds', (_req, res) => {
  res.json(db.thresholds);
});

adminRouter.put('/settings/thresholds', requireRoles('ADMIN'), (req, res) => {
  const next = parseBody(thresholdsSchema, req.body);
  const old = db.thresholds;
  db.thresholds = next;
  audit(currentUser(req), {
    action: 'Atualização de Limiares de Anomalia',
    entity: 'ThresholdConfig',
    entityId: 'global-thresholds',
    oldValue: `Médio: ${old.mediumThresholdPercent}%, Alto: ${old.highThresholdPercent}%`,
    newValue: `Médio: ${next.mediumThresholdPercent}%, Alto: ${next.highThresholdPercent}%`,
    details: 'Parâmetros estatísticos de desvio atualizados pelo usuário.',
  });
  persist();
  res.json(db.thresholds);
});

/** Restaura o conjunto de dados de demonstração (somente no modo demonstração). */
adminRouter.post('/admin/reset', (_req, res) => {
  if (!config.demoMode) {
    throw new HttpError(403, 'Restauração disponível apenas no modo demonstração.');
  }
  resetDatabase();
  res.status(204).end();
});
