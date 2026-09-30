import React, { useState } from 'react';
import {
  Lightbulb,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  Info,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RecommendationCard } from '../components/shared/RecommendationCard';
import {
  classifyConsumption,
  calculateMovingAverage,
  formatKwh,
  formatPercent,
} from '../lib/calculations';

export const InsightsView: React.FC = () => {
  const { recommendations, alerts, points, records, thresholds, navigateTo } = useApp();

  // Interactive Live Rule Simulator for evaluation & testing (Section 23)
  const [simPointId, setSimPointId] = useState(points[0]?.id || '');
  const [simVal, setSimVal] = useState('520');
  const [simIsIdle, setSimIsIdle] = useState(false);

  const selectedPt = points.find((p) => p.id === simPointId);
  const ptRecords = records.filter((r) => r.pointId === simPointId);
  const movingAvg = calculateMovingAverage(ptRecords, thresholds.minHistoryDays);
  const historyCount = selectedPt?.hasInsufficientHistory ? 3 : ptRecords.length;

  const simResult = classifyConsumption(
    parseFloat(simVal) || 0,
    movingAvg,
    historyCount,
    thresholds,
    simIsIdle
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Análises e Insights da EcoIA
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Painel de inteligência explicável, detecção estatística de desvios e apoio à investigação operacional.
          </p>
        </div>
      </div>

      {/* Mandatory Technical Disclaimer per PRD Section 16 & 41 */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Diretriz de Transparência e Explicabilidade da IA</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Nesta versão do EcoIA, o mecanismo analítico é fundamentado em <strong>regras determinísticas e modelos estatísticos interpretáveis</strong> (média móvel de 7 dias, desvio percentual e matriz de janelas operacionais).
          A plataforma não utiliza caixas-pretas nem afirma diagnóstico definitivo de falhas físicas, servindo estritamente como ferramenta de apoio à decisão humana.
        </p>
      </div>

      {/* Grid: Active Explainable Recommendations */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
          Insights Ativos para Investigação
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const alert = alerts.find((a) => a.id === rec.alertId);
            const pt = points.find((p) => p.id === alert?.pointId);

            return (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                pointName={pt?.name}
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

      {/* Section 24: Consumo Ocioso em Detalhe */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Monitoramento de Consumo Ocioso (Fora da Janela Operacional)
            </h3>
            <span className="text-[11px] text-slate-400">
              Regra de Negócio RN-010 e RN-019
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          O consumo ocioso ocorre quando cargas elétricas significativas são mantidas ativas durante horários nos quais a instalação ou linha de produção não possui expediente programado (ex: finais de semana ou madrugadas).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">1. Cadastro da Janela</span>
            <span className="font-semibold text-slate-200 mt-1 block">Horário Previsto de Expediente</span>
            <p className="text-[11px] text-slate-400 mt-1">Ex: Seg a Sex das 07:00 às 19:00.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">2. Leitura Fora da Janela</span>
            <span className="font-semibold text-amber-300 mt-1 block">Standby Superior ao Esperado</span>
            <p className="text-[11px] text-slate-400 mt-1">Detecção de potência ativa &gt; 15 kWh sem operação.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">3. Emissão de Recomendação</span>
            <span className="font-semibold text-emerald-400 mt-1 block">Apoio à Vistoria em Campo</span>
            <p className="text-[11px] text-slate-400 mt-1">Orientação para checagem de iluminação e compressores.</p>
          </div>
        </div>
      </div>

      {/* Section 23: Simulador do Motor de Regras Estatístico */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-950 flex items-center justify-center text-teal-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Simulador Interativo do Motor de Regras
              </h3>
              <span className="text-[11px] text-slate-400">
                Teste em tempo real como o modelo estatístico classifica qualquer leitura
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Ponto de Teste:
            </label>
            <select
              value={simPointId}
              onChange={(e) => setSimPointId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
            >
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.hasInsufficientHistory ? '(<7 dias)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Consumo a Testar (kWh):
            </label>
            <input
              type="number"
              step="10"
              value={simVal}
              onChange={(e) => setSimVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="idleCheck"
              checked={simIsIdle}
              onChange={(e) => setSimIsIdle(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded bg-slate-950 border-slate-700 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="idleCheck" className="text-slate-300 hover:text-white font-medium cursor-pointer select-none">
              Simular leitura fora do expediente (Ocioso)
            </label>
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400 font-sans border-b border-slate-800 pb-2">
            <span>Diagnóstico do Motor Estatístico:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                simResult.classification === 'EXCESSO_ALTO' || simResult.classification === 'OCIOSO'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : simResult.classification === 'EXCESSO_MEDIO'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {simResult.classification}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-500 block font-sans">Valor Testado:</span>
              <span className="text-white font-bold">{formatKwh(parseFloat(simVal) || 0)}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Média 7d Ref:</span>
              <span className="text-slate-300">
                {movingAvg !== null ? formatKwh(movingAvg) : 'Insuficiente'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Desvio:</span>
              <span
                className={`font-bold ${
                  (simResult.deviationPercent || 0) > 20 ? 'text-red-400' : 'text-slate-300'
                }`}
              >
                {simResult.deviationPercent !== null ? formatPercent(simResult.deviationPercent) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Limiar Aplicado:</span>
              <span className="text-amber-400">
                Médio &gt;{thresholds.mediumThresholdPercent}% · Alto &gt;{thresholds.highThresholdPercent}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-sans">
            <strong>Explicação Gerada: </strong>
            <span>{simResult.explanation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
