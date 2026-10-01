import {
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
  User,
  ThresholdConfig,
} from '../types/index.js';

export const initialOrganization: Organization = {
  id: 'org-ecoia-01',
  name: 'EcoIA Demo Industries S.A.',
  code: 'ECO-IND-BR',
  address: 'Av. Paulista, 1800 - São Paulo, SP',
  createdAt: '2026-01-15T08:00:00.000Z',
  status: 'ATIVA',
};

export const initialUnits: Unit[] = [
  {
    id: 'unit-matriz',
    organizationId: 'org-ecoia-01',
    name: 'Matriz Operacional',
    location: 'São Paulo - SP',
    manager: 'Carlos Eduardo Mendes',
    status: 'ATIVA',
    description: 'Sede administrativa central e Data Center principal.',
  },
  {
    id: 'unit-industrial',
    organizationId: 'org-ecoia-01',
    name: 'Unidade Industrial',
    location: 'Campinas - SP',
    manager: 'Fernanda Silveira',
    status: 'ATIVA',
    description: 'Parque fabril, usinagem e linhas de montagem contínua.',
  },
  {
    id: 'unit-centroadm',
    organizationId: 'org-ecoia-01',
    name: 'Centro Administrativo',
    location: 'Curitiba - PR',
    manager: 'Mariana Albuquerque',
    status: 'ATIVA',
    description: 'Escritório regional de engenharia e suporte a facilities.',
  },
];

export const initialPoints: MeasurementPoint[] = [
  {
    id: 'pt-clima-a',
    unitId: 'unit-industrial',
    name: 'Climatização - Bloco A',
    meterIdentifier: 'MED-IND-01',
    type: 'CLIMATIZACAO',
    location: 'Bloco A - Prédio de Produção',
    status: 'ATIVO',
    createdAt: '2026-01-20T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5],
      startHour: 7,
      endHour: 19,
    },
  },
  {
    id: 'pt-ilum-prod',
    unitId: 'unit-industrial',
    name: 'Iluminação - Produção',
    meterIdentifier: 'MED-IND-02',
    type: 'ILUMINACAO',
    location: 'Galpão Principal de Manufatura',
    status: 'ATIVO',
    createdAt: '2026-01-20T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5],
      startHour: 6,
      endHour: 22,
    },
  },
  {
    id: 'pt-linha-01',
    unitId: 'unit-industrial',
    name: 'Linha de Produção 01',
    meterIdentifier: 'MED-IND-03',
    type: 'PRODUCAO',
    location: 'Pavilhão Industrial Leste',
    status: 'ATIVO',
    createdAt: '2026-01-20T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5, 6],
      startHour: 6,
      endHour: 22,
    },
  },
  {
    id: 'pt-linha-02',
    unitId: 'unit-industrial',
    name: 'Linha de Produção 02',
    meterIdentifier: 'MED-IND-04',
    type: 'PRODUCAO',
    location: 'Pavilhão Industrial Oeste',
    status: 'ATIVO',
    createdAt: '2026-01-20T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5],
      startHour: 7,
      endHour: 20,
    },
  },
  {
    id: 'pt-datacenter',
    unitId: 'unit-matriz',
    name: 'Data Center Principal',
    meterIdentifier: 'MED-MAT-01',
    type: 'DATA_CENTER',
    location: 'Subsolo Técnico - Matriz',
    status: 'ATIVO',
    createdAt: '2026-01-18T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startHour: 0,
      endHour: 24, // 24/7 continuous
    },
  },
  {
    id: 'pt-subestacao',
    unitId: 'unit-matriz',
    name: 'Subestação Principal',
    meterIdentifier: 'MED-MAT-02',
    type: 'SUBESTACAO',
    location: 'Área Técnica de Entrada de Média Tensão',
    status: 'ATIVO',
    createdAt: '2026-01-18T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startHour: 0,
      endHour: 24,
    },
  },
  {
    id: 'pt-cargas-adm',
    unitId: 'unit-centroadm',
    name: 'Cargas Gerais - Centro Adm',
    meterIdentifier: 'MED-ADM-01',
    type: 'GERAL',
    location: 'Andar Corporativo Curitiba',
    status: 'ATIVO',
    createdAt: '2026-02-01T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5],
      startHour: 8,
      endHour: 18,
    },
  },
  {
    id: 'pt-almoxarifado',
    unitId: 'unit-matriz',
    name: 'Almoxarifado Central (Sem Tarifa Configurada)',
    meterIdentifier: 'MED-MAT-03',
    type: 'GERAL',
    location: 'Pátio de Cargas Matriz',
    status: 'ATIVO',
    createdAt: '2026-02-05T00:00:00.000Z',
    operatingSchedule: {
      weekdays: [1, 2, 3, 4, 5],
      startHour: 8,
      endHour: 18,
    },
    // Intentionally no tariff configured to demonstrate rule RN-017 / CS-011
  },
  {
    id: 'pt-novo-calibracao',
    unitId: 'unit-industrial',
    name: 'Ponto Novo - Em Calibração (<7 dias)',
    meterIdentifier: 'MED-IND-09',
    type: 'PRODUCAO',
    location: 'Novo Laboratório de Testes',
    status: 'ATIVO',
    createdAt: '2026-09-26T00:00:00.000Z',
    hasInsufficientHistory: true, // Demonstrates RN-006: <7 days history
  },
];

