import React, { useState, useMemo } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SourceBadge, StatusBadge } from '../components/shared/Badges';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import {
  formatKwh,
  formatCurrency,
  formatDateTime,
  calculateEstimatedCost,
} from '../lib/calculations';
import { ConsumptionRecord } from '../types';

export const ConsumptionView: React.FC = () => {
  const {
    records,
    points,
    units,
    tariffs,
    currentUser,
    hasPermission,
    addManualRecord,
    updateRecord,
    deleteRecord,
    resetToDefaultData,
    filters,
    setFilters,
  } = useApp();

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConsumptionRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<ConsumptionRecord | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  // New Record Form State
  const [formPointId, setFormPointId] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState('2026-09-29');
  const [formTime, setFormTime] = useState('14:00');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const canEditOrDelete = hasPermission(['ADMIN', 'OPERACAO']);

  // Active measurement points for selection
  const activePoints = points.filter((p) => p.status === 'ATIVO');

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const time = new Date(r.timestamp);
      const days = filters.periodDays;
      const now = new Date('2026-09-29T23:59:59.000Z');
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const matchesPeriod = days === 0 ? true : time >= cutoff;
      const matchesOrigin = filters.origin === 'ALL' || r.origin === filters.origin;

      const point = points.find((p) => p.id === r.pointId);
      const matchesUnit = filters.unitId === 'ALL' || (point && point.unitId === filters.unitId);
      const matchesPoint = filters.pointId === 'ALL' || r.pointId === filters.pointId;

      return matchesPeriod && matchesOrigin && matchesUnit && matchesPoint;
    });
  }, [records, filters, points]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenNewModal = () => {
    setFormPointId(activePoints[0]?.id || '');
    setFormValue('');
    setFormDate('2026-09-29');
    setFormTime('14:00');
    setFormNotes('');
    setFormError('');
    setIsNewModalOpen(true);
  };

  const handleSaveManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const val = parseFloat(formValue);
    if (isNaN(val) || val < 0) {
      setFormError('Informe um valor numérico de consumo válido (maior ou igual a zero).');
      return;
    }

    if (!formPointId) {
      setFormError('Selecione um ponto de medição ativo.');
      return;
    }

    const isoString = `${formDate}T${formTime}:00.000Z`;

    const result = addManualRecord({
      pointId: formPointId,
      value: val,
      timestamp: isoString,
      notes: formNotes || undefined,
    });

    if (!result.success) {
      setFormError(result.message);
      return;
    }

    setIsNewModalOpen(false);
    setFeedbackToast({
      message: result.message,
      type: result.alertGenerated ? 'alert' : 'success',
    });

    setTimeout(() => {
      setFeedbackToast(null);
    }, 6000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const val = parseFloat(formValue);
    if (isNaN(val) || val < 0) return;

    updateRecord(editingRecord.id, {
      value: val,
      notes: formNotes || undefined,
    });

    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-lg transition-all ${
            feedbackToast.type === 'alert'
              ? 'bg-amber-950/90 border-amber-800 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'alert' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Registros de Consumo
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Histórico completo de leituras de energia elétrica, gastos estimados e origens dos dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Registro Manual</span>
          </button>
        </div>
      </div>

      {/* Origin & Simulation Clarification Banner (RN-014) */}
      <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-900/50 flex items-start gap-3 text-xs text-purple-200">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-purple-300">Identificação de Origem: </span>
          <span>
            Registros identificados como <span className="font-mono font-bold text-purple-300">SIMULADO</span> compõem o conjunto demonstrativo de testes.
            Registros <span className="font-mono font-bold text-sky-300">MANUAL</span> foram inseridos por usuários no protótipo.
            A origem <span className="font-mono font-bold text-slate-300">SENSOR</span> representa a futura arquitetura de telemetria IoT.
          </span>
        </div>
      </div>

      {/* Filter Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Filtrar Origem:</span>
          {['ALL', 'SIMULADO', 'MANUAL', 'SENSOR'].map((orig) => (
            <button
              key={orig}
              onClick={() => setFilters((prev) => ({ ...prev, origin: orig }))}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filters.origin === orig
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {orig === 'ALL'
                ? 'Todas as origens'
                : orig === 'SIMULADO'
                ? 'Simulado'
                : orig === 'MANUAL'
                ? 'Manual'
                : 'Sensor (Futuro)'}
            </button>
          ))}
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Exibindo {filtered.length} registro(s) no período
        </div>
      </div>

      {/* Records Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Ponto de Medição</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3 text-right">Consumo (kWh)</th>
                <th className="px-4 py-3 text-center">Origem</th>
                <th className="px-4 py-3 text-right">Gasto Estimado</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginated.map((rec) => {
                  const point = points.find((p) => p.id === rec.pointId);
                  const unit = units.find((u) => u.id === point?.unitId);
                  const tariff = tariffs.find(
                    (t) =>
                      t.active &&
                      (t.targetEntityId === point?.id ||
                        t.targetEntityId === point?.unitId ||
                        t.scope === 'ORGANIZACAO')
                  );
                  const cost = calculateEstimatedCost(rec.value, tariff?.ratePerKwh);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-4 py-3 text-slate-300 font-mono tabular-nums whitespace-nowrap">
                        {formatDateTime(rec.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {point?.name || rec.pointId}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {unit?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white tabular-nums">
                        {formatKwh(rec.value)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SourceBadge origin={rec.origin} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {cost.hasTariff ? (
                          <span className="text-emerald-300 font-medium">
                            {formatCurrency(cost.estimatedTotal)}
                          </span>
                        ) : (
                          <span
                            className="text-slate-400 text-[11px] italic"
                            title="Sem tarifa configurada para este ponto"
                          >
                            — Não calculado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedRecordDetail(rec)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Ver detalhes da leitura"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEditOrDelete && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingRecord(rec);
                                  setFormValue(rec.value.toString());
                                  setFormNotes(rec.notes || '');
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Editar registro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRecordToDelete(rec.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Excluir registro (com auditoria)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Página {currentPage} de {totalPages} ({filtered.length} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer disabled:pointer-events-none transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 cursor-pointer disabled:pointer-events-none transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Novo Registro Manual (Section 18) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Novo Registro de Consumo</h3>
                  <span className="text-[11px] text-slate-400">Origem: Lançamento Manual</span>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRecord} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs">
                  {formError}
                </div>
              )}

              {/* Ponto de Medição */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ponto de Medição (Apenas ativos) *
                </label>
                <select
                  required
                  value={formPointId}
                  onChange={(e) => setFormPointId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                >
                  {activePoints.map((p) => {
                    const unit = units.find((u) => u.id === p.unitId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} — {unit?.name} ({p.meterIdentifier})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Valor do Consumo & Unidade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Consumo Observado *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="Ex: 580.0"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    disabled
                    value="kWh"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Data da Leitura *
                  </label>
                  <input
                    type="date"
                    required
                    max="2026-09-29"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Observações / Justificativa Operacional (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Leitura realizada no encerramento de turno de manutenção preventiva."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edição de Registro */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto">
            <h3 className="text-base font-bold text-white mb-1">Editar Registro de Consumo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Esta alteração será registrada na trilha de auditoria para conformidade.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Novo Consumo (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observação da Correção</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Detalhe do Registro */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-xs space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Detalhes da Medição</h3>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 text-[11px]">ID do Registro:</span>
                <p className="font-mono text-slate-200 mt-0.5 truncate">{selectedRecordDetail.id}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Data / Hora ISO:</span>
                <p className="font-mono text-slate-200 mt-0.5">{formatDateTime(selectedRecordDetail.timestamp)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Consumo Físico:</span>
                <p className="text-base font-mono font-bold text-white mt-0.5">{formatKwh(selectedRecordDetail.value)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Origem:</span>
                <div className="mt-1">
                  <SourceBadge origin={selectedRecordDetail.origin} />
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold">Observações / Detalhes:</span>
              <p className="mt-1 p-3 bg-slate-950 rounded-lg text-slate-300 leading-relaxed border border-slate-800/60">
                {selectedRecordDetail.notes || 'Nenhuma observação informada no lançamento.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!recordToDelete}
        title="Excluir registro de consumo?"
        description="Esta exclusão será registrada na trilha de auditoria e removerá o registro dos cálculos de histórico e metas."
        confirmLabel="Excluir Registro"
        isDestructive
        onConfirm={() => {
          if (recordToDelete) {
            deleteRecord(recordToDelete);
            setRecordToDelete(null);
          }
        }}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
};
