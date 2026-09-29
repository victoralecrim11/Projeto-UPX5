import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  UserRole,
  Organization,
  Unit,
  MeasurementPoint,
  ConsumptionRecord,
  EnergyGoal,
  EnergyAlert,
  AIRecommendation,
  AutomationRule,
  AutomationLog,
  EnergyTariff,
  NotificationItem,
  AuditLog,
  ThresholdConfig,
  FilterState,
} from '../types';
import {
  initialOrganization,
  initialUnits,
  initialPoints,
  initialTariffs,
  initialUsers,
  initialGoals,
  initialThresholds,
  initialAlerts,
  initialRecommendations,
  initialAutomations,
  initialAutomationLogs,
  initialNotifications,
  initialAuditLogs,
  generateInitialRecords,
} from '../data/fixtures';
import {
  calculateMovingAverage,
  calculateDeviation,
  evaluateIdleConsumption,
  classifyConsumption,
  calculateEstimatedCost,
} from '../lib/calculations';

interface AppContextType {
  // Navigation & Route
  currentRoute: string;
  selectedAlertId: string | null;
  navigateTo: (route: string, alertId?: string) => void;

  // Auth & RBAC
  currentUser: User | null;
  login: (email: string, pass?: string) => boolean;
  logout: () => void;
  switchUserRole: (role: UserRole) => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  isTwoFactorOpen: boolean;
  setIsTwoFactorOpen: (open: boolean) => void;

  // Entities
  organization: Organization;
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

  // Filters
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredRecords: ConsumptionRecord[];

  // Mutations
  addManualRecord: (data: {
    pointId: string;
    value: number;
    timestamp: string;
    notes?: string;
  }) => { success: boolean; message: string; alertGenerated?: boolean };
  updateRecord: (id: string, updated: Partial<ConsumptionRecord>) => void;
  deleteRecord: (id: string) => void;

