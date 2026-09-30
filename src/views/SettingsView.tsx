import React, { useState } from 'react';
import { Sliders, ShieldCheck, Check, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/shared/AccessDenied';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const { thresholds, updateThresholds, resetToDefaultData, hasPermission } = useApp();

  const [medium, setMedium] = useState(thresholds.mediumThresholdPercent.toString());
  const [high, setHigh] = useState(thresholds.highThresholdPercent.toString());
  const [days, setDays] = useState(thresholds.minHistoryDays.toString());
  const [isSaved, setIsSaved] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // RBAC Guard
  if (!hasPermission(['ADMIN'])) {
    return <AccessDenied requiredRoles={['Administrador']} />;
  }

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(medium);
    const h = parseFloat(high);
    const d = parseInt(days, 10);

    if (isNaN(m) || isNaN(h) || isNaN(d) || m <= 0 || h <= m || d < 1) {
      return;
    }

    updateThresholds({
      mediumThresholdPercent: m,
      highThresholdPercent: h,
      minHistoryDays: d,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Configurações e Parâmetros do Sistema
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Ajuste de limiares estatísticos de anomalia, sensibilidade do motor de regras e dados.
          </p>
        </div>
      </div>

      {/* Threshold Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Limiares de Detecção de Anomalia (Seção 35 & RF-017)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Configure as porcentagens de tolerância sobre a média móvel de 7 dias para disparo automático de alertas médios e altos.
          </p>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-300">
                Limiar Médio (% sobre a média)
              </label>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  min="5"
                  max="100"
                  step="1"
                  required
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg p-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-hidden transition-colors"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-amber-400">
                Padrão: 20%. Dispara alerta de média criticidade.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-300">
                Limiar Alto / Crítico (% sobre a média)
              </label>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="1"
                  required
                  value={high}
                  onChange={(e) => setHigh(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg p-2 text-white font-bold text-base focus:border-red-500 focus:outline-hidden transition-colors"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-red-400">
                Padrão: 40%. Dispara alerta de alta criticidade.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-300">
                Histórico Mínimo Exigido (dias)
              </label>
              <div className="flex items-center gap-2 font-mono">
                <input
                  type="number"
                  min="3"
                  max="30"
                  step="1"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg p-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-hidden transition-colors"
                />
                <span className="text-slate-400 font-bold">dias</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Padrão: 7 dias contínuos (RN-006).
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>A alteração passa a valer para todas as análises subsequentes.</span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Limiares Salvos!</span>
                </>
              ) : (
                <span>Atualizar Limiares</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Data Management Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Gerenciamento do Conjunto de Dados Simulado
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Reinicialize a base de dados em memória e localStorage com o conjunto determinístico padrão de 90 dias.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/80 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Fixtures Originais do Protótipo</span>
          </button>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Restaurar dados originais?"
        description="Esta ação reiniciará todas as medições, alertas, metas e configurações para os valores originais do PRD."
        confirmLabel="Confirmar Restauração"
        isDestructive
        onConfirm={() => {
          resetToDefaultData();
          setIsResetConfirmOpen(false);
          setMedium('20');
          setHigh('40');
          setDays('7');
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
