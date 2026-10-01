import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Gauge,
  Building2,
  Coins,
  ShieldCheck,
  Check,
  X,
  Info,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SeverityBadge, StatusBadge, SourceBadge } from '../components/shared/Badges';
import {
  formatKwh,
  formatCurrency,
  formatPercent,
  formatDateTime,
} from '../lib/calculations';

export const AlertDetailView: React.FC<{ alertId: string }> = ({ alertId }) => {
  const {
    alerts,
    points,
    units,
    recommendations,
    treatAlert,
    navigateTo,
    currentUser,
    hasPermission,
    thresholds,
  } = useApp();

  const [isTreatModalOpen, setIsTreatModalOpen] = useState(false);
  const [treatmentObservation, setTreatmentObservation] = useState('');
  const [treatmentAction, setTreatmentAction] = useState('Inspeção física e verificação de cargas elétricas');
  const [formError, setFormError] = useState('');

  const alert = alerts.find((a) => a.id === alertId);

  if (!alert) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <p>Alerta não localizado ou removido.</p>
        <button
          onClick={() => navigateTo('alertas')}
          className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-200"
        >
          Voltar aos Alertas
        </button>
      </div>
    );
  }

  const point = points.find((p) => p.id === alert.pointId);
  const unit = units.find((u) => u.id === alert.unitId);
  const rec = recommendations.find((r) => r.alertId === alert.id);

  const canTreat = hasPermission(['ADMIN', 'OPERACAO', 'GESTOR']);

  const handleConfirmTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentObservation.trim()) {
      setFormError('Por favor, informe uma observação sobre a verificação realizada.');
      return;
    }

    treatAlert(alert.id, {
      observation: treatmentObservation,
      action: treatmentAction,
      user: currentUser?.name || 'Operador',
    });

    setIsTreatModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={() => navigateTo('alertas')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Alertas</span>
        </button>

        <div className="flex items-center gap-2">
          {alert.status !== 'TRATADO' && canTreat && (
            <button
              onClick={() => setIsTreatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Marcar como Tratado</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Alert Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge criticality={alert.criticality} />
            <StatusBadge status={alert.status} />
            <span className="text-xs text-slate-400 font-mono">
              Registrado em: {formatDateTime(alert.timestamp)}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">ID: {alert.id}</div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {alert.title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            {alert.description}
          </p>
        </div>

        {/* Location & Meter Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">Ponto de Medição:</span>
              <span className="font-semibold">{point?.name} ({point?.meterIdentifier})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">Unidade / Local:</span>
              <span className="font-semibold">{unit?.name} — {point?.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">Tarifa Aplicada:</span>
              <span className="font-semibold font-mono">
                {alert.tariffRateApplied ? `R$ ${alert.tariffRateApplied.toFixed(2)}/kWh` : 'Sem tarifa configurada'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Explanatory "Por que este alerta foi gerado?" & Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 26: Explicabilidade / Por que o alerta foi gerado */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Por que este alerta foi gerado?
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            A EcoIA utiliza métodos estatísticos e regras transparentes para justificar a emissão de cada evento:
          </p>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Consumo Observado:</span>
              <span className="font-bold text-white">{formatKwh(alert.observedKwh)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">
                {alert.type === 'CONSUMO_OCIOSO' ? 'Standby Máximo Esperado:' : 'Média Móvel (7 dias):'}
              </span>
              <span className="text-slate-300">{formatKwh(alert.referenceKwh)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Desvio Percentual Calculado:</span>
              <span className="font-bold text-red-400">{formatPercent(alert.deviationPercent)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Limiar Vigente da Regra:</span>
              <span className="text-amber-400">
                {alert.criticality === 'ALTA' ? `>${thresholds.highThresholdPercent}% (Alta)` : `>${thresholds.mediumThresholdPercent}% (Média)`}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Gasto Estimado do Evento:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {alert.estimatedCost !== null ? formatCurrency(alert.estimatedCost) : 'Gasto não calculado'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Conclusão Estatística: </strong>
            {alert.type === 'CONSUMO_OCIOSO'
              ? 'Consumo identificado em período fora da janela de expediente cadastrada para a instalação.'
              : `Consumo ultrapassou em mais de ${alert.deviationPercent.toFixed(1)}% o valor médio dos últimos ${thresholds.minHistoryDays} dias, configurando anomalia ${alert.criticality.toLowerCase()}.`}
          </div>
        </div>

        {/* Section 27: Recomendação Explicável da EcoIA */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recomendação de Investigação
              </h3>
            </div>

            {rec ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-300">Categoria de Análise:</span>
                  <p className="text-slate-400 mt-0.5">{rec.category}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-300">Evidência Utilizada:</span>
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {rec.evidence}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300">Ação Sugerida:</span>
                  <p className="text-emerald-300 mt-1 leading-relaxed bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg">
                    {rec.suggestedAction}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Verifique se houve alteração operacional no período ou cargas que permaneceram ligadas além do horário esperado.
              </p>
            )}
          </div>

          {/* Mandatory Disclaimer per PRD Section 16, 27, CS-006 */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5 italic">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>Recomendação gerada como apoio à investigação. Não constitui diagnóstico definitivo.</span>
          </div>
        </div>
      </div>

      {/* Section 28: Timeline & Tratamento do Alerta */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Linha do Tempo e Tratamento da Ocorrência
        </h3>

        <div className="space-y-4 pt-2">
          {alert.timeline.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 relative">
              {/* Connecting line */}
              {index < alert.timeline.length - 1 && (
                <div className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-slate-800" />
              )}

              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-200">{item.title}</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDateTime(item.date)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
                {item.user && (
                  <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
                    Responsável: {item.user}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Tratamento do Alerta (Section 28) */}
      {isTreatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Registrar Tratamento do Alerta</h3>
              <button
                onClick={() => setIsTreatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTreatment} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-950 border border-red-800 text-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Usuário Responsável
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.name || 'Operador'}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ação Realizada *
                </label>
                <select
                  value={treatmentAction}
                  onChange={(e) => setTreatmentAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  <option value="Inspeção física e verificação de cargas elétricas">
                    Inspeção física e verificação de cargas elétricas
                  </option>
                  <option value="Ajuste operacional de horário de encerramento de turno">
                    Ajuste operacional de horário de encerramento de turno
                  </option>
                  <option value="Correção de leitura de medidor">
                    Correção de leitura de medidor
                  </option>
                  <option value="Verificação de compressores / climatização">
                    Verificação de compressores / climatização
                  </option>
                  <option value="Manutenção preventiva programada">
                    Manutenção preventiva programada
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Observações e Resultados da Investigação *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Realizada vistoria no bloco fabril. Identificado circuito auxiliar mantido acionado. Desligamento efetuado e conferência concluída."
                  value={treatmentObservation}
                  onChange={(e) => setTreatmentObservation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTreatModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Confirmar Tratamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
