import { Router } from 'express';
import { db, newId, nowIso, persist } from '../db/store.js';
import { notFound, parseBody } from '../lib/http.js';
import { currentUser, requireRoles } from '../middleware/auth.js';
import {
  automationCreateSchema,
  goalCreateSchema,
  goalUpdateSchema,
  tariffCreateSchema,
  tariffUpdateSchema,
} from '../schemas.js';
import { audit } from '../services/audit.js';
import type { AutomationRule, EnergyGoal, EnergyTariff } from '../types/index.js';

export const managementRouter = Router();

// ---------- Metas ----------
managementRouter.get('/goals', (_req, res) => {
  res.json(db.goals);
});

managementRouter.post('/goals', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const goal: EnergyGoal = {
    ...parseBody(goalCreateSchema, req.body),
    id: newId('goal'),
    organizationId: db.organization.id,
  };
  db.goals.unshift(goal);
  audit(currentUser(req), {
    action: 'Criação de Meta de Energia',
    entity: 'EnergyGoal',
    entityId: goal.id,
    newValue: `${goal.name}: ${goal.targetKwh} kWh`,
    details: 'Nova meta cadastrada para monitoramento de eficiência energética.',
  });
  persist();
  res.status(201).json(goal);
});

managementRouter.patch('/goals/:id', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const goal = db.goals.find((g) => g.id === req.params.id);
  if (!goal) throw notFound('Meta');
  Object.assign(goal, parseBody(goalUpdateSchema, req.body));
  persist();
  res.json(goal);
});

managementRouter.delete('/goals/:id', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const index = db.goals.findIndex((g) => g.id === req.params.id);
  if (index === -1) throw notFound('Meta');
  const [removed] = db.goals.splice(index, 1);
  audit(currentUser(req), {
    action: 'Exclusão de Meta de Energia',
    entity: 'EnergyGoal',
    entityId: removed.id,
    oldValue: `${removed.name}: ${removed.targetKwh} kWh`,
  });
  persist();
  res.status(204).end();
});

// ---------- Tarifas ----------
managementRouter.get('/tariffs', (_req, res) => {
  res.json(db.tariffs);
});

managementRouter.post('/tariffs', requireRoles('ADMIN', 'FINANCEIRO'), (req, res) => {
  const tariff: EnergyTariff = {
    ...parseBody(tariffCreateSchema, req.body),
    id: newId('tariff'),
    organizationId: db.organization.id,
  };
  db.tariffs.unshift(tariff);
  audit(currentUser(req), {
    action: 'Configuração de Nova Tarifa',
    entity: 'EnergyTariff',
    entityId: tariff.id,
    newValue: `R$ ${tariff.ratePerKwh.toFixed(2)}/kWh (${tariff.name})`,
    details: 'Parâmetro tarifário cadastrado para estimativa de gastos.',
  });
  persist();
  res.status(201).json(tariff);
});

managementRouter.patch('/tariffs/:id', requireRoles('ADMIN', 'FINANCEIRO'), (req, res) => {
  const tariff = db.tariffs.find((t) => t.id === req.params.id);
  if (!tariff) throw notFound('Tarifa');
  const updated = parseBody(tariffUpdateSchema, req.body);
  const oldRate = tariff.ratePerKwh;
  Object.assign(tariff, updated);
  audit(currentUser(req), {
    action: 'Alteração de Parâmetro Tarifário',
    entity: 'EnergyTariff',
    entityId: tariff.id,
    oldValue: `R$ ${oldRate.toFixed(2)}/kWh`,
    newValue: updated.ratePerKwh !== undefined ? `R$ ${updated.ratePerKwh.toFixed(2)}/kWh` : undefined,
    details: 'Tarifa reajustada no sistema.',
  });
  persist();
  res.json(tariff);
});

managementRouter.delete('/tariffs/:id', requireRoles('ADMIN', 'FINANCEIRO'), (req, res) => {
  const index = db.tariffs.findIndex((t) => t.id === req.params.id);
  if (index === -1) throw notFound('Tarifa');
  const [removed] = db.tariffs.splice(index, 1);
  audit(currentUser(req), {
    action: 'Exclusão de Tarifa',
    entity: 'EnergyTariff',
    entityId: removed.id,
    oldValue: `R$ ${removed.ratePerKwh.toFixed(2)}/kWh (${removed.name})`,
  });
  persist();
  res.status(204).end();
});

// ---------- Automações ----------
managementRouter.get('/automations', (_req, res) => {
  res.json(db.automations);
});

managementRouter.get('/automations/logs', (_req, res) => {
  res.json(db.automationLogs);
});

managementRouter.post('/automations', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const rule: AutomationRule = {
    ...parseBody(automationCreateSchema, req.body),
    id: newId('auto'),
    organizationId: db.organization.id,
    createdAt: nowIso(),
  };
  db.automations.push(rule);
  audit(currentUser(req), {
    action: 'Criação de Regra de Automação',
    entity: 'AutomationRule',
    entityId: rule.id,
    newValue: rule.name,
  });
  persist();
  res.status(201).json(rule);
});

managementRouter.post('/automations/:id/toggle', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const rule = db.automations.find((a) => a.id === req.params.id);
  if (!rule) throw notFound('Regra de automação');
  rule.active = !rule.active;
  audit(currentUser(req), {
    action: rule.active ? 'Ativação de Regra de Automação' : 'Desativação de Regra de Automação',
    entity: 'AutomationRule',
    entityId: rule.id,
    newValue: rule.active ? 'ATIVA' : 'INATIVA',
  });
  persist();
  res.json(rule);
});
