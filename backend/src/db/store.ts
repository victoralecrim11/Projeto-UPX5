import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { hashPassword } from '../lib/password.js';
import {
  AIRecommendation,
  AuditLog,
  AutomationLog,
  AutomationRule,
  ConsumptionRecord,
  EnergyAlert,
  EnergyGoal,
  EnergyTariff,
  MeasurementPoint,
  NotificationItem,
  Organization,
  ThresholdConfig,
  Unit,
  User,
} from '../types/index.js';
import {
  generateInitialRecords,
  initialAlerts,
  initialAuditLogs,
  initialAutomationLogs,
  initialAutomations,
  initialGoals,
  initialNotifications,
  initialOrganization,
  initialPoints,
  initialRecommendations,
  initialTariffs,
  initialThresholds,
  initialUnits,
  initialUsers,
} from './seed.js';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Database {
  organization: Organization;
  users: StoredUser[];
  units: Unit[];
  points: MeasurementPoint[];
  tariffs: EnergyTariff[];
  goals: EnergyGoal[];
  records: ConsumptionRecord[];
  alerts: EnergyAlert[];
  recommendations: AIRecommendation[];
  automations: AutomationRule[];
  automationLogs: AutomationLog[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  thresholds: ThresholdConfig;
}

const clone = <T>(value: T): T => structuredClone(value);

export function buildSeedDatabase(): Database {
  const demoHash = hashPassword(config.demoPassword);
  return {
    organization: clone(initialOrganization),
    users: initialUsers.map((u) => ({ ...clone(u), passwordHash: demoHash })),
    units: clone(initialUnits),
    points: clone(initialPoints),
    tariffs: clone(initialTariffs),
    goals: clone(initialGoals),
    records: generateInitialRecords(),
    alerts: clone(initialAlerts),
    recommendations: clone(initialRecommendations),
    automations: clone(initialAutomations),
    automationLogs: clone(initialAutomationLogs),
    notifications: clone(initialNotifications),
    auditLogs: clone(initialAuditLogs),
    thresholds: clone(initialThresholds),
  };
}

function loadFromDisk(): Database {
  if (fs.existsSync(config.dbFile)) {
    return JSON.parse(fs.readFileSync(config.dbFile, 'utf-8')) as Database;
  }
  const seeded = buildSeedDatabase();
  writeToDisk(seeded);
  return seeded;
}

function writeToDisk(data: Database) {
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  // Escrita atômica: grava em arquivo temporário e renomeia, evitando JSON corrompido.
  const tmp = `${config.dbFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, config.dbFile);
}

/** Banco de dados em memória, persistido em arquivo JSON a cada alteração. */
export const db: Database = loadFromDisk();

export function persist() {
  writeToDisk(db);
}

export function resetDatabase() {
  Object.assign(db, buildSeedDatabase());
  persist();
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function toPublicUser({ passwordHash: _passwordHash, ...user }: StoredUser): User {
  return user;
}
