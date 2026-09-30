import {
  ConsumptionRecord,
  MeasurementPoint,
  AnalysisResult,
  ThresholdConfig,
  EstimatedCostCalculation,
} from '../types';

/**
 * Calculates simple moving average over a specified number of days (default: 7)
 * Requires records sorted chronologically.
 */
export function calculateMovingAverage(
  records: ConsumptionRecord[],
  windowDays: number = 7,
  referenceDate?: string
): number | null {
  if (!records || records.length === 0) return null;

  const refTime = referenceDate ? new Date(referenceDate).getTime() : new Date().getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Filter records within the preceding window (excluding future and current moment)
  const windowRecords = records.filter((r) => {
    const rTime = new Date(r.timestamp).getTime();
    return rTime < refTime && rTime >= refTime - windowMs;
  });

  if (windowRecords.length === 0) {
    // If not enough by time, check count of previous records
    const priorRecords = records.filter(
      (r) => new Date(r.timestamp).getTime() <= refTime
    );
    if (priorRecords.length < windowDays) return null;
    const slice = priorRecords.slice(-windowDays);
    const sum = slice.reduce((acc, curr) => acc + curr.value, 0);
    return sum / slice.length;
  }

  const sum = windowRecords.reduce((acc, curr) => acc + curr.value, 0);
  return sum / windowRecords.length;
}

/**
 * Calculates percentage deviation: ((observed - baseline) / baseline) * 100
 */
export function calculateDeviation(observed: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return ((observed - baseline) / baseline) * 100;
}

/**
 * Evaluates if a given timestamp and point represents idle consumption (outside operating hours)
 */
export function evaluateIdleConsumption(
  timestamp: string,
  point: MeasurementPoint,
  kwhValue: number
): boolean {
  if (!point.operatingSchedule) return false;
  if (kwhValue <= 5) return false; // Minimal baseline standby is acceptable

  const date = new Date(timestamp);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = date.getHours();

  const isOperatingDay = point.operatingSchedule.weekdays.includes(dayOfWeek);
  const isOperatingHour =
    hour >= point.operatingSchedule.startHour && hour < point.operatingSchedule.endHour;

  // If outside operating days or outside operating hours, and consuming significant power (>15 kWh)
  const isOutsideWindow = !isOperatingDay || !isOperatingHour;
  return isOutsideWindow && kwhValue > 15;
}

/**
 * Classifies a consumption observation based on statistics and business rules
 */
export function classifyConsumption(
  observedKwh: number,
  movingAvg: number | null,
  historyDaysCount: number,
  thresholds: ThresholdConfig,
  isIdle: boolean = false
): {
  classification: AnalysisResult;
  deviationPercent: number | null;
  explanation: string;
} {
  if (isIdle) {
    return {
      classification: 'OCIOSO',
      deviationPercent: movingAvg ? calculateDeviation(observedKwh, movingAvg) : null,
      explanation:
        'Possível consumo ocioso detectado: carga expressiva registrada fora da janela de operação esperada.',
    };
  }

  if (historyDaysCount < thresholds.minHistoryDays || movingAvg === null) {
    return {
      classification: 'HISTORICO_INSUFICIENTE',
      deviationPercent: null,
      explanation: `Histórico insuficiente para análise automática (mínimo de ${thresholds.minHistoryDays} dias de medição contínua requerido).`,
    };
  }

  const deviation = calculateDeviation(observedKwh, movingAvg);

  if (deviation >= thresholds.highThresholdPercent) {
    return {
      classification: 'EXCESSO_ALTO',
      deviationPercent: deviation,
      explanation: `Consumo ${deviation.toFixed(1)}% acima da média dos últimos ${thresholds.minHistoryDays} dias (${movingAvg.toFixed(1)} kWh), ultrapassando o limiar de alta criticidade (${thresholds.highThresholdPercent}%).`,
    };
  }

  if (deviation >= thresholds.mediumThresholdPercent) {
    return {
      classification: 'EXCESSO_MEDIO',
      deviationPercent: deviation,
      explanation: `Consumo ${deviation.toFixed(1)}% acima da média dos últimos ${thresholds.minHistoryDays} dias (${movingAvg.toFixed(1)} kWh), ultrapassando o limiar configurado de ${thresholds.mediumThresholdPercent}%.`,
    };
  }

  return {
    classification: 'NORMAL',
    deviationPercent: deviation,
    explanation: 'Consumo dentro dos parâmetros e limiares estatísticos normais de operação.',
  };
}

/**
 * Estimates energy cost using the applicable tariff rate
 */
export function calculateEstimatedCost(
  kwh: number,
  tariffRate: number | null | undefined,
  tariffName?: string
): EstimatedCostCalculation {
  const disclaimer =
    'Valor calculado utilizando a tarifa configurada. Não representa cobrança oficial ou fatura contábil.';

  if (tariffRate === null || tariffRate === undefined || tariffRate <= 0) {
    return {
      consumptionKwh: kwh,
      tariffRate: null,
      estimatedTotal: null,
      hasTariff: false,
      disclaimer: 'Gasto não calculado: nenhuma tarifa ativa vinculada a este ponto/unidade.',
    };
  }

  return {
    consumptionKwh: kwh,
    tariffRate,
    estimatedTotal: kwh * tariffRate,
    hasTariff: true,
    tariffName,
    disclaimer,
  };
}

export function formatNumber(
  value: number | undefined | null,
  minDecimals: number = 0,
  maxDecimals: number = 1
): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

/**
 * Formats a kWh number into readable pt-BR representation
 */
export function formatKwh(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0 kWh';
  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value)} kWh`;
}

/**
 * Formats currency in BRL with standard formatting
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats percentage
 */
export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0,0%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)}%`;
}

/**
 * Formats date and time
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Formats short date
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(d);
  } catch {
    return isoString;
  }
}
