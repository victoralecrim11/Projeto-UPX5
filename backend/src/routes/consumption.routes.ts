import { Router } from 'express';
import { db, newId, nowIso, persist } from '../db/store.js';
import { notFound, parseBody } from '../lib/http.js';
import { currentUser, requireRoles } from '../middleware/auth.js';
import { pointCreateSchema, pointUpdateSchema, recordCreateSchema, recordUpdateSchema } from '../schemas.js';
import { audit } from '../services/audit.js';
import { addManualRecord } from '../services/consumption.js';
import type { MeasurementPoint } from '../types/index.js';

export const consumptionRouter = Router();

// ---------- Unidades ----------
consumptionRouter.get('/units', (_req, res) => {
  res.json(db.units);
});

// ---------- Pontos de medição ----------
consumptionRouter.get('/points', (_req, res) => {
  res.json(db.points);
});

consumptionRouter.post('/points', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const data = parseBody(pointCreateSchema, req.body);
  const point: MeasurementPoint = { ...data, id: newId('pt'), createdAt: nowIso() };
  db.points.push(point);
  audit(currentUser(req), {
    action: 'Cadastro de Ponto de Medição',
    entity: 'MeasurementPoint',
    entityId: point.id,
    newValue: `${point.name} (${point.meterIdentifier})`,
    details: 'Ponto de medição ativado para recebimento de registros.',
  });
  persist();
  res.status(201).json(point);
});

consumptionRouter.patch('/points/:id', requireRoles('ADMIN', 'GESTOR'), (req, res) => {
  const point = db.points.find((p) => p.id === req.params.id);
  if (!point) throw notFound('Ponto de medição');
  Object.assign(point, parseBody(pointUpdateSchema, req.body));
  persist();
  res.json(point);
});

// ---------- Registros de consumo ----------
consumptionRouter.get('/records', (req, res) => {
  const { pointId, from, to } = req.query as Record<string, string | undefined>;
  const result = db.records.filter(
    (r) =>
      (!pointId || r.pointId === pointId) &&
      (!from || r.timestamp >= from) &&
      (!to || r.timestamp <= to)
  );
  res.json(result);
});

consumptionRouter.post('/records', requireRoles('ADMIN', 'GESTOR', 'OPERACAO'), (req, res) => {
  const result = addManualRecord(currentUser(req), parseBody(recordCreateSchema, req.body));
  res.status(201).json(result);
});

consumptionRouter.patch('/records/:id', requireRoles('ADMIN', 'OPERACAO'), (req, res) => {
  const record = db.records.find((r) => r.id === req.params.id);
  if (!record) throw notFound('Registro de consumo');
  const updated = parseBody(recordUpdateSchema, req.body);
  const oldValue = record.value;
  Object.assign(record, updated);
  audit(currentUser(req), {
    action: 'Edição de Registro de Consumo',
    entity: 'ConsumptionRecord',
    entityId: record.id,
    oldValue: `${oldValue} kWh`,
    newValue: updated.value !== undefined ? `${updated.value} kWh` : undefined,
    details: 'Registro de consumo alterado manualmente.',
  });
  persist();
  res.json(record);
});

consumptionRouter.delete('/records/:id', requireRoles('ADMIN', 'OPERACAO'), (req, res) => {
  const index = db.records.findIndex((r) => r.id === req.params.id);
  if (index === -1) throw notFound('Registro de consumo');
  const [removed] = db.records.splice(index, 1);
  audit(currentUser(req), {
    action: 'Exclusão de Registro de Consumo',
    entity: 'ConsumptionRecord',
    entityId: removed.id,
    oldValue: `${removed.value} kWh (${removed.origin})`,
    details: 'Registro de consumo excluído da base de dados.',
  });
  persist();
  res.status(204).end();
});
