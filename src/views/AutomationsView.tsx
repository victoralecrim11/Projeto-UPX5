import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Mail,
  FileText,
  ShieldAlert,
  Info,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/Badges';
import { formatDateTime } from '../lib/calculations';
import { AutomationAction, AutomationCondition, AutomationRule } from '../types';

export const AutomationsView: React.FC = () => {
  const { automations, automationLogs, toggleAutomation, addAutomation, hasPermission } =
    useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [condition, setCondition] = useState<AutomationCondition>('DESVIO_MAIOR_QUE');
  const [thresholdPercent, setThresholdPercent] = useState('25');
  const [digitalAction, setDigitalAction] = useState<AutomationAction>('NOTIFICAR_GESTOR');
  const [recipient, setRecipient] = useState('gestor@ecoia.demo');

  const canManage = hasPermission(['ADMIN', 'GESTOR']);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addAutomation({
      name,
      condition,
      thresholdPercent: condition === 'DESVIO_MAIOR_QUE' ? parseFloat(thresholdPercent) : undefined,
      scope: 'ORGANIZACAO',
      digitalAction,
      recipients: [recipient],
      active: true,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Automações Digitais de Energia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Regras de disparo automático de notificações, relatórios e ocorrências para desvios detectados.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setName('');
              setCondition('DESVIO_MAIOR_QUE');
              setThresholdPercent('25');
              setDigitalAction('NOTIFICAR_GESTOR');
              setRecipient('gestor@ecoia.demo');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Nova Regra</span>
          </button>
        )}
      </div>

      {/* Mandatory Scope Boundary Banner (Section 6.3 & RN-011) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Limite Funcional da Automação Digital (Não-Física)</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          As regras de automação atuam exclusivamente em <strong>processos digitais de notificação, abertura de ocorrências e relatórios</strong>.
          Por diretriz de projeto (RN-011), o MVP <strong>não realiza acionamento físico de equipamentos, desarmes de disjuntores ou cortes de circuitos</strong>.
        </p>
      </div>

      {/* Rules List */}
      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
          Regras de Automação Configuradas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {automations.map((rule) => (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                rule.active
                  ? 'bg-slate-900/90 border-slate-800 shadow-xs'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  </div>

                  <button
                    onClick={() => toggleAutomation(rule.id)}
                    className="text-slate-400 hover:text-white"
                    title={rule.active ? 'Desativar Regra' : 'Ativar Regra'}
                  >
                    {rule.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">SE (Condição):</span>
                    <span className="text-slate-200">
                      {rule.condition === 'DESVIO_MAIOR_QUE'
                        ? `Consumo exceder média em ${rule.thresholdPercent}%`
                        : rule.condition === 'CONSUMO_OCIOSO'
                        ? 'Carga detectada fora de expediente'
                        : 'Meta mensal atingir 90%'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 font-sans block text-[10px]">ENTÃO (Ação Digital):</span>
                    <span className="text-emerald-300 font-semibold">
                      {rule.digitalAction === 'NOTIFICAR_GESTOR'
                        ? 'Notificar gestores via sistema'
                        : rule.digitalAction === 'CRIAR_OCORRENCIA'
                        ? 'Abrir ocorrência de vistoria'
                        : 'Gerar relatório gerencial'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  <span>Destinatários: </span>
                  <strong className="text-slate-300 font-mono">{rule.recipients.join(', ')}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                Criada em: {rule.createdAt.slice(0, 10)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automation Execution Logs */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Logs Recentes de Execução Digital
        </h2>

        <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-sans font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Regra Disparada</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Detalhes da Execução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {automationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                      {formatDateTime(log.executedAt)}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-semibold text-white">
                      {log.ruleName}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sucesso
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Criar Regra de Automação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Nova Regra de Automação Digital</h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome da Regra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alerta de Consumo Noturno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Condição Gatilho *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AutomationCondition)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="DESVIO_MAIOR_QUE">Desvio acima da média em %</option>
                  <option value="CONSUMO_OCIOSO">Consumo fora do expediente (Ocioso)</option>
                  <option value="META_ATINGIDA">Meta mensal atingida</option>
                </select>
              </div>

              {condition === 'DESVIO_MAIOR_QUE' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Limiar do Desvio (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={thresholdPercent}
                    onChange={(e) => setThresholdPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ação Digital Executada *</label>
                <select
                  value={digitalAction}
                  onChange={(e) => setDigitalAction(e.target.value as AutomationAction)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="NOTIFICAR_GESTOR">Notificar Gestor e Operação</option>
                  <option value="CRIAR_OCORRENCIA">Criar Ocorrência Digital de Vistoria</option>
                  <option value="GERAR_RELATORIO">Gerar Relatório de Desvio</option>
                  <option value="ALTERAR_STATUS_ALERTA">Classificar Alerta Automaticamente</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Destinatário Notificado</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
