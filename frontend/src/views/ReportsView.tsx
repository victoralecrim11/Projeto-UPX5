import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  Gauge,
  TrendingUp,
  Coins,
  CheckCircle2,
  AlertOctagon,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/shared/FilterBar';
import {
  formatKwh,
  formatCurrency,
  formatPercent,
  formatDateTime,
  calculateEstimatedCost,
} from '../lib/calculations';

type ReportType =
  | 'CONSUMO'
  | 'METAS'
  | 'ALERTAS'
  | 'GERENCIAL'
  | 'CUSTOS_ESTIMADOS';

export const ReportsView: React.FC = () => {
  const {
    filteredRecords,
    points,
    units,
    goals,
    alerts,
    tariffs,
    organization,
    filters,
  } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('GERENCIAL');

  // Summary statistics
  const summary = useMemo(() => {
    const totalKwh = filteredRecords.reduce((acc, r) => acc + r.value, 0);
    const avgDailyKwh = filteredRecords.length > 0 ? totalKwh / (filters.periodDays || 30) : 0;

    // Estimated costs
    let totalCost = 0;
    let recordsWithTariff = 0;

    filteredRecords.forEach((r) => {
      const pt = points.find((p) => p.id === r.pointId);
      const tariff = tariffs.find(
        (t) =>
          t.active &&
          (t.targetEntityId === pt?.id ||
            t.targetEntityId === pt?.unitId ||
            t.scope === 'ORGANIZACAO')
      );
      if (tariff) {
        totalCost += r.value * tariff.ratePerKwh;
        recordsWithTariff += 1;
      }
    });

    const activeAlertsCount = alerts.filter((a) => a.status !== 'TRATADO').length;
    const treatedAlertsCount = alerts.filter((a) => a.status === 'TRATADO').length;

    return {
      totalKwh,
      avgDailyKwh,
      totalCost,
      recordsWithTariff,
      totalRecords: filteredRecords.length,
      activeAlertsCount,
      treatedAlertsCount,
    };
  }, [filteredRecords, filters, points, tariffs, alerts]);

  // Client-Side Excel Exporter
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeReport === 'CONSUMO' || activeReport === 'GERENCIAL' || activeReport === 'CUSTOS_ESTIMADOS') {
      headers = [
        'Data_Hora',
        'Ponto_Medicao',
        'Identificador_Medidor',
        'Unidade',
        'Consumo_kWh',
        'Origem',
        'Tarifa_R$_kWh',
        'Gasto_Estimado_R$',
        'Status',
      ];

      rows = filteredRecords.map((r) => {
        const pt = points.find((p) => p.id === r.pointId);
        const unit = units.find((u) => u.id === pt?.unitId);
        const tariff = tariffs.find(
          (t) =>
            t.active &&
            (t.targetEntityId === pt?.id ||
              t.targetEntityId === pt?.unitId ||
              t.scope === 'ORGANIZACAO')
        );
        const cost = calculateEstimatedCost(r.value, tariff?.ratePerKwh);

        return [
          r.timestamp,
          pt?.name || r.pointId,
          pt?.meterIdentifier || '',
          unit?.name || '',
          Number(r.value.toFixed(2)),
          r.origin,
          tariff ? Number(tariff.ratePerKwh.toFixed(2)) : 'N/A',
          cost.estimatedTotal !== null ? Number(cost.estimatedTotal.toFixed(2)) : 'N/A',
          r.status,
        ];
      });
    } else if (activeReport === 'ALERTAS') {
      headers = [
        'ID_Alerta',
        'Data_Geracao',
        'Ponto_Medicao',
        'Tipo',
        'Criticidade',
        'Status',
        'Consumo_Observado_kWh',
        'Referencia_kWh',
        'Desvio_Percentual',
        'Gasto_Estimado_R$',
      ];

      rows = alerts.map((a) => {
        const pt = points.find((p) => p.id === a.pointId);
        return [
          a.id,
          a.timestamp,
          pt?.name || a.pointId,
          a.type,
          a.criticality,
          a.status,
          Number(a.observedKwh.toFixed(2)),
          Number(a.referenceKwh.toFixed(2)),
          Number(a.deviationPercent.toFixed(1)),
          a.estimatedCost !== null ? Number(a.estimatedCost.toFixed(2)) : 'N/A',
        ];
      });
    } else if (activeReport === 'METAS') {
      headers = [
        'Nome_Meta',
        'Escopo',
        'Entidade_Alvo',
        'Periodo',
        'Meta_kWh',
        'Status',
      ];

      rows = goals.map((g) => [
        g.name,
        g.scope,
        g.targetEntityId || 'Organizacao',
        g.period,
        Number(g.targetKwh.toFixed(0)),
        g.status,
      ]);
    }

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-fit column widths
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => String(r[i] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeReport);

    XLSX.writeFile(
      wb,
      `ecoia_relatorio_${activeReport.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Central de Relatórios Energéticos
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Geração de demonstrativos analíticos de consumo, cumprimento de metas e custos estimados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Template Selector (Buttons/Tabs) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl no-print text-xs">
        {[
          { id: 'GERENCIAL', label: 'Relatório Gerencial Consolidado' },
          { id: 'CONSUMO', label: 'Relatório Detalhado de Consumo' },
          { id: 'CUSTOS_ESTIMADOS', label: 'Relatório de Custos Estimados' },
          { id: 'METAS', label: 'Relatório de Metas e Limites' },
          { id: 'ALERTAS', label: 'Relatório de Alertas e Ocorrências' },
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setActiveReport(rep.id as ReportType)}
            className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeReport === rep.id
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Global Filter Bar */}
      <div className="no-print">
        <FilterBar />
      </div>

      {/* Report Preview Document Canvas (Printable Area) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="text-emerald-400 font-mono font-bold text-xs uppercase tracking-widest mb-1">
              EcoIA — Relatório de Energia Elétrica
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {activeReport === 'GERENCIAL' && 'Demonstrativo Gerencial Consolidado'}
              {activeReport === 'CONSUMO' && 'Demonstrativo Analítico de Consumo Físico'}
              {activeReport === 'CUSTOS_ESTIMADOS' && 'Relatório de Estimativa de Gastos Energéticos'}
              {activeReport === 'METAS' && 'Relatório de Cumprimento de Metas de Eficiência'}
              {activeReport === 'ALERTAS' && 'Relatório de Ocorrências e Alertas de Anomalia'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Organização: <strong className="text-slate-200">{organization.name}</strong> · Emissão em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <div>Período: {filters.periodDays ? `Últimos ${filters.periodDays} dias` : 'Personalizado'}</div>
            <div>Base: Registros locais certificados</div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-w-0">
            <span className="text-[11px] text-slate-400 block font-sans truncate">Consumo Consolidado:</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums truncate block">
              {formatKwh(summary.totalKwh)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-w-0">
            <span className="text-[11px] text-slate-400 block font-sans truncate">Média Diária:</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-300 tabular-nums truncate block">
              {formatKwh(summary.avgDailyKwh)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-w-0">
            <span className="text-[11px] text-slate-400 block font-sans truncate">Gasto Estimado:</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 tabular-nums truncate block">
              {formatCurrency(summary.totalCost)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 min-w-0">
            <span className="text-[11px] text-slate-400 block font-sans truncate">Alertas Registrados:</span>
            <span className="text-base sm:text-lg font-bold font-mono text-red-400 tabular-nums truncate block">
              {summary.activeAlertsCount} abertos / {summary.treatedAlertsCount} tratados
            </span>
          </div>
        </div>

        {/* Section Table based on selected report */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Ponto de Medição</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3 text-right">Consumo (kWh)</th>
                  <th className="px-4 py-3 text-right">Tarifa Vigente</th>
                  <th className="px-4 py-3 text-right">Gasto Estimado</th>
                  <th className="px-4 py-3 text-center">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {points.map((pt) => {
                  const ptRecords = filteredRecords.filter((r) => r.pointId === pt.id);
                  const totalKwh = ptRecords.reduce((acc, r) => acc + r.value, 0);
                  const unit = units.find((u) => u.id === pt.unitId);
                  const tariff = tariffs.find(
                    (t) =>
                      t.active &&
                      (t.targetEntityId === pt.id ||
                        t.targetEntityId === pt.unitId ||
                        t.scope === 'ORGANIZACAO')
                  );
                  const cost = calculateEstimatedCost(totalKwh, tariff?.ratePerKwh);
                  const ptAlerts = alerts.filter((a) => a.pointId === pt.id).length;

                  return (
                    <tr key={pt.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-200">
                        {pt.name}
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-400">{unit?.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white tabular-nums">
                        {formatKwh(totalKwh)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                        {tariff ? `R$ ${tariff.ratePerKwh.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-400 font-bold tabular-nums">
                        {cost.hasTariff ? formatCurrency(cost.estimatedTotal) : '— Não calculado'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {ptAlerts > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800">
                            {ptAlerts}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Disclaimer Footer (Section 31 & 32) */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 italic">
          <FileCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>
            Os valores financeiros informados representam <strong>gastos estimados</strong> calculados via parâmetros tarifários homologados no sistema.
            Não constituem fatura de fornecimento nem documento contábil emitido por concessionária.
          </span>
        </div>
      </div>
    </div>
  );
};