export const initialTariffs: EnergyTariff[] = [
  {
    id: 'tariff-industrial',
    organizationId: 'org-ecoia-01',
    name: 'Tarifa Industrial de Média Tensão (A4 Verde)',
    scope: 'UNIDADE',
    targetEntityId: 'unit-industrial',
    ratePerKwh: 0.72,
    currency: 'BRL',
    demandRate: 38.5,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    active: true,
    notes: 'Tarifa horossazonal verde homologada para o parque fabril de Campinas.',
  },
  {
    id: 'tariff-matriz',
    organizationId: 'org-ecoia-01',
    name: 'Tarifa Comercial Matriz SP (B3)',
    scope: 'UNIDADE',
    targetEntityId: 'unit-matriz',
    ratePerKwh: 0.76,
    currency: 'BRL',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    active: true,
    notes: 'Contrato comercial padrão para o prédio corporativo em São Paulo.',
  },
  {
    id: 'tariff-centroadm',
    organizationId: 'org-ecoia-01',
    name: 'Tarifa Regional Sul (Centro Adm)',
    scope: 'UNIDADE',
    targetEntityId: 'unit-centroadm',
    ratePerKwh: 0.68,
    currency: 'BRL',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    active: true,
    notes: 'Concessão regional Copel para escritório Curitiba.',
  },
];

export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    name: 'Ricardo Torres',
    email: 'admin@ecoia.demo',
    role: 'ADMIN',
    organizationId: 'org-ecoia-01',
    active: true,
    lastLogin: '2026-09-29T14:30:00.000Z',
    twoFactorEnabled: true,
  },
  {
    id: 'usr-gestor',
    name: 'Beatriz Carvalho',
    email: 'gestor@ecoia.demo',
    role: 'GESTOR',
    organizationId: 'org-ecoia-01',
    unitId: 'unit-industrial',
    active: true,
    lastLogin: '2026-09-29T11:15:00.000Z',
    twoFactorEnabled: false,
  },
  {
    id: 'usr-operacao',
    name: 'Lucas Prado',
    email: 'operacao@ecoia.demo',
    role: 'OPERACAO',
    organizationId: 'org-ecoia-01',
    unitId: 'unit-industrial',
    active: true,
    lastLogin: '2026-09-29T09:40:00.000Z',
    twoFactorEnabled: false,
  },
  {
    id: 'usr-financeiro',
    name: 'Amanda Rocha',
    email: 'financeiro@ecoia.demo',
    role: 'FINANCEIRO',
    organizationId: 'org-ecoia-01',
    active: true,
    lastLogin: '2026-09-28T16:00:00.000Z',
    twoFactorEnabled: false,
  },
];

