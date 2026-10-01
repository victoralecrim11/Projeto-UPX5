import { referenceNow } from '../config.js';
import { db, newId, nowIso, persist, type StoredUser } from '../db/store.js';
import {
  calculateEstimatedCost,
  calculateMovingAverage,
  classifyConsumption,
  evaluateIdleConsumption,
} from '../domain/calculations.js';
import { HttpError, notFound } from '../lib/http.js';
import type {
  AIRecommendation,
  AutomationLog,
  ConsumptionRecord,
  EnergyAlert,
  NotificationItem,
} from '../types/index.js';
import { audit } from './audit.js';

export interface ManualRecordInput {
  pointId: string;
  value: number;
  timestamp: string;
  notes?: string;
}

export interface ManualRecordResult {
  message: string;
  alertGenerated: boolean;
  record: ConsumptionRecord;
  alert?: EnergyAlert;
}

/**
 * Lança uma medição manual e roda o motor de regras:
 * média móvel de 7 dias, consumo ocioso, alerta, recomendação, notificação e automações.
 */
export function addManualRecord(user: StoredUser, data: ManualRecordInput): ManualRecordResult {
  // 1. Validações (RN-004, RNF-012)
  if (data.value < 0) {
    throw new HttpError(422, 'O valor do consumo não pode ser negativo.');
  }
  const recordDate = new Date(data.timestamp);
  if (isNaN(recordDate.getTime())) {
    throw new HttpError(422, 'Data ou hora do registro inválida.');
  }
  if (recordDate > referenceNow()) {
    throw new HttpError(422, 'Não é permitido registrar leituras com datas futuras.');
  }

  const targetPoint = db.points.find((p) => p.id === data.pointId);
  if (!targetPoint) throw notFound('Ponto de medição');
  if (targetPoint.status === 'INATIVO') {
    throw new HttpError(422, 'Não é permitido lançar registros em pontos inativos.');
  }

  // 2. Análise estatística
  const { thresholds } = db;
  const pointRecords = db.records.filter((r) => r.pointId === data.pointId);
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

  const record: ConsumptionRecord = {
    id: newId('rec'),
    pointId: data.pointId,
    timestamp: data.timestamp,
    value: data.value,
    unitOfMeasure: 'kWh',
    origin: 'MANUAL',
    userId: user.id,
    userName: user.name,
    notes: data.notes,
    status: isAnomaly ? 'ANOMALIA' : 'NORMAL',
  };

  const applicableTariff = db.tariffs.find(
    (t) =>
      t.active &&
      (t.targetEntityId === targetPoint.unitId ||
        t.targetEntityId === targetPoint.id ||
        t.scope === 'ORGANIZACAO')
  );

  let alert: EnergyAlert | undefined;

  // 3. Alerta automático (RN-015, RN-020)
  if (isAnomaly) {
    const isIdleAlert = classification.classification === 'OCIOSO';
    const criticality =
      classification.classification === 'EXCESSO_ALTO' || isIdleAlert ? 'ALTA' : 'MEDIA';
    const costCalc = calculateEstimatedCost(data.value, applicableTariff?.ratePerKwh ?? null);

    alert = {
      id: newId('alert'),
      pointId: targetPoint.id,
      unitId: targetPoint.unitId,
      recordId: record.id,
      type: isIdleAlert ? 'CONSUMO_OCIOSO' : 'CONSUMO_EXCESSIVO',
      criticality,
      status: 'NOVO',
      title: isIdleAlert
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
          id: newId('tl'),
          date: nowIso(),
          title: 'Alerta gerado automaticamente pelo motor de regras',
          description: classification.explanation,
        },
      ],
    };

    // 4. Recomendação explicável (RN-009, RN-010)
    const recommendation: AIRecommendation = {
      id: newId('rec-ai'),
      alertId: alert.id,
      category: isIdleAlert
        ? 'Carga em Período Não Operacional'
        : 'Investigação de Sobreconsumo de Carga',
      reason: classification.explanation,
      evidence: `Consumo observado: ${data.value.toFixed(1)} kWh. Referência histórica calculada: ${
        movingAvg ? movingAvg.toFixed(1) + ' kWh' : '15 kWh (Standby esperado)'
      }. Limiar aplicado: ${
        criticality === 'ALTA' ? thresholds.highThresholdPercent : thresholds.mediumThresholdPercent
      }%.`,
      suggestedAction: isIdleAlert
        ? 'Verifique se equipamentos foram deixados ligados inadvertidamente após o término do turno ou se houve manutenção não programada.'
        : 'Inspecione o ponto de medição para identificar acionamentos fora de regime, motores travados ou alterações no ciclo operacional.',
      disclaimer: 'Esta recomendação apoia a investigação e não representa diagnóstico definitivo.',
    };

    // 5. Notificação (RN-020, RN-029)
    const notification: NotificationItem = {
      id: newId('notif'),
      alertId: alert.id,
      title:
        criticality === 'ALTA'
          ? 'Alerta Crítico: Consumo Excessivo'
          : 'Alerta de Consumo: Atenção Necessária',
      message: `${targetPoint.name}: ${data.value.toFixed(1)} kWh registrado. ${classification.explanation}`,
      pointName: targetPoint.name,
      deviationPercent: classification.deviationPercent || 0,
      read: false,
      timestamp: nowIso(),
      type: 'ALERTA',
    };

    // 6. Regras de automação digital (RN-011, RN-020)
    const alertId = alert.id;
    const automationLogs: AutomationLog[] = db.automations
      .filter(
        (a) =>
          a.active &&
          ((a.condition === 'DESVIO_MAIOR_QUE' &&
            classification.deviationPercent !== null &&
            classification.deviationPercent >= (a.thresholdPercent || 20)) ||
            (a.condition === 'CONSUMO_OCIOSO' && isIdleAlert))
      )
      .map((a) => ({
        id: newId('log'),
        ruleId: a.id,
        ruleName: a.name,
        alertId,
        executedAt: nowIso(),
        result: 'SUCESSO',
        details: `Regra digital disparou ação "${a.digitalAction}" para os destinatários: ${a.recipients.join(', ')}.`,
      }));

    db.alerts.unshift(alert);
    db.recommendations.unshift(recommendation);
    db.notifications.unshift(notification);
    db.automationLogs.unshift(...automationLogs);
  }

  db.records.unshift(record);

  audit(user, {
    action: 'Lançamento Manual de Consumo',
    entity: 'ConsumptionRecord',
    entityId: record.id,
    newValue: `${data.value.toFixed(1)} kWh em ${targetPoint.name}`,
    details: isAnomaly
      ? 'Registro manual salvo com anomalia detectada e alerta gerado automaticamente.'
      : 'Registro manual salvo dentro da normalidade operacional.',
  });
  persist();

  return {
    message: isAnomaly
      ? 'Registro manual salvo com sucesso! Atenção: foi identificado desvio relevante e um alerta foi gerado.'
      : 'Registro manual salvo com sucesso.',
    alertGenerated: isAnomaly,
    record,
    alert,
  };
}
