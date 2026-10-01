/**
 * Tests for EcoIA Pure Calculation and Rule Functions
 * Corresponds to Section 23, 45, and PRD BDD Scenarios (Cenários 3, 4, 9, 10)
 */
import {
  calculateMovingAverage,
  calculateDeviation,
  classifyConsumption,
  calculateEstimatedCost,
  evaluateIdleConsumption,
} from './calculations.js';
import { ConsumptionRecord, MeasurementPoint, ThresholdConfig } from '../types/index.js';

const defaultThresholds: ThresholdConfig = {
  mediumThresholdPercent: 20,
  highThresholdPercent: 40,
  minHistoryDays: 7,
};

describe('EcoIA Statistical and Business Rules', () => {
  // Test 1: Deviation Calculation
  test('calculateDeviation computes percentage difference correctly', () => {
    // 580 kWh vs 408 kWh moving average
    const dev = calculateDeviation(580, 408);
    expect(dev).toBeCloseTo(42.15, 1);

    // Below average
    const devLower = calculateDeviation(300, 400);
    expect(devLower).toBe(-25);
  });

  // Test 2: Classification with Normal Consumption
  test('classifyConsumption returns NORMAL when within thresholds', () => {
    const res = classifyConsumption(410, 400, 10, defaultThresholds, false);
    expect(res.classification).toBe('NORMAL');
  });

  // Test 3: Classification with Medium Excess (>20%)
  test('classifyConsumption classifies medium anomaly when >20%', () => {
    // 25% deviation
    const res = classifyConsumption(500, 400, 10, defaultThresholds, false);
    expect(res.classification).toBe('EXCESSO_MEDIO');
    expect(res.deviationPercent).toBe(25);
  });

  // Test 4: Classification with High Excess (>40%)
  test('classifyConsumption classifies high anomaly when >40%', () => {
    // 50% deviation
    const res = classifyConsumption(600, 400, 10, defaultThresholds, false);
    expect(res.classification).toBe('EXCESSO_ALTO');
    expect(res.deviationPercent).toBe(50);
  });

  // Test 5: Insufficient History (< 7 days) - RN-006
  test('classifyConsumption flags HISTORICO_INSUFICIENTE when history is less than minHistoryDays', () => {
    const res = classifyConsumption(600, 400, 5, defaultThresholds, false);
    expect(res.classification).toBe('HISTORICO_INSUFICIENTE');
    expect(res.deviationPercent).toBeNull();
    expect(res.explanation).toContain('Histórico insuficiente');
  });

  // Test 6: Idle Consumption (outside operating window) - RN-010, RN-019
  test('classifyConsumption classifies OCIOSO when idle flag is true', () => {
    const res = classifyConsumption(150, 400, 10, defaultThresholds, true);
    expect(res.classification).toBe('OCIOSO');
  });

  // Test 7: Cost Calculation with Tariff
  test('calculateEstimatedCost calculates cost when tariff exists', () => {
    const cost = calculateEstimatedCost(1000, 0.72, 'Tarifa Industrial');
    expect(cost.hasTariff).toBe(true);
    expect(cost.estimatedTotal).toBe(720);
    expect(cost.disclaimer).toContain('Não representa cobrança oficial');
  });

  // Test 8: Cost Calculation without Tariff - RN-017
  test('calculateEstimatedCost returns null total when tariff is missing', () => {
    const cost = calculateEstimatedCost(1000, null);
    expect(cost.hasTariff).toBe(false);
    expect(cost.estimatedTotal).toBeNull();
  });

  // Test 9: Evaluate Idle Consumption outside window
  test('evaluateIdleConsumption detects active load on Sunday', () => {
    const point: MeasurementPoint = {
      id: 'pt-test',
      unitId: 'unit-1',
      name: 'Iluminação',
      meterIdentifier: 'MED-01',
      type: 'ILUMINACAO',
      location: 'Galpão',
      status: 'ATIVO',
      createdAt: '2026-01-01',
      operatingSchedule: {
        weekdays: [1, 2, 3, 4, 5], // Seg-Sex
        startHour: 8,
        endHour: 18,
      },
    };

    // Sunday (day 0) at 23:00 with 100 kWh
    const sundayIso = '2026-09-27T23:00:00.000Z';
    const isIdle = evaluateIdleConsumption(sundayIso, point, 100);
    expect(isIdle).toBe(true);

    // Wednesday at 10:00 (during operating hours)
    const wednesdayIso = '2026-09-23T10:00:00.000Z';
    const notIdle = evaluateIdleConsumption(wednesdayIso, point, 100);
    expect(notIdle).toBe(false);
  });
});
