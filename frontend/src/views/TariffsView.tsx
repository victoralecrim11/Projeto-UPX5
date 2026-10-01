import React, { useState } from 'react';
import {
  Coins,
  Plus,
  Calendar,
  Building2,
  Info,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/Badges';
import { formatCurrency } from '../lib/calculations';
import { EnergyTariff } from '../types';

export const TariffsView: React.FC = () => {
  const { tariffs, units, points, addTariff, updateTariff, hasPermission } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<EnergyTariff | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'ORGANIZACAO' | 'UNIDADE' | 'PONTO'>('UNIDADE');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [ratePerKwh, setRatePerKwh] = useState('0.72');
  const [demandRate, setDemandRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-01-01');
  const [effectiveTo, setEffectiveTo] = useState('2026-12-31');
  const [notes, setNotes] = useState('');

  const canManage = hasPermission(['ADMIN', 'FINANCEIRO']);

  const handleOpenAdd = () => {
    setEditingTariff(null);
    setName('');
    setScope('UNIDADE');
    setTargetEntityId(units[0]?.id || '');
    setRatePerKwh('0.72');
    setDemandRate('35.00');
    setEffectiveFrom('2026-01-01');
    setEffectiveTo('2026-12-31');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: EnergyTariff) => {
    setEditingTariff(t);
    setName(t.name);
    setScope(t.scope);
    setTargetEntityId(t.targetEntityId || '');
    setRatePerKwh(t.ratePerKwh.toString());
    setDemandRate(t.demandRate ? t.demandRate.toString() : '');
    setEffectiveFrom(t.effectiveFrom);
    setEffectiveTo(t.effectiveTo || '');
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(ratePerKwh);
    if (isNaN(rate) || rate <= 0) return;

    if (editingTariff) {
      updateTariff(editingTariff.id, {
        name,
        scope,
        targetEntityId: scope === 'ORGANIZACAO' ? undefined : targetEntityId,
        ratePerKwh: rate,
        demandRate: demandRate ? parseFloat(demandRate) : undefined,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
        notes: notes || undefined,
      });
    } else {
      addTariff({
        name,
        scope,
        targetEntityId: scope === 'ORGANIZACAO' ? undefined : targetEntityId,
        ratePerKwh: rate,
        currency: 'BRL',
        demandRate: demandRate ? parseFloat(demandRate) : undefined,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
        active: true,
        notes: notes || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Tarifas e Custos Estimados
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Parâmetros financeiros regulatórios para cálculo e estimativa de gastos com energia elétrica.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Tarifa</span>
          </button>
        )}
      </div>

      {/* Mandatory Clarification Banner per PRD Section 31 & RN-018 */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Regra de Terminologia Financeira e Estimativa de Gastos</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Toda estimativa apresentada nesta plataforma é calculada multiplicando o consumo medido (kWh) pela tarifa unitária cadastrada.
          Os valores constituem <strong>gastos estimados</strong> e não substituem faturas da concessionária, conciliação contábil ou documentos fiscais oficiais.
        </p>
      </div>

      {/* Tariffs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {tariffs.map((t) => {
          const targetName =
            t.scope === 'ORGANIZACAO'
              ? 'Toda a Organização'
              : t.scope === 'UNIDADE'
              ? units.find((u) => u.id === t.targetEntityId)?.name || 'Unidade'
              : points.find((p) => p.id === t.targetEntityId)?.name || 'Ponto';

          return (
            <div
              key={t.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xs flex flex-col justify-between space-y-4 min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate" title={t.name}>{t.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase truncate block">
                        Escopo: {t.scope} ({targetName})
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={t.active ? 'ATIVO' : 'INATIVO'} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
                  {t.notes || 'Tarifa de fornecimento de energia elétrica regulamentada.'}
                </p>

                {/* Price Display */}
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono min-w-0">
                  <span className="text-[11px] font-sans text-slate-400 block mb-1">
                    Custo Unitário da Energia:
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">
                    R$ {t.ratePerKwh.toFixed(2)}
                    <span className="text-xs text-slate-400 font-sans ml-1">/ kWh</span>
                  </div>

                  {t.demandRate && (
                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                      Demanda: R$ {t.demandRate.toFixed(2)} / kW
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-400 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Vigência Inicial:</span>
                    <span className="text-slate-300">{t.effectiveFrom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vigência Final:</span>
                    <span className="text-slate-300">{t.effectiveTo || 'Indeterminado'}</span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Parâmetro</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastro / Edição de Tarifa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-base font-bold text-white">
                {editingTariff ? 'Editar Tarifa de Energia' : 'Cadastrar Nova Tarifa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome da Tarifa / Contrato *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tarifa Média Tensão 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Escopo de Aplicação *</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    const s = e.target.value as any;
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
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tarifa (R$ / kWh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={ratePerKwh}
                    onChange={(e) => setRatePerKwh(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Demanda (R$ / kW)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Opcional"
                    value={demandRate}
                    onChange={(e) => setDemandRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vigência Inicial</label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vigência Final</label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observações do Contrato</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
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
                  Salvar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
