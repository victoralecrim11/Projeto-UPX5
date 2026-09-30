import React, { useState } from 'react';
import { Target, Plus, Calendar, AlertTriangle, CheckCircle2, AlertOctagon, X, Building2, Gauge } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/Badges';
import { formatKwh } from '../lib/calculations';
import { EnergyGoal, GoalScope } from '../types';

export const GoalsView: React.FC = () => {
  const { goals, units, points, records, addGoal, hasPermission } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [scope, setScope] = useState<GoalScope>('UNIDADE');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [targetKwh, setTargetKwh] = useState('');
  const [period, setPeriod] = useState('Outubro 2026');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  const canManage = hasPermission(['ADMIN', 'GESTOR']);

  const handleOpenAdd = () => {
    setName('');
    setScope('UNIDADE');
    setTargetEntityId(units[0]?.id || '');
    setTargetKwh('40000');
    setPeriod('Outubro 2026');
    setStartDate('2026-10-01');
    setEndDate('2026-10-31');
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetKwh);
    if (isNaN(val) || val <= 0) return;

    addGoal({
      name,
      scope,
      targetEntityId: scope === 'ORGANIZACAO' ? undefined : targetEntityId,
      targetKwh: val,
      period,
      startDate,
      endDate,
      status: 'NO_LIMITE',
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Metas de Consumo Energético
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Acompanhamento de metas estabelecidas por organização, unidade ou ponto de medição.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Meta</span>
          </button>
        )}
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          // Calculate actual consumption in the period for this scope
          let goalRecords = records;
          if (goal.scope === 'UNIDADE' && goal.targetEntityId) {
            const unitPtIds = points.filter((p) => p.unitId === goal.targetEntityId).map((p) => p.id);
            goalRecords = records.filter((r) => unitPtIds.includes(r.pointId));
          } else if (goal.scope === 'PONTO' && goal.targetEntityId) {
            goalRecords = records.filter((r) => r.pointId === goal.targetEntityId);
          }

          const currentKwh = goalRecords.reduce((acc, r) => acc + r.value, 0);
          const percent = goal.targetKwh > 0 ? (currentKwh / goal.targetKwh) * 100 : 0;

          const dynamicStatus: 'NO_LIMITE' | 'ATENCAO' | 'EXCEDIDA' =
            percent > 100 ? 'EXCEDIDA' : percent > 85 ? 'ATENCAO' : 'NO_LIMITE';

          const targetEntityName =
            goal.scope === 'ORGANIZACAO'
              ? 'Toda a Organização'
              : goal.scope === 'UNIDADE'
              ? units.find((u) => u.id === goal.targetEntityId)?.name || 'Unidade'
              : points.find((p) => p.id === goal.targetEntityId)?.name || 'Ponto';

          return (
            <div
              key={goal.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xs flex flex-col justify-between space-y-4 min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold truncate">
                      Escopo: {goal.scope}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5 truncate">{goal.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      Alvo: <span className="text-slate-200 font-semibold">{targetEntityName}</span> · {goal.period}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={dynamicStatus} />
                  </div>
                </div>

                {/* Progress Bar & Numeric comparison */}
                <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 min-w-0">
                  <div className="flex items-baseline justify-between font-mono tabular-nums gap-2 flex-wrap">
                    <div className="min-w-0">
                      <span className="text-xs text-slate-400 font-sans block">Consumo Registrado:</span>
                      <span className="text-lg sm:text-xl font-bold text-white truncate block">{formatKwh(currentKwh)}</span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-xs text-slate-400 font-sans block">Meta Limite:</span>
                      <span className="text-sm font-semibold text-slate-300 truncate block">
                        {formatKwh(goal.targetKwh)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dynamicStatus === 'EXCEDIDA'
                          ? 'bg-red-500'
                          : dynamicStatus === 'ATENCAO'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono gap-1 flex-wrap">
                    <span className="text-slate-400 shrink-0">{percent.toFixed(1)}% utilizado</span>
                    {percent > 100 ? (
                      <span className="text-red-400 font-semibold truncate">
                        +{formatKwh(currentKwh - goal.targetKwh)} acima
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold truncate">
                        {formatKwh(goal.targetKwh - currentKwh)} restantes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono text-[11px]">
                <span>Início: {goal.startDate}</span>
                <span>Fim: {goal.endDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-base font-bold text-white">Cadastrar Meta de Energia</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título da Meta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Meta Q4 - Climatização"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Escopo da Meta *</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    const s = e.target.value as GoalScope;
                    setScope(s);
                    if (s === 'UNIDADE') setTargetEntityId(units[0]?.id || '');
                    if (s === 'PONTO') setTargetEntityId(points[0]?.id || '');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  <option value="ORGANIZACAO">Toda a Organização</option>
                  <option value="UNIDADE">Unidade Específica</option>
                  <option value="PONTO">Ponto de Medição Específico</option>
                </select>
              </div>

              {scope === 'UNIDADE' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Selecione a Unidade</label>
                  <select
                    value={targetEntityId}
                    onChange={(e) => setTargetEntityId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scope === 'PONTO' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Selecione o Ponto</label>
                  <select
                    value={targetEntityId}
                    onChange={(e) => setTargetEntityId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  >
                    {points.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.meterIdentifier})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Limite Máximo Alvo (kWh) *</label>
                <input
                  type="number"
                  step="100"
                  min="1"
                  required
                  value={targetKwh}
                  onChange={(e) => setTargetKwh(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Término</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
