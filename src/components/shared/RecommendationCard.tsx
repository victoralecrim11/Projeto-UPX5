import React from 'react';
import { Lightbulb, Info, ArrowRight } from 'lucide-react';
import { AIRecommendation } from '../../types';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onInvestigate?: () => void;
  pointName?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onInvestigate,
  pointName,
}) => {
  return (
    <div className="rounded-xl border border-emerald-900/40 bg-slate-900/90 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
              Insight Explicável EcoIA
            </span>
            <h4 className="text-sm font-semibold text-slate-100">
              {recommendation.category}
              {pointName ? ` — ${pointName}` : ''}
            </h4>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-slate-300">Motivo: </span>
          <span className="text-slate-400 leading-relaxed">{recommendation.reason}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs text-slate-300">
          <div className="font-sans font-semibold text-slate-400 mb-1">Evidência Observada:</div>
          <p className="leading-relaxed">{recommendation.evidence}</p>
        </div>

        <div>
          <span className="font-semibold text-slate-300">Ação de Investigação Sugerida: </span>
          <span className="text-slate-300 leading-relaxed">
            {recommendation.suggestedAction}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 italic text-slate-400">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>{recommendation.disclaimer}</span>
        </div>

        {onInvestigate && (
          <button
            onClick={onInvestigate}
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer hover:translate-x-0.5"
          >
            <span>Ver detalhes do alerta</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