  treatAlert: (
    alertId: string,
    treatment: {
      observation: string;
      action: string;
      user: string;
    }
  ) => void;
  markAlertViewed: (alertId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  addGoal: (goal: Omit<EnergyGoal, 'id' | 'organizationId'>) => void;
  updateGoal: (id: string, goal: Partial<EnergyGoal>) => void;
  deleteGoal: (id: string) => void;

  addTariff: (tariff: Omit<EnergyTariff, 'id' | 'organizationId'>) => void;
  updateTariff: (id: string, tariff: Partial<EnergyTariff>) => void;
  deleteTariff: (id: string) => void;

  addPoint: (point: Omit<MeasurementPoint, 'id' | 'createdAt'>) => void;
  updatePoint: (id: string, point: Partial<MeasurementPoint>) => void;

  addAutomation: (rule: Omit<AutomationRule, 'id' | 'organizationId' | 'createdAt'>) => void;
  toggleAutomation: (id: string) => void;

  updateThresholds: (thresholds: ThresholdConfig) => void;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'ecoia_mvp_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // fallback
    }
    return initialUsers[0]; // Admin by default
  });

  const [isTwoFactorOpen, setIsTwoFactorOpen] = useState(false);

  // Entities State
  const [organization] = useState<Organization>(initialOrganization);

  const [units, setUnits] = useState<Unit[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}units`);
      return s ? JSON.parse(s) : initialUnits;
    } catch {
      return initialUnits;
    }
  });

  const [points, setPoints] = useState<MeasurementPoint[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}points`);
      return s ? JSON.parse(s) : initialPoints;
    } catch {
      return initialPoints;
    }
  });

  const [tariffs, setTariffs] = useState<EnergyTariff[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}tariffs`);
      return s ? JSON.parse(s) : initialTariffs;
    } catch {
      return initialTariffs;
    }
  });

  const [goals, setGoals] = useState<EnergyGoal[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}goals`);
      return s ? JSON.parse(s) : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [records, setRecords] = useState<ConsumptionRecord[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}records`);
      return s ? JSON.parse(s) : generateInitialRecords();
    } catch {
      return generateInitialRecords();
    }
  });

  const [alerts, setAlerts] = useState<EnergyAlert[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}alerts`);
      return s ? JSON.parse(s) : initialAlerts;
    } catch {
      return initialAlerts;
    }
  });

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}recommendations`);
      return s ? JSON.parse(s) : initialRecommendations;
    } catch {
      return initialRecommendations;
    }
  });

  const [automations, setAutomations] = useState<AutomationRule[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}automations`);
      return s ? JSON.parse(s) : initialAutomations;
    } catch {
      return initialAutomations;
    }
  });

  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}automationLogs`);
      return s ? JSON.parse(s) : initialAutomationLogs;
    } catch {
      return initialAutomationLogs;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
      return s ? JSON.parse(s) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}auditLogs`);
      return s ? JSON.parse(s) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}thresholds`);
      return s ? JSON.parse(s) : initialThresholds;
    } catch {
      return initialThresholds;
    }
  });

  // Global Filters
  const [filters, setFilters] = useState<FilterState>({
    periodDays: 30,
    unitId: 'ALL',
    pointId: 'ALL',
    origin: 'ALL',
  });

  const resetFilters = () => {
    setFilters({
      periodDays: 30,
      unitId: 'ALL',
      pointId: 'ALL',
      origin: 'ALL',
    });
  };

  // Sync to local storage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}records`, JSON.stringify(records));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}alerts`, JSON.stringify(alerts));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}recommendations`, JSON.stringify(recommendations));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}auditLogs`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}points`, JSON.stringify(points));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}units`, JSON.stringify(units));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}tariffs`, JSON.stringify(tariffs));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}goals`, JSON.stringify(goals));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}automations`, JSON.stringify(automations));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}automationLogs`, JSON.stringify(automationLogs));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}thresholds`, JSON.stringify(thresholds));
    } catch {
      // ignore storage quota issues
    }
  }, [
    records,
    alerts,
    recommendations,
    notifications,
    auditLogs,
    points,
    units,
    tariffs,
    goals,
    automations,
    automationLogs,
    thresholds,
  ]);

  // Navigation Handler
  const navigateTo = (route: string, alertId?: string) => {
    if (alertId) {
      setSelectedAlertId(alertId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth & RBAC
  const login = (email: string) => {
    const found = initialUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setCurrentRoute('dashboard');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRoute('login');
  };

  const switchUserRole = (role: UserRole) => {
    const target = initialUsers.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      // Log switch
      const logItem: AuditLog = {
        id: `aud-${Date.now()}`,
        organizationId: organization.id,
        timestamp: new Date().toISOString(),
        userName: target.name,
        userRole: target.role,
        action: 'Troca de Perfil de Usuário',
        entity: 'UserSession',
        entityId: target.id,
        details: `Sessão alterada para o perfil ${target.role} (${target.name}).`,
      };
      setAuditLogs((prev) => [logItem, ...prev]);
    }
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    const now = new Date('2026-09-29T23:59:59.000Z');
    let cutoff = new Date(now.getTime() - filters.periodDays * 24 * 60 * 60 * 1000);

    if (filters.periodDays === 0 && filters.customStartDate && filters.customEndDate) {
      const start = new Date(filters.customStartDate);
      const end = new Date(filters.customEndDate);
      return records.filter((r) => {
        const time = new Date(r.timestamp);
        const matchesDate = time >= start && time <= end;
        const matchesOrigin = filters.origin === 'ALL' || r.origin === filters.origin;

        const point = points.find((p) => p.id === r.pointId);
        const matchesUnit = filters.unitId === 'ALL' || (point && point.unitId === filters.unitId);
        const matchesPoint = filters.pointId === 'ALL' || r.pointId === filters.pointId;

        return matchesDate && matchesOrigin && matchesUnit && matchesPoint;
      });
    }

    return records.filter((r) => {
      const time = new Date(r.timestamp);
      const matchesPeriod = filters.periodDays === 0 ? true : time >= cutoff;
      const matchesOrigin = filters.origin === 'ALL' || r.origin === filters.origin;

      const point = points.find((p) => p.id === r.pointId);
      const matchesUnit = filters.unitId === 'ALL' || (point && point.unitId === filters.unitId);
      const matchesPoint = filters.pointId === 'ALL' || r.pointId === filters.pointId;

      return matchesPeriod && matchesOrigin && matchesUnit && matchesPoint;
    });
  }, [records, filters, points]);

  // Actions
  const addManualRecord = (data: {
    pointId: string;
    value: number;
    timestamp: string;
    notes?: string;
  }) => {
    // 1. Validations per RN-004 & RNF-012
    if (data.value < 0) {
      return { success: false, message: 'O valor do consumo não pode ser negativo.' };
    }
    const recordDate = new Date(data.timestamp);
    if (isNaN(recordDate.getTime())) {
      return { success: false, message: 'Data ou hora do registro inválida.' };
    }
    if (recordDate > new Date('2026-09-29T23:59:59.000Z')) {
      return { success: false, message: 'Não é permitido registrar leituras com datas futuras.' };
    }

    const targetPoint = points.find((p) => p.id === data.pointId);
    if (!targetPoint) {
      return { success: false, message: 'Ponto de medição não encontrado.' };
    }
    if (targetPoint.status === 'INATIVO') {
      return { success: false, message: 'Não é permitido lançar registros em pontos inativos.' };
    }

    // 2. Statistical Analysis using Business Rules
    const pointRecords = records.filter((r) => r.pointId === data.pointId);
    const movingAvg = calculateMovingAverage(pointRecords, thresholds.minHistoryDays, data.timestamp);
    const isIdle = evaluateIdleConsumption(data.timestamp, targetPoint, data.value);
    const historyDaysCount = targetPoint.hasInsufficientHistory ? 3 : pointRecords.length;

    const classification = classifyConsumption(
      data.value,
      movingAvg,
      historyDaysCount,
      thresholds,
      isIdle
    );

    const isAnomaly =
      classification.classification === 'EXCESSO_MEDIO' ||
      classification.classification === 'EXCESSO_ALTO' ||
      classification.classification === 'OCIOSO';

    const newRecordId = `rec-${Date.now()}`;
    const newRecord: ConsumptionRecord = {
      id: newRecordId,
      pointId: data.pointId,
      timestamp: data.timestamp,
      value: data.value,
      unitOfMeasure: 'kWh',
      origin: 'MANUAL',
      userId: currentUser?.id,
      userName: currentUser?.name || 'Usuário',
      notes: data.notes,
      status: isAnomaly ? 'ANOMALIA' : 'NORMAL',
    };

    // Find applicable tariff
    const applicableTariff = tariffs.find(
      (t) =>
        t.active &&
        (t.targetEntityId === targetPoint.unitId ||
          t.targetEntityId === targetPoint.id ||
          t.scope === 'ORGANIZACAO')
    );

    let alertGenerated = false;

    // 3. Create Alert if anomaly detected (RN-015, RN-020)
    if (isAnomaly) {
      alertGenerated = true;
      const alertId = `alert-${Date.now()}`;
      const criticality =
        classification.classification === 'EXCESSO_ALTO' || classification.classification === 'OCIOSO'
          ? 'ALTA'
          : 'MEDIA';

      const costCalc = calculateEstimatedCost(
        data.value,
        applicableTariff ? applicableTariff.ratePerKwh : null
      );

      const newAlert: EnergyAlert = {
        id: alertId,
        pointId: targetPoint.id,
        unitId: targetPoint.unitId,
        recordId: newRecordId,
        type:
          classification.classification === 'OCIOSO' ? 'CONSUMO_OCIOSO' : 'CONSUMO_EXCESSIVO',
        criticality,
        status: 'NOVO',
        title:
          classification.classification === 'OCIOSO'
            ? 'Consumo ocioso fora da janela operacional'
            : `Consumo ${classification.deviationPercent ? classification.deviationPercent.toFixed(1) : ''}% acima do esperado`,
        description: classification.explanation,
        observedKwh: data.value,
        referenceKwh: movingAvg || (isIdle ? 15 : data.value),
        deviationPercent: classification.deviationPercent || 0,
        estimatedCost: costCalc.estimatedTotal,
        tariffRateApplied: applicableTariff?.ratePerKwh || null,
        timestamp: data.timestamp,
        timeline: [
          {
            id: `tl-${Date.now()}-1`,
            date: new Date().toISOString(),
            title: 'Alerta gerado automaticamente pelo motor de regras',
            description: classification.explanation,
          },
        ],
      };

      // 4. Create AI Recommendation (RN-009, RN-010, Section 16 & 27)
      const newRec: AIRecommendation = {
        id: `rec-ai-${Date.now()}`,
        alertId,
        category:
          classification.classification === 'OCIOSO'
            ? 'Carga em Período Não Operacional'
            : 'Investigação de Sobreconsumo de Carga',
        reason: classification.explanation,
        evidence: `Consumo observado: ${data.value.toFixed(1)} kWh. Referência histórica calculada: ${
          movingAvg ? movingAvg.toFixed(1) + ' kWh' : '15 kWh (Standby esperado)'
        }. Limiar aplicado: ${
          criticality === 'ALTA' ? thresholds.highThresholdPercent : thresholds.mediumThresholdPercent
        }%.`,
        suggestedAction:
          classification.classification === 'OCIOSO'
            ? 'Verifique se equipamentos foram deixados ligados inadvertidamente após o término do turno ou se houve manutenção não programada.'
            : 'Inspecione o ponto de medição para identificar acionamentos fora de regime, motores travados ou alterações no ciclo operacional.',
        disclaimer: 'Esta recomendação apoia a investigação e não representa diagnóstico definitivo.',
      };

      // 5. Create Notification (RN-020, RN-029)
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        alertId,
        title:
          criticality === 'ALTA'
            ? 'Alerta Crítico: Consumo Excessivo'
            : 'Alerta de Consumo: Atenção Necessária',
        message: `${targetPoint.name}: ${data.value.toFixed(1)} kWh registrado. ${classification.explanation}`,
        pointName: targetPoint.name,
        deviationPercent: classification.deviationPercent || 0,
        read: false,
        timestamp: new Date().toISOString(),
        type: 'ALERTA',
      };

      // 6. Check matching digital automation rules (RN-011, RN-020)
      const matchingAutomations = automations.filter(
        (a) =>
          a.active &&
          ((a.condition === 'DESVIO_MAIOR_QUE' &&
            classification.deviationPercent !== null &&
            classification.deviationPercent >= (a.thresholdPercent || 20)) ||
            (a.condition === 'CONSUMO_OCIOSO' && classification.classification === 'OCIOSO'))
      );

      const newLogs: AutomationLog[] = matchingAutomations.map((a) => ({
        id: `log-${Date.now()}-${a.id}`,
        ruleId: a.id,
        ruleName: a.name,
        alertId,
        executedAt: new Date().toISOString(),
        result: 'SUCESSO',
        details: `Regra digital disparou ação "${a.digitalAction}" para os destinatários: ${a.recipients.join(
          ', '
        )}.`,
      }));

      setAlerts((prev) => [newAlert, ...prev]);
      setRecommendations((prev) => [newRec, ...prev]);
      setNotifications((prev) => [newNotif, ...prev]);
      if (newLogs.length > 0) {
        setAutomationLogs((prev) => [...newLogs, ...prev]);
      }
    }

    // Save record
    setRecords((prev) => [newRecord, ...prev]);

    // Audit log (RN-015, RNF-008)
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Usuário',
      userRole: currentUser?.role || 'OPERACAO',
      action: 'Lançamento Manual de Consumo',
      entity: 'ConsumptionRecord',
      entityId: newRecordId,
      newValue: `${data.value.toFixed(1)} kWh em ${targetPoint.name}`,
      details: alertGenerated
        ? 'Registro manual salvo com anomalia detectada e alerta gerado automaticamente.'
        : 'Registro manual salvo dentro da normalidade operacional.',
    };
    setAuditLogs((prev) => [audit, ...prev]);

    return {
      success: true,
      message: alertGenerated
        ? 'Registro manual salvo com sucesso! Atenção: foi identificado desvio relevante e um alerta foi gerado.'
        : 'Registro manual salvo com sucesso.',
      alertGenerated,
    };
  };

  const updateRecord = (id: string, updated: Partial<ConsumptionRecord>) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Edição de Registro de Consumo',
      entity: 'ConsumptionRecord',
      entityId: id,
      oldValue: `${existing.value} kWh`,
      newValue: updated.value !== undefined ? `${updated.value} kWh` : undefined,
      details: 'Registro de consumo alterado manualmente.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const deleteRecord = (id: string) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    setRecords((prev) => prev.filter((r) => r.id !== id));

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Exclusão de Registro de Consumo',
      entity: 'ConsumptionRecord',
      entityId: id,
      oldValue: `${existing.value} kWh (${existing.origin})`,
      details: 'Registro de consumo excluído da base de dados.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const treatAlert = (
    alertId: string,
    treatment: {
      observation: string;
      action: string;
      user: string;
    }
  ) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          const nowStr = new Date().toISOString();
          const newTimelineItem = {
            id: `tl-${Date.now()}`,
            date: nowStr,
            title: 'Alerta marcado como tratado',
            description: `${treatment.action}. Observação: ${treatment.observation}`,
            user: treatment.user,
          };
          return {
            ...a,
            status: 'TRATADO',
            treatedAt: nowStr,
            treatedBy: treatment.user,
            treatmentObservation: treatment.observation,
            treatmentAction: treatment.action,
            timeline: [...a.timeline, newTimelineItem],
          };
        }
        return a;
      })
    );

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: treatment.user,
      userRole: currentUser?.role || 'OPERACAO',
      action: 'Tratamento de Alerta de Energia',
      entity: 'EnergyAlert',
      entityId: alertId,
      oldValue: 'NOVO / VISUALIZADO',
      newValue: 'TRATADO',
      details: `Ação registrada: "${treatment.action}". Obs: "${treatment.observation}".`,
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const markAlertViewed = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId && a.status === 'NOVO') {
          return {
            ...a,
            status: 'VISUALIZADO',
            timeline: [
              ...a.timeline,
              {
                id: `tl-${Date.now()}`,
                date: new Date().toISOString(),
                title: 'Alerta visualizado pelo operador',
                description: 'Aberto para consulta detalhada.',
                user: currentUser?.name,
              },
            ],
          };
        }
        return a;
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addGoal = (goalData: Omit<EnergyGoal, 'id' | 'organizationId'>) => {
    const newGoal: EnergyGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      organizationId: organization.id,
    };
    setGoals((prev) => [newGoal, ...prev]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Criação de Meta de Energia',
      entity: 'EnergyGoal',
      entityId: newGoal.id,
      newValue: `${newGoal.name}: ${newGoal.targetKwh} kWh`,
      details: 'Nova meta cadastrada para monitoramento de eficiência energética.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updateGoal = (id: string, goalData: Partial<EnergyGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goalData } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addTariff = (tariffData: Omit<EnergyTariff, 'id' | 'organizationId'>) => {
    const newTariff: EnergyTariff = {
      ...tariffData,
      id: `tariff-${Date.now()}`,
      organizationId: organization.id,
    };
    setTariffs((prev) => [newTariff, ...prev]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Configuração de Nova Tarifa',
      entity: 'EnergyTariff',
      entityId: newTariff.id,
      newValue: `R$ ${newTariff.ratePerKwh.toFixed(2)}/kWh (${newTariff.name})`,
      details: 'Parâmetro tarifário cadastrado para estimativa de gastos.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updateTariff = (id: string, tariffData: Partial<EnergyTariff>) => {
    const old = tariffs.find((t) => t.id === id);
    setTariffs((prev) => prev.map((t) => (t.id === id ? { ...t, ...tariffData } : t)));

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Alteração de Parâmetro Tarifário',
      entity: 'EnergyTariff',
      entityId: id,
      oldValue: old ? `R$ ${old.ratePerKwh.toFixed(2)}/kWh` : undefined,
      newValue: tariffData.ratePerKwh !== undefined ? `R$ ${tariffData.ratePerKwh.toFixed(2)}/kWh` : undefined,
      details: 'Tarifa reajustada no sistema.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const deleteTariff = (id: string) => {
    setTariffs((prev) => prev.filter((t) => t.id !== id));
  };

  const addPoint = (pointData: Omit<MeasurementPoint, 'id' | 'createdAt'>) => {
    const newPoint: MeasurementPoint = {
      ...pointData,
      id: `pt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPoints((prev) => [...prev, newPoint]);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Cadastro de Ponto de Medição',
      entity: 'MeasurementPoint',
      entityId: newPoint.id,
      newValue: `${newPoint.name} (${newPoint.meterIdentifier})`,
      details: 'Ponto de medição ativado para recebimento de registros.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updatePoint = (id: string, pointData: Partial<MeasurementPoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...pointData } : p)));
  };

  const addAutomation = (
    ruleData: Omit<AutomationRule, 'id' | 'organizationId' | 'createdAt'>
  ) => {
    const newRule: AutomationRule = {
      ...ruleData,
      id: `auto-${Date.now()}`,
      organizationId: organization.id,
      createdAt: new Date().toISOString(),
    };
    setAutomations((prev) => [...prev, newRule]);
  };

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const updateThresholds = (newThresholds: ThresholdConfig) => {
    const old = thresholds;
    setThresholds(newThresholds);

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Administrador',
      userRole: currentUser?.role || 'ADMIN',
      action: 'Atualização de Limiares de Anomalia',
      entity: 'ThresholdConfig',
      entityId: 'global-thresholds',
      oldValue: `Médio: ${old.mediumThresholdPercent}%, Alto: ${old.highThresholdPercent}%`,
      newValue: `Médio: ${newThresholds.mediumThresholdPercent}%, Alto: ${newThresholds.highThresholdPercent}%`,
      details: 'Parâmetros estatísticos de desvio atualizados pelo usuário.',
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setRecords(generateInitialRecords());
    setAlerts(initialAlerts);
    setRecommendations(initialRecommendations);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setPoints(initialPoints);
    setUnits(initialUnits);
    setTariffs(initialTariffs);
    setGoals(initialGoals);
    setAutomations(initialAutomations);
    setAutomationLogs(initialAutomationLogs);
    setThresholds(initialThresholds);
    resetFilters();
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        selectedAlertId,
        navigateTo,

        currentUser,
        login,
        logout,
        switchUserRole,
        hasPermission,
        isTwoFactorOpen,
        setIsTwoFactorOpen,

        organization,
        units,
        points,
        tariffs,
        goals,
        records,
        alerts,
        recommendations,
        automations,
        automationLogs,
        notifications,
        auditLogs,
        thresholds,

        filters,
        setFilters,
        resetFilters,
        filteredRecords,

        addManualRecord,
        updateRecord,
        deleteRecord,

        treatAlert,
        markAlertViewed,

        markNotificationRead,
        markAllNotificationsRead,

        addGoal,
        updateGoal,
        deleteGoal,

        addTariff,
        updateTariff,
        deleteTariff,

        addPoint,
        updatePoint,

        addAutomation,
        toggleAutomation,

        updateThresholds,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
