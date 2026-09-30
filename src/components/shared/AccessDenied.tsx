import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AccessDeniedProps {
  requiredRoles: string[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRoles }) => {
  const { currentUser, switchUserRole, navigateTo } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 mb-6 shadow-lg shadow-red-950/40">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase mb-1">
        Erro 403 — Acesso Restrito (RBAC)
      </span>
      <h2 className="text-2xl font-bold text-slate-100 mb-3">
        Permissão Insuficiente para Esta Seção
      </h2>

      <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
        Seu perfil atual (<span className="text-slate-200 font-semibold">{currentUser?.role}</span>) não possui permissão para visualizar ou editar estes recursos.
        Esta funcionalidade é restrita para: {requiredRoles.join(', ')}.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigateTo('dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>

        <button
          onClick={() => switchUserRole('ADMIN')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
        >
          <UserCheck className="w-4 h-4" />
          <span>Alternar para Administrador (Demo)</span>
        </button>
      </div>
    </div>
  );
};
