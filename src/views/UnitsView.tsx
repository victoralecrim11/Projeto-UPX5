import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  User,
  Gauge,
  Zap,
  Target,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/Badges';
import { formatKwh, formatCurrency } from '../lib/calculations';
import { Unit } from '../types';

export const UnitsView: React.FC = () => {
  const { units, points, records, goals, alerts, tariffs, navigateTo, setFilters } = useApp();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Unidades Consumidoras
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Parques fabris, prédios administrativos e instalações monitoradas da organização.
          </p>
        </div>
      </div>

      {/* Grid of Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {units.map((unit) => {
          const unitPoints = points.filter((p) => p.unitId === unit.id);
          const unitPointIds = unitPoints.map((p) => p.id);
          const unitRecords = records.filter((r) => unitPointIds.includes(r.pointId));
          const totalKwh = unitRecords.reduce((acc, r) => acc + r.value, 0);

          const unitGoal = goals.find((g) => g.targetEntityId === unit.id);
          const unitAlerts = alerts.filter(
            (a) => a.unitId === unit.id && a.status !== 'TRATADO'
          );
          const tariff = tariffs.find(
            (t) => t.active && t.targetEntityId === unit.id
          );

          const pctGoal = unitGoal
            ? Math.round((totalKwh / unitGoal.targetKwh) * 100)
            : null;

          return (
            <div
              key={unit.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-xs min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate" title={unit.name}>{unit.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 min-w-0">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{unit.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={unit.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
                  {unit.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <User className="w-3.5 h-3.5" />
                      Responsável:
                    </span>
                    <span className="font-semibold text-slate-200 truncate">{unit.manager}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <Gauge className="w-3.5 h-3.5" />
                      Pontos de Medição:
                    </span>
                    <span className="font-mono font-semibold text-white shrink-0">
                      {unitPoints.length} ativos
                    </span>
                  </div>

                  {tariff && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Tarifa Vigente:</span>
                      <span className="font-mono text-emerald-400 font-semibold truncate">
                        R$ {tariff.ratePerKwh.toFixed(2)}/kWh
                      </span>
                    </div>
                  )}
                </div>

                {/* Consumption and Goal Block */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-sans text-slate-400">Consumo Acumulado:</span>
                    <span className="text-sm font-bold text-white tabular-nums truncate">
                      {formatKwh(totalKwh)}
                    </span>
                  </div>

                  {unitGoal && (
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans">Meta: {formatKwh(unitGoal.targetKwh)}</span>
                        <span
                          className={`font-semibold ${
                            (pctGoal || 0) > 100
                              ? 'text-red-400'
                              : (pctGoal || 0) > 80
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {pctGoal}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (pctGoal || 0) > 100
                              ? 'bg-red-500'
                              : (pctGoal || 0) > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pctGoal || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Alerts */}
                {unitAlerts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2 font-mono">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>{unitAlerts.length} alerta(s) pendente(s)</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      unitId: unit.id,
                      pointId: 'ALL',
                    }));
                    navigateTo('dashboard');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Filtrar no Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
