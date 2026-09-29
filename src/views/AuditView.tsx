import React, { useState } from 'react';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RoleBadge } from '../components/shared/Badges';
import { AccessDenied } from '../components/shared/AccessDenied';
import { formatDateTime } from '../lib/calculations';

export const AuditView: React.FC = () => {
  const { auditLogs, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // RBAC Guard
  if (!hasPermission(['ADMIN'])) {
    return <AccessDenied requiredRoles={['Administrador']} />;
  }

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      log.action.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Trilha de Auditoria e Conformidade
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Registro imutável de todas as ações administrativas, alterações de tarifas, limiares e tratamentos.
          </p>
        </div>
      </div>

      {/* Audit Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Conformidade RNF-008: Todas as operações críticas possuem retenção de log com autoria, timestamp e delta de alteração.
          </span>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar por ação, usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-sans font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Ação Registrada</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Valor Anterior</th>
                <th className="px-4 py-3">Valor Novo</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Nenhum log encontrado para o critério informado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RoleBadge role={log.userRole} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.oldValue || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-emerald-400 font-semibold">
                      {log.newValue || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
