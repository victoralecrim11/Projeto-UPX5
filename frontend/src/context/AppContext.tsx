import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
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
import { api, ApiError, setUnauthorizedHandler, tokenStorage } from '../lib/api';

interface BootstrapPayload {
  user: User;
  demoMode: boolean;
  referenceDate: string;
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
  thresholds: ThresholdConfig;
  users: User[];
  auditLogs: AuditLog[];
}

interface AuthResponse {
  token: string;
  user: User;
}

export interface MutationResult {
  success: boolean;
  message: string;
}

interface AppContextType {
  // Navigation & Route
  currentRoute: string;
  selectedAlertId: string | null;
  navigateTo: (route: string, alertId?: string) => void;

  // Auth & RBAC
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<MutationResult>;
  logout: () => void;
  switchUserRole: (role: UserRole) => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  isTwoFactorOpen: boolean;
  setIsTwoFactorOpen: (open: boolean) => void;

  // API state
  isLoading: boolean;
  errorMessage: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;

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
  users: User[];
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
  }) => Promise<MutationResult & { alertGenerated?: boolean }>;
  updateRecord: (id: string, updated: Partial<ConsumptionRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;

  treatAlert: (
    alertId: string,
    treatment: {
      observation: string;
      action: string;
      user?: string;
    }
  ) => Promise<void>;
  markAlertViewed: (alertId: string) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  addGoal: (goal: Omit<EnergyGoal, 'id' | 'organizationId'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<EnergyGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addTariff: (tariff: Omit<EnergyTariff, 'id' | 'organizationId'>) => Promise<void>;
  updateTariff: (id: string, tariff: Partial<EnergyTariff>) => Promise<void>;
  deleteTariff: (id: string) => Promise<void>;

  addPoint: (point: Omit<MeasurementPoint, 'id' | 'createdAt'>) => Promise<void>;
  updatePoint: (id: string, point: Partial<MeasurementPoint>) => Promise<void>;

  addAutomation: (rule: Omit<AutomationRule, 'id' | 'organizationId' | 'createdAt'>) => Promise<void>;
  toggleAutomation: (id: string) => Promise<void>;

  addUser: (user: { name: string; email: string; role: UserRole; password?: string }) => Promise<MutationResult>;
  toggleUserActive: (id: string) => Promise<void>;

  updateThresholds: (thresholds: ThresholdConfig) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_REFERENCE_DATE = '2026-09-29T23:59:59.000Z';

const emptyOrganization: Organization = {
  id: '',
  name: '',
  code: '',
  address: '',
  createdAt: '',
  status: 'ATIVA',
};

const defaultThresholds: ThresholdConfig = {
  mediumThresholdPercent: 20,
  highThresholdPercent: 40,
  minHistoryDays: 7,
};

const defaultFilters: FilterState = {
  periodDays: 30,
  unitId: 'ALL',
  pointId: 'ALL',
  origin: 'ALL',
};

const errorText = (err: unknown) =>
  err instanceof ApiError || err instanceof Error ? err.message : 'Erro inesperado.';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTwoFactorOpen, setIsTwoFactorOpen] = useState(false);

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(() => !!tokenStorage.get());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceDate, setReferenceDate] = useState(DEFAULT_REFERENCE_DATE);

  // Entities State (espelho do backend)
  const [organization, setOrganization] = useState<Organization>(emptyOrganization);
  const [units, setUnits] = useState<Unit[]>([]);
  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [tariffs, setTariffs] = useState<EnergyTariff[]>([]);
  const [goals, setGoals] = useState<EnergyGoal[]>([]);
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [alerts, setAlerts] = useState<EnergyAlert[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(defaultThresholds);

  // Global Filters
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const resetFilters = () => setFilters(defaultFilters);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setCurrentUser(null);
    setCurrentRoute('login');
  }, []);

  const applyBootstrap = (data: BootstrapPayload) => {
    setCurrentUser(data.user);
    setReferenceDate(data.referenceDate || DEFAULT_REFERENCE_DATE);
    setOrganization(data.organization);
    setUnits(data.units);
    setPoints(data.points);
    setTariffs(data.tariffs);
    setGoals(data.goals);
    setRecords(data.records);
    setAlerts(data.alerts);
    setRecommendations(data.recommendations);
    setAutomations(data.automations);
    setAutomationLogs(data.automationLogs);
    setNotifications(data.notifications);
    setAuditLogs(data.auditLogs);
    setUsers(data.users);
    setThresholds(data.thresholds);
  };

  /** Recarrega todas as coleções a partir da API. */
  const refresh = useCallback(async () => {
    const data = await api.get<BootstrapPayload>('/bootstrap');
    applyBootstrap(data);
  }, []);

  // Sessão expirada → volta para o login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setErrorMessage('Sua sessão expirou. Faça login novamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Restaura a sessão salva ao abrir o app
  useEffect(() => {
    if (!tokenStorage.get()) return;
    refresh()
      .catch((err) => setErrorMessage(errorText(err)))
      .finally(() => setIsLoading(false));
  }, [refresh]);

  /** Executa uma mutação na API e sincroniza o estado; erros viram mensagem global. */
  const mutate = async (call: () => Promise<unknown>) => {
    try {
      await call();
      await refresh();
    } catch (err) {
      setErrorMessage(errorText(err));
    }
  };

  // Navigation Handler
  const navigateTo = (route: string, alertId?: string) => {
    if (alertId) {
      setSelectedAlertId(alertId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth & RBAC
  const startSession = async ({ token }: AuthResponse) => {
    tokenStorage.set(token);
    setIsLoading(true);
    try {
      await refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<MutationResult> => {
    try {
      await startSession(await api.post<AuthResponse>('/auth/login', { email, password }));
      setCurrentRoute('dashboard');
      return { success: true, message: 'Login realizado.' };
    } catch (err) {
      return { success: false, message: errorText(err) };
    }
  };

  const logout = () => clearSession();

  const switchUserRole = async (role: UserRole) => {
    try {
      await startSession(await api.post<AuthResponse>('/auth/switch-role', { role }));
    } catch (err) {
      setErrorMessage(errorText(err));
    }
  };

  const hasPermission = (allowedRoles: UserRole[]) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    const now = new Date(referenceDate);
    const cutoff = new Date(now.getTime() - filters.periodDays * 24 * 60 * 60 * 1000);
    const unitByPoint = new Map(points.map((p) => [p.id, p.unitId]));
    const useCustomRange = filters.periodDays === 0 && filters.customStartDate && filters.customEndDate;
    const start = useCustomRange ? new Date(filters.customStartDate!) : null;
    const end = useCustomRange ? new Date(filters.customEndDate!) : null;

    return records.filter((r) => {
      const time = new Date(r.timestamp);
      const matchesDate = start && end
        ? time >= start && time <= end
        : filters.periodDays === 0 || time >= cutoff;
      const matchesOrigin = filters.origin === 'ALL' || r.origin === filters.origin;
      const matchesUnit = filters.unitId === 'ALL' || unitByPoint.get(r.pointId) === filters.unitId;
      const matchesPoint = filters.pointId === 'ALL' || r.pointId === filters.pointId;
      return matchesDate && matchesOrigin && matchesUnit && matchesPoint;
    });
  }, [records, filters, points, referenceDate]);

  // Actions
  const addManualRecord: AppContextType['addManualRecord'] = async (data) => {
    try {
      const result = await api.post<{ message: string; alertGenerated: boolean }>('/records', data);
      await refresh();
      return { success: true, message: result.message, alertGenerated: result.alertGenerated };
    } catch (err) {
      return { success: false, message: errorText(err) };
    }
  };

  const updateRecord = (id: string, updated: Partial<ConsumptionRecord>) =>
    mutate(() => api.patch(`/records/${id}`, updated));

  const deleteRecord = (id: string) => mutate(() => api.delete(`/records/${id}`));

  // O usuário responsável é definido pelo token no backend.
  const treatAlert: AppContextType['treatAlert'] = (alertId, { observation, action }) =>
    mutate(() => api.post(`/alerts/${alertId}/treat`, { observation, action }));

  const markAlertViewed = async (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== 'NOVO') return;
    await mutate(() => api.post(`/alerts/${alertId}/view`));
  };

  const markNotificationRead = (id: string) => mutate(() => api.post(`/notifications/${id}/read`));

  const markAllNotificationsRead = () => mutate(() => api.post('/notifications/read-all'));

  const addGoal = (goal: Omit<EnergyGoal, 'id' | 'organizationId'>) =>
    mutate(() => api.post('/goals', goal));

  const updateGoal = (id: string, goal: Partial<EnergyGoal>) =>
    mutate(() => api.patch(`/goals/${id}`, goal));

  const deleteGoal = (id: string) => mutate(() => api.delete(`/goals/${id}`));

  const addTariff = (tariff: Omit<EnergyTariff, 'id' | 'organizationId'>) =>
    mutate(() => api.post('/tariffs', tariff));

  const updateTariff = (id: string, tariff: Partial<EnergyTariff>) =>
    mutate(() => api.patch(`/tariffs/${id}`, tariff));

  const deleteTariff = (id: string) => mutate(() => api.delete(`/tariffs/${id}`));

  const addPoint = (point: Omit<MeasurementPoint, 'id' | 'createdAt'>) =>
    mutate(() => api.post('/points', point));

  const updatePoint = (id: string, point: Partial<MeasurementPoint>) =>
    mutate(() => api.patch(`/points/${id}`, point));

  const addAutomation = (rule: Omit<AutomationRule, 'id' | 'organizationId' | 'createdAt'>) =>
    mutate(() => api.post('/automations', rule));

  const toggleAutomation = (id: string) => mutate(() => api.post(`/automations/${id}/toggle`));

  const addUser: AppContextType['addUser'] = async (user) => {
    try {
      await api.post('/users', user);
      await refresh();
      return { success: true, message: 'Usuário criado.' };
    } catch (err) {
      return { success: false, message: errorText(err) };
    }
  };

  const toggleUserActive = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    await mutate(() => api.patch(`/users/${id}`, { active: !user.active }));
  };

  const updateThresholds = (next: ThresholdConfig) =>
    mutate(() => api.put('/settings/thresholds', next));

  const resetToDefaultData = async () => {
    resetFilters();
    await mutate(() => api.post('/admin/reset'));
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

        isLoading,
        errorMessage,
        clearError: () => setErrorMessage(null),
        refresh,

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
        users,
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

        addUser,
        toggleUserActive,

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
