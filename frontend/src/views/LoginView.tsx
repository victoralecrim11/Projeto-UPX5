import React, { useState } from 'react';
import {
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TwoFactorModal } from '../components/shared/TwoFactorModal';
import { RoleBadge } from '../components/shared/Badges';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [email, setEmail] = useState('admin@ecoia.demo');
  const [password, setPassword] = useState('demo123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [simulate2FA, setSimulate2FA] = useState(false);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const demoAccounts = [
    {
      role: 'ADMIN' as UserRole,
      email: 'admin@ecoia.demo',
      name: 'Ricardo Torres',
      desc: 'Acesso irrestrito a configurações, usuários e auditoria',
    },
    {
      role: 'GESTOR' as UserRole,
      email: 'gestor@ecoia.demo',
      name: 'Beatriz Carvalho',
      desc: 'Supervisão de metas, relatórios, dashboards e alertas',
    },
    {
      role: 'OPERACAO' as UserRole,
      email: 'operacao@ecoia.demo',
      name: 'Lucas Prado',
      desc: 'Lançamentos manuais, pontos de medição e tratamento',
    },
    {
      role: 'FINANCEIRO' as UserRole,
      email: 'financeiro@ecoia.demo',
      name: 'Amanda Rocha',
      desc: 'Gestão de tarifas, custos estimados e relatórios executivos',
    },
  ];

  const handleSelectAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('demo123456');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (simulate2FA) {
      setIs2FAOpen(true);
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  const handle2FASuccess = async () => {
    setIs2FAOpen(false);
    const result = await login(email, password);
    if (!result.success) setErrorMsg(result.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-xl shadow-emerald-950/50 mb-2">
            <Zap className="w-8 h-8 fill-slate-950 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">EcoIA</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Plataforma Inteligente para Monitoramento do Consumo de Energia Elétrica
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Acesso Corporativo</h2>
            <span className="text-[11px] text-slate-400">
              Autenticação via API EcoIA (RF-001) · senha de demonstração: demo123456
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 p-0.5 rounded cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-2 pt-1 text-[11px]">
              <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Lembrar meu acesso neste dispositivo</span>
              </label>

              {/* 2FA Demo checkbox (RF-002) */}
              <label className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulate2FA}
                  onChange={(e) => setSimulate2FA(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Simular etapa de autenticação em dois fatores (2FA)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-950/50 cursor-pointer"
            >
              <span>Entrar na Plataforma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Profile Selector (Section 9) */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
              Perfis de Demonstração (Clique para selecionar):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc.email)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    email === acc.email
                      ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold truncate">{acc.name}</span>
                    <RoleBadge role={acc.role} />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 block truncate">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          EcoIA Demo Industries S.A. · Versão MVP 2.1
        </div>
      </div>

      {/* 2FA Modal */}
      <TwoFactorModal
        isOpen={is2FAOpen}
        onSuccess={handle2FASuccess}
        onClose={() => setIs2FAOpen(false)}
      />
    </div>
  );
};