export const initialGoals: EnergyGoal[] = [
  {
    id: 'goal-01',
    organizationId: 'org-ecoia-01',
    name: 'Meta Geral Setembro 2026 - Unidade Industrial',
    scope: 'UNIDADE',
    targetEntityId: 'unit-industrial',
    targetKwh: 45000,
    period: 'Setembro 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'ATENCAO',
  },
  {
    id: 'goal-02',
    organizationId: 'org-ecoia-01',
    name: 'Limite Climatização Bloco A',
    scope: 'PONTO',
    targetEntityId: 'pt-clima-a',
    targetKwh: 12000,
    period: 'Setembro 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'EXCEDIDA',
  },
  {
    id: 'goal-03',
    organizationId: 'org-ecoia-01',
    name: 'Meta Corporativa Matriz SP',
    scope: 'UNIDADE',
    targetEntityId: 'unit-matriz',
    targetKwh: 30000,
    period: 'Setembro 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'NO_LIMITE',
  },
  {
    id: 'goal-04',
    organizationId: 'org-ecoia-01',
    name: 'Meta Centro Administrativo Curitiba',
    scope: 'UNIDADE',
    targetEntityId: 'unit-centroadm',
    targetKwh: 8000,
    period: 'Setembro 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'NO_LIMITE',
  },
];

export const initialThresholds: ThresholdConfig = {
  mediumThresholdPercent: 20, // >20%
  highThresholdPercent: 40,   // >40%
  minHistoryDays: 7,          // 7 days
};

/**
 * Deterministically generates 90 days of consumption records
 * Contains:
 * - 1 high anomaly (>40% deviation) on pt-clima-a
 * - 1 medium anomaly (>20% deviation) on pt-linha-01
 * - 1 idle consumption event on pt-ilum-prod outside working hours
 * - 1 point with <7 days history (pt-novo-calibracao)
 * - Mix of SIMULADO and MANUAL origins
 */
