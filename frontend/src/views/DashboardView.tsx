import React, { useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertOctagon,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Info,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/shared/FilterBar';
import { StatusBadge, SeverityBadge } from '../components/shared/Badges';
import { RecommendationCard } from '../components/shared/RecommendationCard';
import {
  formatKwh,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  calculateEstimatedCost,
  calculateMovingAverage,
} from '../lib/calculations';

export const DashboardView: React.FC = () => {
  const {
    filteredRecords,
    records,
    points,
    units,
    goals,
    alerts,
    tariffs,
    recommendations,
    navigateTo,
    filters,
  } = useApp();

  // 1. KPI: Total Consumption & Comparison with Previous Period
  const { currentTotalKwh, prevTotalKwh, percentChange, absoluteDiff } = useMemo(() => {
    const curSum = filteredRecords.reduce((acc, r) => acc + r.value, 0);

    // Calculate previous period of same duration
    const days = filters.periodDays || 30;
    const now = new Date('2026-09-29T23:59:59.000Z');
    const curStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(curStart.getTime() - days * 24 * 60 * 60 * 1000);

    const prevRecords = records.filter((r) => {
      const t = new Date(r.timestamp);
      const inPrev = t >= prevStart && t < curStart;
      const point = points.find((p) => p.id === r.pointId);
      const matchesUnit = filters.unitId === 'ALL' || (point && point.unitId === filters.unitId);
      const matchesPoint = filters.pointId === 'ALL' || r.pointId === filters.pointId;
      const matchesOrigin = filters.origin === 'ALL' || r.origin === filters.origin;
      return inPrev && matchesUnit && matchesPoint && matchesOrigin;
    });

    const prevSum = prevRecords.reduce((acc, r) => acc + r.value, 0);
    const diff = curSum - prevSum;
    const pct = prevSum > 0 ? (diff / prevSum) * 100 : 0;

    return {
      currentTotalKwh: curSum,
      prevTotalKwh: prevSum,
      percentChange: pct,
      absoluteDiff: diff,
    };
  }, [filteredRecords, records, filters, points]);

  // 2. KPI: Estimated Cost
  const { estimatedTotalCost, hasConfiguredTariff, activeTariffName } = useMemo(() => {
    // If filtering by specific point
    if (filters.pointId !== 'ALL') {
      const point = points.find((p) => p.id === filters.pointId);
      const tariff = tariffs.find(
        (t) =>
          t.active &&
          (t.targetEntityId === point?.id ||
            t.targetEntityId === point?.unitId ||
            t.scope === 'ORGANIZACAO')
      );
      if (!tariff) {
        return { estimatedTotalCost: null, hasConfiguredTariff: false, activeTariffName: '' };
      }
      return {
        estimatedTotalCost: currentTotalKwh * tariff.ratePerKwh,
        hasConfiguredTariff: true,
        activeTariffName: tariff.name,
      };
    }

    // If filtering by unit
    if (filters.unitId !== 'ALL') {
      const tariff = tariffs.find(
        (t) => t.active && (t.targetEntityId === filters.unitId || t.scope === 'ORGANIZACAO')
      );
      if (!tariff) {
        return { estimatedTotalCost: null, hasConfiguredTariff: false, activeTariffName: '' };
      }
      return {
        estimatedTotalCost: currentTotalKwh * tariff.ratePerKwh,
        hasConfiguredTariff: true,
        activeTariffName: tariff.name,
      };
    }

    // Global: Check if any points without tariff
    let total = 0;
    let anyTariffFound = false;

    // Sum weighted by point's unit tariff
    for (const r of filteredRecords) {
      const point = points.find((p) => p.id === r.pointId);
      const tariff = tariffs.find(
        (t) =>
          t.active &&
          (t.targetEntityId === point?.id ||
            t.targetEntityId === point?.unitId ||
            t.scope === 'ORGANIZACAO')
      );
      if (tariff) {
        total += r.value * tariff.ratePerKwh;
        anyTariffFound = true;
      }
    }

    return {
      estimatedTotalCost: anyTariffFound ? total : null,
      hasConfiguredTariff: anyTariffFound,
      activeTariffName: 'Tarifas Regionais Vigentes',
    };
  }, [currentTotalKwh, filteredRecords, filters, points, tariffs]);

  // 3. KPI: Goal of the Period
  const activeGoal = useMemo(() => {
    // If unit filtered, find unit goal; otherwise find first matching goal
    if (filters.unitId !== 'ALL') {
      return goals.find((g) => g.targetEntityId === filters.unitId) || goals[0];
    }
    return goals[0];
  }, [goals, filters.unitId]);

  const goalProgress = useMemo(() => {
    if (!activeGoal) return { pct: 0, target: 45000, current: currentTotalKwh };
    const pct = Math.min(200, (currentTotalKwh / activeGoal.targetKwh) * 100);
    return {
      pct,
      target: activeGoal.targetKwh,
      current: currentTotalKwh,
    };
  }, [activeGoal, currentTotalKwh]);

  // 4. KPI: Active Alerts
  const activeAlerts = useMemo(() => {
    const list = alerts.filter(
      (a) =>
        (a.status === 'NOVO' || a.status === 'VISUALIZADO') &&
        (filters.unitId === 'ALL' || a.unitId === filters.unitId) &&
        (filters.pointId === 'ALL' || a.pointId === filters.pointId)
    );
    const high = list.filter((a) => a.criticality === 'ALTA').length;
    const medium = list.filter((a) => a.criticality === 'MEDIA').length;
    return { total: list.length, high, medium, list };
  }, [alerts, filters]);

  // 5. Chart Data: Daily aggregate time-series with Moving Average & Goal reference
  const chartData = useMemo(() => {
    // Group records by day
    const dayMap = new Map<string, { date: string; consumption: number; count: number }>();

    // Sort ascending for chronology
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((r) => {
      const dayKey = r.timestamp.slice(0, 10);
      const existing = dayMap.get(dayKey) || { date: dayKey, consumption: 0, count: 0 };
      existing.consumption += r.value;
      existing.count += 1;
      dayMap.set(dayKey, existing);
    });

    const dailyPoints = Array.from(dayMap.values());

    // Calculate 7-day rolling average for the daily aggregate
    return dailyPoints.map((item, idx, arr) => {
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = arr.slice(windowStart, idx + 1);
      const avg =
        windowSlice.reduce((acc, curr) => acc + curr.consumption, 0) / windowSlice.length;

      // Daily goal target approximation
      const dailyTarget = activeGoal ? activeGoal.targetKwh / 30 : 1500;

      return {
        date: formatDate(item.date),
        fullDate: item.date,
        consumo: Math.round(item.consumption * 10) / 10,
        mediaMovel: Math.round(avg * 10) / 10,
        limiteMeta: Math.round(dailyTarget * 10) / 10,
      };
    });
  }, [filteredRecords, activeGoal]);

  // 6. Top 5 Points Distribution
  const topPoints = useMemo(() => {
    const pointTotals = new Map<string, number>();

    filteredRecords.forEach((r) => {
      pointTotals.set(r.pointId, (pointTotals.get(r.pointId) || 0) + r.value);
    });

    const list = Array.from(pointTotals.entries())
      .map(([ptId, totalKwh]) => {
        const pt = points.find((p) => p.id === ptId);
        const unit = units.find((u) => u.id === pt?.unitId);
        const pct = currentTotalKwh > 0 ? (totalKwh / currentTotalKwh) * 100 : 0;
        return {
          id: ptId,
          name: pt?.name || ptId,
          unitName: unit?.name || 'Geral',
          kwh: totalKwh,
          percentage: pct,
          status: pt?.status || 'ATIVO',
        };
      })
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 5);

    return list;
  }, [filteredRecords, points, units, currentTotalKwh]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Visão Geral do Consumo
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitore consumo, metas, custos estimados e eventos que exigem atenção.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('consumo')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-950/40 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Novo Registro Manual</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Consumo Total */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-400 truncate">Consumo Total</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-white font-mono tabular-nums truncate"
                title={formatKwh(currentTotalKwh)}
              >
                {formatNumber(currentTotalKwh, 1, 1)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono shrink-0">kWh</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs flex-wrap">
              {percentChange >= 0 ? (
                <span className="inline-flex items-center text-red-400 font-semibold font-mono shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  {formatPercent(percentChange)}
                </span>
              ) : (
                <span className="inline-flex items-center text-emerald-400 font-semibold font-mono shrink-0">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {formatPercent(percentChange)}
                </span>
              )}
              <span className="text-slate-400 truncate">vs período anterior</span>
            </div>
          </div>
        </div>

        {/* 2. Gasto Estimado */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-xs font-medium text-slate-400 truncate">Gasto Estimado</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 shrink-0"
                title="Valor calculado utilizando a tarifa configurada. Não representa cobrança oficial."
              >
                Estimativa
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-teal-400 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 min-w-0">
            {hasConfiguredTariff ? (
              <>
                <div className="flex items-baseline gap-1 min-w-0 overflow-hidden">
                  <span className="text-sm sm:text-base font-semibold text-slate-400 shrink-0">R$</span>
                  <span
                    className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-white font-mono tabular-nums truncate"
                    title={formatCurrency(estimatedTotalCost)}
                  >
                    {formatNumber(estimatedTotalCost, 2, 2)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="truncate" title={activeTariffName}>{activeTariffName}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-400 font-mono">
                  —
                </div>
                <div className="mt-2 flex items-center justify-between gap-1 text-xs min-w-0">
                  <span className="text-amber-400 text-[11px] truncate">Gasto não calculado</span>
                  <button
                    onClick={() => navigateTo('tarifas')}
                    className="text-[11px] font-medium text-emerald-400 hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    <span>Configurar tarifa</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Meta do Período */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-medium text-slate-400 truncate"
              title={activeGoal ? activeGoal.name : 'Meta de Consumo'}
            >
              {activeGoal ? activeGoal.name : 'Meta de Consumo'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <div className="flex items-baseline justify-between gap-1.5 font-mono tabular-nums min-w-0">
              <div className="flex items-baseline gap-1 min-w-0">
                <span
                  className="text-lg sm:text-xl xl:text-2xl font-bold text-white truncate"
                  title={formatKwh(currentTotalKwh)}
                >
                  {formatNumber(currentTotalKwh, 0, 1)}
                </span>
                <span className="text-xs text-slate-400 shrink-0">kWh</span>
              </div>
              <span
                className="text-xs text-slate-400 shrink-0 text-right"
                title={`Meta: ${formatKwh(goalProgress.target)}`}
              >
                / {formatNumber(goalProgress.target, 0, 0)} kWh
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    goalProgress.pct > 100
                      ? 'bg-red-500'
                      : goalProgress.pct > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, goalProgress.pct)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono gap-1">
                <span className="text-slate-400 truncate">{goalProgress.pct.toFixed(1)}% utilizado</span>
                {goalProgress.pct > 100 && (
                  <span className="text-red-400 font-semibold shrink-0">Excedida</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Alertas Ativos */}
        <div
          onClick={() => navigateTo('alertas')}
          className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-all group min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-400 truncate">Eventos em Aberto</span>
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400 shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-xl sm:text-2xl xl:text-3xl font-bold text-white font-mono tabular-nums">
                {activeAlerts.total}
              </span>
              <span className="text-xs text-slate-400 truncate">alertas ativos</span>
            </div>

            <div className="mt-2.5 flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1 text-red-400 shrink-0">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span className="font-mono font-semibold">{activeAlerts.high}</span>
                <span className="text-slate-400 text-[11px]">altos</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-mono font-semibold">{activeAlerts.medium}</span>
                <span className="text-slate-400 text-[11px]">médios</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Evolução do Consumo (Time Series) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">Evolução do Consumo</h3>
              <p className="text-xs text-slate-400">
                Série temporal com consumo real diário, média móvel de 7 dias e referência de meta.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                Consumo Real
              </span>
              <span className="inline-flex items-center gap-1 text-teal-300">
                <span className="w-2.5 h-0.5 bg-teal-300 inline-block" />
                Média Móvel (7d)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="consumoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val} kWh`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any, name: any) => [
                    `${Number(val).toLocaleString('pt-BR')} kWh`,
                    name === 'consumo'
                      ? 'Consumo Real'
                      : name === 'mediaMovel'
                      ? 'Média Móvel (7d)'
                      : 'Meta Diária Ref.',
                  ]}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `Data: ${row.fullDate}` : label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consumo"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#consumoGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="mediaMovel"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1 col): Comparação com Período Anterior */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Comparação de Consumo</h3>
            <p className="text-xs text-slate-400 mt-1">
              Desempenho relativo ao intervalo imediatamente anterior de igual duração.
            </p>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400">Período Atual ({filters.periodDays || 30} dias)</div>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {formatKwh(currentTotalKwh)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400">Período Anterior Equivalente</div>
                <div className="text-xl font-bold text-slate-300 font-mono mt-1">
                  {formatKwh(prevTotalKwh)}
                </div>
              </div>
            </div>

            {/* Clear language per Section 14: e.g. "12,4% acima do período anterior" */}
            <div className="mt-5 p-3.5 rounded-lg border border-slate-800 bg-slate-950/40">
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    percentChange > 0 ? 'bg-red-950/80 text-red-400' : 'bg-emerald-950/80 text-emerald-400'
                  }`}
                >
                  {percentChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {Math.abs(percentChange).toFixed(1)}% {percentChange >= 0 ? 'acima' : 'abaixo'} do período anterior
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Diferença líquida de {percentChange >= 0 ? '+' : '-'}
                    {formatKwh(Math.abs(absoluteDiff))}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Valores calculados com base nas leituras armazenadas no período selecionado.</span>
          </div>
        </div>
      </div>

      {/* Distribution & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo por Ponto de Medição (Top 5) */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Consumo por Ponto de Medição</h3>
              <p className="text-xs text-slate-400">
                Top 5 pontos responsáveis pelo maior volume de energia elétrica.
              </p>
            </div>
            <button
              onClick={() => navigateTo('pontos-medicao')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topPoints.map((pt, index) => (
              <div
                key={pt.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 font-semibold">0{index + 1}.</span>
                    <span className="font-semibold text-slate-200 truncate">{pt.name}</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">({pt.unitName})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                    <span className="font-bold text-white">{formatKwh(pt.kwh)}</span>
                    <span className="text-emerald-400 font-semibold w-12 text-right">
                      {pt.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar representing share */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, pt.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de Insights da EcoIA */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-950 flex items-center justify-center text-emerald-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white">Insights da EcoIA</h3>
            </div>
            <button
              onClick={() => navigateTo('analises')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver análises</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 2).map((rec) => {
              const alert = alerts.find((a) => a.id === rec.alertId);
              const point = points.find((p) => p.id === alert?.pointId);
              return (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  pointName={point?.name}
                  onInvestigate={() => {
                    if (rec.alertId) {
                      navigateTo('alertas', rec.alertId);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
