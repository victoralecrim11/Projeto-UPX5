import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Cpu,
  User,
  FlaskConical,
  ShieldCheck,
  Briefcase,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { AlertCriticality, AlertStatus, RecordOrigin, UserRole } from '../../types';

export const StatusBadge: React.FC<{
  status: AlertStatus | 'ATIVO' | 'INATIVO' | 'ATIVA' | 'INATIVA' | 'NORMAL' | 'ANOMALIA' | 'NO_LIMITE' | 'ATENCAO' | 'EXCEDIDA';
}> = ({ status }) => {
  switch (status) {
    case 'NOVO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-red-950/70 text-red-300 border border-red-800/60">
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          Novo
        </span>
      );
    case 'VISUALIZADO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          Visualizado
        </span>
      );
    case 'TRATADO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Tratado
        </span>
      );
    case 'ATIVO':
    case 'ATIVA':
    case 'NORMAL':
    case 'NO_LIMITE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {status === 'NO_LIMITE' ? 'No limite' : status === 'ATIVA' ? 'Ativa' : status === 'ATIVO' ? 'Ativo' : 'Normal'}
        </span>
      );
    case 'ATENCAO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Atenção
        </span>
      );
    case 'EXCEDIDA':
    case 'ANOMALIA':
    case 'INATIVO':
    case 'INATIVA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-950/60 text-red-300 border border-red-800/40">
          <AlertOctagon className="w-3 h-3 text-red-400" />
          {status === 'EXCEDIDA' ? 'Excedida' : status === 'INATIVA' ? 'Inativa' : status === 'INATIVO' ? 'Inativo' : 'Anomalia'}
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">{status}</span>;
  }
};

export const SeverityBadge: React.FC<{ criticality: AlertCriticality }> = ({
  criticality,
}) => {
  if (criticality === 'ALTA') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
        <AlertOctagon className="w-3.5 h-3.5" />
        Alta Criticidade
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <AlertTriangle className="w-3.5 h-3.5" />
      Média Criticidade
    </span>
  );
};

export const SourceBadge: React.FC<{ origin: RecordOrigin }> = ({ origin }) => {
  if (origin === 'SIMULADO') {
    return (
      <span
        title="Dado gerado de forma simulada para demonstração"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-950/80 text-purple-300 border border-purple-800/50"
      >
        <FlaskConical className="w-3 h-3 text-purple-400" />
        SIMULADO
      </span>
    );
  }
  if (origin === 'MANUAL') {
    return (
      <span
        title="Lançamento manual realizado por usuário autorizado"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-950/80 text-sky-300 border border-sky-800/50"
      >
        <User className="w-3 h-3 text-sky-400" />
        Manual
      </span>
    );
  }
  // SENSOR
  return (
    <span
      title="Origem por telemetria de sensor (capacidade de evolução futura)"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
    >
      <Cpu className="w-3 h-3 text-emerald-400" />
      Sensor (Futuro)
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/40">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          Administrador
        </span>
      );
    case 'GESTOR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
          <Briefcase className="w-3 h-3 text-emerald-400" />
          Gestor
        </span>
      );
    case 'OPERACAO':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-800/40">
          <Wrench className="w-3 h-3 text-amber-400" />
          Operação
        </span>
      );
    case 'FINANCEIRO':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-950/70 text-teal-300 border border-teal-800/40">
          <DollarSign className="w-3 h-3 text-teal-400" />
          Financeiro
        </span>
      );
  }
};