export function generateInitialRecords(): ConsumptionRecord[] {
  const records: ConsumptionRecord[] = [];
  const baseDate = new Date('2026-09-29T12:00:00.000Z');

  // Helper deterministic pseudo-sine generator for stable repeatable series
  const getDeterministicVal = (pointId: string, dayOffset: number, baseAvg: number) => {
    // Offset seed by point string hash
    const seed = pointId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const dayFactor = Math.sin((dayOffset + seed) * 0.45);
    const weekCycle = Math.cos((dayOffset % 7) * 0.9);
    const variation = (dayFactor * 0.12 + weekCycle * 0.08) * baseAvg;
    return Math.max(10, Math.round((baseAvg + variation) * 10) / 10);
  };

  const pointProfiles = [
    { id: 'pt-clima-a', base: 410, weekendFactor: 0.15 },
    { id: 'pt-ilum-prod', base: 125, weekendFactor: 0.08 },
    { id: 'pt-linha-01', base: 840, weekendFactor: 0.1 },
    { id: 'pt-linha-02', base: 620, weekendFactor: 0.1 },
    { id: 'pt-datacenter', base: 310, weekendFactor: 0.95 }, // continuous 24/7
    { id: 'pt-subestacao', base: 1650, weekendFactor: 0.35 },
    { id: 'pt-cargas-adm', base: 180, weekendFactor: 0.12 },
    { id: 'pt-almoxarifado', base: 65, weekendFactor: 0.05 },
  ];

  // Generate 90 days history (dayOffset from 90 down to 0)
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const recordTime = new Date(baseDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = recordTime.toISOString();
    const dayOfWeek = recordTime.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    for (const p of pointProfiles) {
      let val = getDeterministicVal(p.id, dayOffset, p.base);

      if (isWeekend) {
        val = Math.round(val * p.weekendFactor * 10) / 10;
      }

      let status: 'NORMAL' | 'ANOMALIA' = 'NORMAL';
      let origin: 'SIMULADO' | 'MANUAL' = 'SIMULADO';

      // 1. Injected High Anomaly: 2 days ago on Climatização - Bloco A (+42.2% above 408 kWh moving average -> 580.0 kWh)
      if (p.id === 'pt-clima-a' && dayOffset === 2) {
        val = 580.0;
        status = 'ANOMALIA';
      }

      // 2. Injected Medium Anomaly: 5 days ago on Linha 01 (+26.1% above 825 kWh -> 1040.0 kWh)
      if (p.id === 'pt-linha-01' && dayOffset === 5) {
        val = 1040.0;
        status = 'ANOMALIA';
      }

      // Some manual entries for demonstration
      if (dayOffset === 10 && p.id === 'pt-cargas-adm') {
        origin = 'MANUAL';
      }

      records.push({
        id: `rec-${p.id}-${dayOffset}`,
        pointId: p.id,
        timestamp: dateStr,
        value: val,
        unitOfMeasure: 'kWh',
        origin,
        status,
        userName: origin === 'MANUAL' ? 'Lucas Prado' : undefined,
        notes: status === 'ANOMALIA' ? 'Leitura validada pelo algoritmo de anomalias.' : undefined,
      });
    }
  }

  // 3. Injected Idle Consumption Record: Sunday at 23:30 outside operating hours on pt-ilum-prod
  const lastSunday = new Date('2026-09-27T23:15:00.000Z');
  records.push({
    id: 'rec-idle-ilum-sunday',
    pointId: 'pt-ilum-prod',
    timestamp: lastSunday.toISOString(),
    value: 145.0, // High consumption on Sunday night
    unitOfMeasure: 'kWh',
    origin: 'SIMULADO',
    status: 'ANOMALIA',
    notes: 'Detecção de carga em horário de fábrica fechada (Domingo, 23:15).',
  });

  // 4. Point with only 3 days history (pt-novo-calibracao) to demonstrate RN-006
  for (let d = 3; d >= 1; d--) {
    const t = new Date(baseDate.getTime() - d * 24 * 60 * 60 * 1000);
    records.push({
      id: `rec-novo-${d}`,
      pointId: 'pt-novo-calibracao',
      timestamp: t.toISOString(),
      value: 75.0 + d * 5,
      unitOfMeasure: 'kWh',
      origin: 'SIMULADO',
      status: 'NORMAL',
      notes: 'Calibração inicial de transdutor.',
    });
  }

  // Sort descending by timestamp
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const initialAlerts: EnergyAlert[] = [
  {
    id: 'alert-01',
    pointId: 'pt-clima-a',
    unitId: 'unit-industrial',
    type: 'CONSUMO_EXCESSIVO',
    criticality: 'ALTA',
    status: 'NOVO',
    title: 'Consumo 42,2% acima da média histórica',
    description:
      'Ponto Climatização - Bloco A registrou consumo expressivamente superior ao padrão esperado dos últimos 7 dias.',
    observedKwh: 580.0,
    referenceKwh: 408.0,
    deviationPercent: 42.2,
    estimatedCost: 417.6, // 580 * 0.72
    tariffRateApplied: 0.72,
    timestamp: '2026-09-27T18:00:00.000Z',
    timeline: [
      {
        id: 'tl-1',
        date: '2026-09-27T18:00:00.000Z',
        title: 'Alerta gerado automaticamente pela EcoIA',
        description: 'Desvio de 42,2% detectado em relação à média móvel de 7 dias (408,0 kWh).',
      },
    ],
  },
  {
    id: 'alert-02',
    pointId: 'pt-linha-01',
    unitId: 'unit-industrial',
    type: 'CONSUMO_EXCESSIVO',
    criticality: 'MEDIA',
    status: 'VISUALIZADO',
    title: 'Consumo 26,1% acima da média móvel',
    description:
      'Linha de Produção 01 apresentou sobreconsumo durante turno da tarde, excedendo o limiar configurado de 20%.',
    observedKwh: 1040.0,
    referenceKwh: 825.0,
    deviationPercent: 26.1,
    estimatedCost: 748.8, // 1040 * 0.72
    tariffRateApplied: 0.72,
    timestamp: '2026-09-24T17:30:00.000Z',
    timeline: [
      {
        id: 'tl-2',
        date: '2026-09-24T17:30:00.000Z',
        title: 'Alerta gerado automaticamente pela EcoIA',
        description: 'Desvio de 26,1% identificado em relação à média de 825,0 kWh.',
      },
      {
        id: 'tl-3',
        date: '2026-09-24T18:15:00.000Z',
        title: 'Alerta visualizado',
        description: 'Visualizado no painel de monitoramento.',
        user: 'Lucas Prado (Operação)',
      },
      {
        id: 'tl-4',
        date: '2026-09-25T08:00:00.000Z',
        title: 'Investigação iniciada',
        description: 'Verificação em campo programada para conferência dos inversores de frequência.',
        user: 'Fernanda Silveira (Gestora)',
      },
    ],
  },
  {
    id: 'alert-03',
    pointId: 'pt-ilum-prod',
    unitId: 'unit-industrial',
    type: 'CONSUMO_OCIOSO',
    criticality: 'ALTA',
    status: 'TRATADO',
    title: 'Possível consumo ocioso fora da janela de operação',
    description:
      'Carga contínua de 145,0 kWh registrada em Domingo às 23:15, fora do horário de funcionamento cadastrado (06:00 às 22:00 de Seg a Sex).',
    observedKwh: 145.0,
    referenceKwh: 15.0, // expected standby
    deviationPercent: 866.7,
    estimatedCost: 104.4, // 145 * 0.72
    tariffRateApplied: 0.72,
    timestamp: '2026-09-27T23:15:00.000Z',
    treatedAt: '2026-09-28T07:45:00.000Z',
    treatedBy: 'Lucas Prado (Operação)',
    treatmentObservation:
      'Constatado que a iluminação de serviço dos setores 3 e 4 do galpão permaneceu acesa após manutenção preventiva no sábado. Procedida a conferência e reorientação da equipe de limpeza e segurança.',
    treatmentAction: 'Inspeção física realizada e ajuste de rotina de encerramento de turno.',
    timeline: [
      {
        id: 'tl-5',
        date: '2026-09-27T23:15:00.000Z',
        title: 'Alerta de consumo ocioso gerado',
        description: 'Carga ativa fora da janela de operação (Domingo 23:15).',
      },
      {
        id: 'tl-6',
        date: '2026-09-28T07:20:00.000Z',
        title: 'Visualizado pela equipe de plantão',
        description: 'Identificado durante checagem matinal de abertura.',
        user: 'Lucas Prado',
      },
      {
        id: 'tl-7',
        date: '2026-09-28T07:30:00.000Z',
        title: 'Investigação em campo realizada',
        description: 'Confirmado conjunto de luminárias esquecidas acesas.',
        user: 'Lucas Prado',
      },
      {
        id: 'tl-8',
        date: '2026-09-28T07:45:00.000Z',
        title: 'Alerta marcado como tratado',
        description: 'Ocorrência encerrada e registrada no log de auditoria.',
        user: 'Lucas Prado',
      },
    ],
  },
];

export const initialRecommendations: AIRecommendation[] = [
  {
    id: 'rec-ai-01',
    alertId: 'alert-01',
    category: 'Investigação de Carga e Operação',
    reason: 'Consumo observado 42,2% acima do comportamento histórico dos últimos 7 dias.',
    evidence:
      'Média de referência dos últimos 7 dias: 408,0 kWh. Consumo observado: 580,0 kWh. Desvio absoluto: +172,0 kWh. Limiar configurado: 40,0%.',
    suggestedAction:
      'Verifique se houve alteração operacional no período, cargas de compressores que permaneceram ligadas além do horário esperado ou possível obstrução no circuito de condensação.',
    disclaimer:
      'Esta recomendação apoia a investigação e não representa diagnóstico definitivo.',
  },
  {
    id: 'rec-ai-02',
    alertId: 'alert-02',
    category: 'Variação de Turno e Eficiência',
    reason: 'Desvio intermediário relevante (>20%) em linha industrial contínua.',
    evidence:
      'Média de referência: 825,0 kWh. Consumo observado: 1040,0 kWh. Desvio percentual: +26,1%.',
    suggestedAction:
      'Avaliar se o lote produtivo demandou maior velocidade mecânica ou se houve motores elétricos operando em vazio por tempo prolongado.',
    disclaimer:
      'Esta recomendação apoia a investigação e não representa diagnóstico definitivo.',
  },
  {
    id: 'rec-ai-03',
    alertId: 'alert-03',
    category: 'Consumo Fora da Janela Programada',
    reason: 'Consumo detectado em dia/horário classificado como sem expediente ou produção.',
    evidence:
      'Janela operacional cadastrada: Segunda a Sexta, 06:00 às 22:00. Registro efetuado em Domingo às 23:15 com 145,0 kWh (standby esperado <15 kWh).',
    suggestedAction:
      'Inspecione os quadros de distribuição setoriais para identificar circuitos de iluminação mantidos ligados sem necessidade durante o período não operacional.',
    disclaimer:
      'Esta recomendação apoia a investigação e não representa diagnóstico definitivo.',
  },
];

export const initialAutomations: AutomationRule[] = [
  {
    id: 'auto-01',
    organizationId: 'org-ecoia-01',
    name: 'Alerta Imediato para Desvios Críticos (>40%)',
    condition: 'DESVIO_MAIOR_QUE',
    thresholdPercent: 40,
    scope: 'ORGANIZACAO',
    digitalAction: 'NOTIFICAR_GESTOR',
    recipients: ['gestor@ecoia.demo', 'operacao@ecoia.demo'],
    active: true,
    createdAt: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'auto-02',
    organizationId: 'org-ecoia-01',
    name: 'Notificação de Consumo Ocioso Fora de Expediente',
    condition: 'CONSUMO_OCIOSO',
    scope: 'UNIDADE',
    targetId: 'unit-industrial',
    digitalAction: 'CRIAR_OCORRENCIA',
    recipients: ['operacao@ecoia.demo'],
    active: true,
    createdAt: '2026-02-12T14:30:00.000Z',
  },
  {
    id: 'auto-03',
    organizationId: 'org-ecoia-01',
    name: 'Geração de Relatório quando Meta Exceder 90%',
    condition: 'META_ATINGIDA',
    thresholdPercent: 90,
    scope: 'ORGANIZACAO',
    digitalAction: 'GERAR_RELATORIO',
    recipients: ['admin@ecoia.demo', 'financeiro@ecoia.demo'],
    active: true,
    createdAt: '2026-02-15T09:00:00.000Z',
  },
];

export const initialAutomationLogs: AutomationLog[] = [
  {
    id: 'log-01',
    ruleId: 'auto-01',
    ruleName: 'Alerta Imediato para Desvios Críticos (>40%)',
    alertId: 'alert-01',
    executedAt: '2026-09-27T18:01:00.000Z',
    result: 'SUCESSO',
    details: 'Notificação digital registrada para gestor@ecoia.demo sobre desvio de 42,2% na Climatização.',
  },
  {
    id: 'log-02',
    ruleId: 'auto-02',
    ruleName: 'Notificação de Consumo Ocioso Fora de Expediente',
    alertId: 'alert-03',
    executedAt: '2026-09-27T23:16:00.000Z',
    result: 'SUCESSO',
    details: 'Ocorrência digital ECO-OC-2026-09 aberta para investigação do consumo de 145 kWh em horário ocioso.',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-01',
    alertId: 'alert-01',
    title: 'Consumo excessivo crítico detectado',
    message: 'Climatização - Bloco A registrou 580,0 kWh (42,2% acima da referência de 408,0 kWh).',
    pointName: 'Climatização - Bloco A',
    deviationPercent: 42.2,
    read: false,
    timestamp: '2026-09-27T18:00:00.000Z',
    type: 'ALERTA',
  },
  {
    id: 'notif-02',
    alertId: 'alert-02',
    title: 'Desvio de consumo relevante',
    message: 'Linha de Produção 01 excedeu o limiar configurado em 26,1%.',
    pointName: 'Linha de Produção 01',
    deviationPercent: 26.1,
    read: false,
    timestamp: '2026-09-24T17:30:00.000Z',
    type: 'ALERTA',
  },
  {
    id: 'notif-03',
    alertId: 'alert-03',
    title: 'Consumo ocioso fora de horário',
    message: 'Iluminação - Produção registrou 145,0 kWh em horário não operacional.',
    pointName: 'Iluminação - Produção',
    read: true,
    timestamp: '2026-09-27T23:15:00.000Z',
    type: 'ALERTA',
  },
  {
    id: 'notif-04',
    title: 'Alerta de Meta: Atenção (87,1%)',
    message: 'A Unidade Industrial atingiu 87,1% da meta mensal prevista para Setembro 2026.',
    read: true,
    timestamp: '2026-09-26T10:00:00.000Z',
    type: 'META',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-01',
    organizationId: 'org-ecoia-01',
    timestamp: '2026-09-28T07:45:00.000Z',
    userName: 'Lucas Prado',
    userRole: 'OPERACAO',
    action: 'Tratamento de Alerta de Energia',
    entity: 'EnergyAlert',
    entityId: 'alert-03',
    oldValue: 'NOVO',
    newValue: 'TRATADO',
    details: 'Registrada ação de inspeção física em iluminação e desligamento manual.',
  },
  {
    id: 'aud-02',
    organizationId: 'org-ecoia-01',
    timestamp: '2026-09-20T11:20:00.000Z',
    userName: 'Ricardo Torres',
    userRole: 'ADMIN',
    action: 'Atualização de Limiar de Anomalia',
    entity: 'ThresholdConfig',
    entityId: 'global-threshold',
    oldValue: 'Médio: 25%, Alto: 50%',
    newValue: 'Médio: 20%, Alto: 40%',
    details: 'Ajuste de sensibilidade estatística para auditoria energética Q3/Q4.',
  },
  {
    id: 'aud-03',
    organizationId: 'org-ecoia-01',
    timestamp: '2026-09-15T09:30:00.000Z',
    userName: 'Amanda Rocha',
    userRole: 'FINANCEIRO',
    action: 'Atualização de Parâmetro Tarifário',
    entity: 'EnergyTariff',
    entityId: 'tariff-industrial',
    oldValue: 'R$ 0,69 / kWh',
    newValue: 'R$ 0,72 / kWh',
    details: 'Reajuste tarifário anual da concessionária local.',
  },
  {
    id: 'aud-04',
    organizationId: 'org-ecoia-01',
    timestamp: '2026-09-10T14:15:00.000Z',
    userName: 'Lucas Prado',
    userRole: 'OPERACAO',
    action: 'Inserção Manual de Registro de Consumo',
    entity: 'ConsumptionRecord',
    entityId: 'rec-pt-cargas-adm-10',
    newValue: '185,0 kWh',
    details: 'Lançamento manual referente à leitura física do relógio do Centro Adm.',
  },
];
