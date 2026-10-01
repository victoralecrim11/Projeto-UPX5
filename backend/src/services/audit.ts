import { db, newId, nowIso, type StoredUser } from '../db/store.js';
import type { AuditLog } from '../types/index.js';

type AuditInput = Pick<AuditLog, 'action' | 'entity' | 'entityId'> &
  Partial<Pick<AuditLog, 'oldValue' | 'newValue' | 'details'>>;

/** Registra uma entrada na trilha de auditoria (RN-015, RNF-008). Não persiste sozinho. */
export function audit(user: StoredUser, input: AuditInput): AuditLog {
  const entry: AuditLog = {
    id: newId('aud'),
    organizationId: db.organization.id,
    timestamp: nowIso(),
    userName: user.name,
    userRole: user.role,
    ...input,
  };
  db.auditLogs.unshift(entry);
  return entry;
}
