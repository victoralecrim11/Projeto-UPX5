export type UserRole = 'ADMIN' | 'GESTOR' | 'OPERACAO' | 'FINANCEIRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  unitId?: string;
  active: boolean;
  avatarUrl?: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  address: string;
  createdAt: string;
  status: 'ATIVA' | 'INATIVA';
}

export interface Unit {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  manager: string;
  status: 'ATIVA' | 'INATIVA';
  description?: string;
}

export type PointType = 'CLIMATIZACAO' | 'ILUMINACAO' | 'PRODUCAO' | 'DATA_CENTER' | 'SUBESTACAO' | 'GERAL';

export interface OperatingSchedule {
  weekdays: number[]; // 1=Segunda, 5=Sexta, 6=Sábado, 0=Domingo
  startHour: number; // Ex: 8
  endHour: number;   // Ex: 18
}

export interface MeasurementPoint {
  id: string;
  unitId: string;
  name: string;
  meterIdentifier: string; // Ex: MED-IND-01
  type: PointType;
  location: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  operatingSchedule?: OperatingSchedule;
  hasInsufficientHistory?: boolean; // For demonstration of RN-006 (<7 days)
}

export type RecordOrigin = 'MANUAL' | 'SIMULADO' | 'SENSOR';

export interface ConsumptionRecord {
  id: string;
  pointId: string;
  timestamp: string; // ISO string
  value: number; // in kWh
  unitOfMeasure: 'kWh';
  origin: RecordOrigin;
  userId?: string;
  userName?: string;
  notes?: string;
  status: 'NORMAL' | 'ANOMALIA';
}

export type GoalScope = 'ORGANIZACAO' | 'UNIDADE' | 'PONTO';

export interface EnergyGoal {
  id: string;
  organizationId: string;
  name: string;
  scope: GoalScope;
  targetEntityId?: string; // unitId or pointId
  targetKwh: number;
  period: string; // Ex: "Outubro 2026", "Q4 2026"
  startDate: string;
  endDate: string;
  status: 'NO_LIMITE' | 'ATENCAO' | 'EXCEDIDA';
}

export type AnalysisResult =
  | 'NORMAL'
  | 'EXCESSO_MEDIO'
  | 'EXCESSO_ALTO'
  | 'OCIOSO'
  | 'HISTORICO_INSUFICIENTE';

export interface ConsumptionAnalysis {
  id: string;
  pointId: string;
  recordId: string;
  referencePeriod: string;
  movingAverage7d: number | null;
  deviationPercent: number | null;
  thresholdApplied: number;
  result: AnalysisResult;
  processedAt: string;
  explanation: string;
}

export type AlertType = 'CONSUMO_EXCESSIVO' | 'CONSUMO_OCIOSO';
export type AlertCriticality = 'MEDIA' | 'ALTA';
export type AlertStatus = 'NOVO' | 'VISUALIZADO' | 'TRATADO';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  user?: string;
}

export interface EnergyAlert {
  id: string;
  pointId: string;
  unitId: string;
  recordId?: string;
  analysisId?: string;
  type: AlertType;
  criticality: AlertCriticality;
  status: AlertStatus;
  title: string;
  description: string;
  observedKwh: number;
  referenceKwh: number;
  deviationPercent: number;
  estimatedCost: number | null;
  tariffRateApplied: number | null;
  timestamp: string;
  treatedAt?: string;
  treatedBy?: string;
  treatmentObservation?: string;
  treatmentAction?: string;
  timeline: TimelineEvent[];
}

export interface AIRecommendation {
  id: string;
  alertId: string;
  category: string;
  reason: string;
  evidence: string;
  suggestedAction: string;
  disclaimer: string;
}

export type AutomationCondition = 'DESVIO_MAIOR_QUE' | 'CONSUMO_OCIOSO' | 'META_ATINGIDA';
export type AutomationAction =
  | 'NOTIFICAR_GESTOR'
  | 'CRIAR_OCORRENCIA'
  | 'GERAR_RELATORIO'
  | 'ALTERAR_STATUS_ALERTA';

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  condition: AutomationCondition;
  thresholdPercent?: number;
  scope: 'ORGANIZACAO' | 'UNIDADE' | 'PONTO';
  targetId?: string;
  digitalAction: AutomationAction;
  recipients: string[];
  active: boolean;
  createdAt: string;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  alertId?: string;
  executedAt: string;
  result: 'SUCESSO' | 'AVISO';
  details: string;
}

export interface EnergyTariff {
  id: string;
  organizationId: string;
  name: string;
  scope: 'ORGANIZACAO' | 'UNIDADE' | 'PONTO';
  targetEntityId?: string;
  ratePerKwh: number; // R$/kWh
  currency: 'BRL';
  demandRate?: number; // R$/kW if applicable
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  notes?: string;
}

export interface EstimatedCostCalculation {
  consumptionKwh: number;
  tariffRate: number | null;
  estimatedTotal: number | null;
  hasTariff: boolean;
  tariffName?: string;
  disclaimer: string;
}

export interface NotificationItem {
  id: string;
  alertId?: string;
  title: string;
  message: string;
  pointName?: string;
  deviationPercent?: number;
  read: boolean;
  timestamp: string;
  type: 'ALERTA' | 'META' | 'SISTEMA';
}

export interface AuditLog {
  id: string;
  organizationId: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface ThresholdConfig {
  mediumThresholdPercent: number; // default: 20
  highThresholdPercent: number;   // default: 40
  minHistoryDays: number;          // default: 7
}

export interface FilterState {
  periodDays: number; // 7, 30, 90, 0=custom
  customStartDate?: string;
  customEndDate?: string;
  unitId: string; // 'ALL' or specific unitId
  pointId: string; // 'ALL' or specific pointId
  origin: string; // 'ALL' | 'MANUAL' | 'SIMULADO' | 'SENSOR'
}
