import React, { useState } from 'react';
import { Filter, RotateCcw, Calendar, Building2, Gauge, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, units, points } = useApp();
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Available points filtered by unit if unit is chosen
  const availablePoints =
    filters.unitId === 'ALL'
      ? points
      : points.filter((p) => p.unitId === filters.unitId);

  const isFiltered =
    filters.periodDays !== 30 ||
    filters.unitId !== 'ALL' ||
    filters.pointId !== 'ALL' ||
    filters.origin !== 'ALL';

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtros Globais:</span>
          </div>

          {/* Period selector */}
          <div className="relative">
            <select
              value={filters.periodDays === 0 ? 'custom' : filters.periodDays.toString()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setShowCustomDate(true);
                  setFilters((prev) => ({
                    ...prev,
                    periodDays: 0,
                    customStartDate: '2026-09-01',
                    customEndDate: '2026-09-29',
                  }));
                } else {
                  setShowCustomDate(false);
                  setFilters((prev) => ({ ...prev, periodDays: Number(val) }));
                }
              }}
              aria-label="Filtrar por período"
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="custom">Período Personalizado</option>
            </select>
          </div>

          {/* Unit selector */}
          <div className="relative">
            <select
              value={filters.unitId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  unitId: e.target.value,
                  pointId: 'ALL', // reset point selection on unit change
                }))
              }
              aria-label="Filtrar por unidade"
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Point selector */}
          <div className="relative">
            <select
              value={filters.pointId}
              onChange={(e) => setFilters((prev) => ({ ...prev, pointId: e.target.value }))}
              aria-label="Filtrar por ponto de medição"
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 max-w-[210px] truncate"
            >
              <option value="ALL">Todos os Pontos</option>
              {availablePoints.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Origin selector */}
          <div className="relative">
            <select
              value={filters.origin}
              onChange={(e) => setFilters((prev) => ({ ...prev, origin: e.target.value }))}
              aria-label="Filtrar por origem dos dados"
              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Todas as Origens</option>
              <option value="SIMULADO">Apenas Simulados</option>
              <option value="MANUAL">Apenas Manuais</option>
              <option value="SENSOR">Apenas Sensores (Futuro)</option>
            </select>
          </div>
        </div>

        {/* Right: Reset Button & Status */}
        {isFiltered && (
          <button
            onClick={() => {
              resetFilters();
              setShowCustomDate(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      {/* Custom Date Inputs if selected */}
      {showCustomDate && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">De:</span>
            <input
              type="date"
              value={filters.customStartDate || '2026-09-01'}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customStartDate: e.target.value }))
              }
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Até:</span>
            <input
              type="date"
              value={filters.customEndDate || '2026-09-29'}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customEndDate: e.target.value }))
              }
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
