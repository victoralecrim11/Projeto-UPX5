import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SeverityBadge, StatusBadge } from '../components/shared/Badges';
import {
  formatKwh,
  formatCurrency,
  formatPercent,
  formatDateTime,
} from '../lib/calculations';
import { AlertCriticality, AlertStatus, AlertType } from '../types';
import { AlertDetailView } from './AlertDetailView';

export const AlertsView: React.FC = () => {
  const { alerts, points, units, selectedAlertId, navigateTo, markAlertViewed } = useApp();

  // If a specific alert is selected, render AlertDetailView
  if (selectedAlertId) {
    return <AlertDetailView alertId={selectedAlertId} />;
  }

  // Filter states
  const [filterCriticality, setFilterCriticality] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Counts
  const stats = useMemo(() => {
    const total = alerts.length;
    const novos = alerts.filter((a) => a.status === 'NOVO').length;
    const visualizados = alerts.filter((a) => a.status === 'VISUALIZADO').length;
    const tratados = alerts.filter((a) => a.status === 'TRATADO').length;
    const altos = alerts.filter((a) => a.criticality === 'ALTA' && a.status !== 'TRATADO').length;
    return { total, novos, visualizados, tratados, altos };
  }, [alerts]);

  // Filtered list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const point = points.find((p) => p.id === a.pointId);
      const unit = units.find((u) => u.id === a.unitId);

      const matchesCrit = filterCriticality === 'ALL' || a.criticality === filterCriticality;
      const matchesType = filterType === 'ALL' || a.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        a.title.toLowerCase().includes(term) ||
        (point?.name && point.name.toLowerCase().includes(term)) ||
        (unit?.name && unit.name.toLowerCase().includes(term));

      return matchesCrit && matchesType && matchesStatus && matchesSearch;
    });
  }, [alerts, points, units, filterCriticality, filterType, filterStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Painel de Alertas de Energia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitoramento de anomalias estatísticas, sobreconsumo e eventos ociosos fora da janela operacional.
          </p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Novos Alertas</span>
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums truncate">
            {stats.novos}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Visualizados</span>
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-200 tabular-nums truncate">
            {stats.visualizados}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Tratados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums truncate">
            {stats.tratados}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate" title="Alta Criticidade Ativa">Alta Criticidade</span>
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums truncate">
            {stats.altos}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ponto, título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Criticidade */}
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todas as Criticidades</option>
            <option value="ALTA">Alta Criticidade</option>
            <option value="MEDIA">Média Criticidade</option>
          </select>

          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="CONSUMO_EXCESSIVO">Consumo Excessivo</option>
            <option value="CONSUMO_OCIOSO">Consumo Ocioso</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todos os Status</option>
            <option value="NOVO">Novo</option>
            <option value="VISUALIZADO">Visualizado</option>
            <option value="TRATADO">Tratado</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {filteredAlerts.length} alerta(s)
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            Nenhum alerta localizado para os critérios aplicados.
          </div>
        ) : (
          filteredAlerts.map((al) => {
            const point = points.find((p) => p.id === al.pointId);
            const unit = units.find((u) => u.id === al.unitId);

            return (
              <div
                key={al.id}
                onClick={() => {
                  markAlertViewed(al.id);
                  navigateTo('alertas', al.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  al.status === 'NOVO'
                    ? 'bg-slate-900/90 border-red-900/50 hover:border-red-700/80 shadow-xs'
                    : al.status === 'TRATADO'
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      al.criticality === 'ALTA'
                        ? 'bg-red-950/80 border border-red-800/60 text-red-400'
                        : 'bg-amber-950/80 border border-amber-800/60 text-amber-400'
                    }`}
                  >
                    <AlertOctagon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <SeverityBadge criticality={al.criticality} />
                      <StatusBadge status={al.status} />
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateTime(al.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {al.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {al.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>
                        Ponto: <strong className="text-slate-300 font-sans">{point?.name}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Unidade: <strong className="text-slate-300 font-sans">{unit?.name}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics & CTA */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left md:text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">Consumo Observado</div>
                    <div className="text-base font-bold text-white">
                      {formatKwh(al.observedKwh)}
                    </div>
                    <div className="text-[11px] text-red-400 font-semibold">
                      {formatPercent(al.deviationPercent)} vs ref.
                    </div>
                  </div>

                  {al.estimatedCost !== null && (
                    <div className="text-left md:text-right font-mono tabular-nums hidden sm:block">
                      <div className="text-xs text-slate-400">Impacto Estimado</div>
                      <div className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(al.estimatedCost)}
                      </div>
                      <div className="text-[10px] text-slate-400">Tarifa vigente</div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>Detalhes</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
