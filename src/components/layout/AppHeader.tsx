import React, { useState } from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  LogOut,
  Building,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { RoleBadge } from '../shared/Badges';
import { UserRole } from '../../types';

interface AppHeaderProps {
  onToggleMobileMenu: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentRoute,
    currentUser,
    organization,
    switchUserRole,
    logout,
    resetToDefaultData,
    notifications,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Breadcrumb path calculation
  const getBreadcrumbTitle = (route: string) => {
    switch (route) {
      case 'dashboard':
        return 'Visão Geral / Dashboard';
      case 'consumo':
        return 'Monitoramento / Consumo de Energia';
      case 'pontos-medicao':
        return 'Monitoramento / Pontos de Medição';
      case 'unidades':
        return 'Monitoramento / Unidades';
      case 'metas':
        return 'Monitoramento / Metas de Consumo';
      case 'alertas':
        return 'Inteligência / Alertas';
      case 'analises':
        return 'Inteligência / Análises e Insights';
      case 'relatorios':
        return 'Gestão / Relatórios';
      case 'automacoes':
        return 'Gestão / Automações Digitais';
      case 'tarifas':
        return 'Administração / Tarifas e Custos';
      case 'usuarios':
        return 'Administração / Usuários e Acessos';
      case 'auditoria':
        return 'Administração / Trilha de Auditoria';
      case 'configuracoes':
        return 'Administração / Configurações e Limiares';
      default:
        return 'EcoIA';
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Administrador', desc: 'Acesso total irrestrito' },
    { role: 'GESTOR', label: 'Gestor', desc: 'Metas, alertas, insights e relatórios' },
    { role: 'OPERACAO', label: 'Operação', desc: 'Lançamento de leituras e tratamento de alertas' },
    { role: 'FINANCEIRO', label: 'Financeiro', desc: 'Tarifas, custos estimados e relatórios' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile hamburger + Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Abrir menu lateral de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs truncate">
            <span className="font-semibold text-emerald-400 shrink-0">EcoIA</span>
            <span className="text-slate-600 shrink-0">/</span>
            <span className="text-slate-300 font-medium truncate">
              {getBreadcrumbTitle(currentRoute)}
            </span>
          </nav>
        </div>

        {/* Right: Actions, Role Switcher, Notifications, User */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Organization badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[160px] font-medium">{organization.name}</span>
          </div>

          {/* Demo Reset Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors shadow-xs"
            title="Recarregar conjunto de dados de demonstração (fixtures)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dados Demo</span>
          </button>

          {/* Role Switcher Menu (Essential for testing RBAC requirements) */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors shadow-xs"
              title="Alternar perfil de demonstração (RBAC)"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline font-semibold">Perfil:</span>
              <span className="font-semibold text-emerald-300">{currentUser?.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isRoleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1"
                onMouseLeave={() => setIsRoleMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800 mb-1">
                  Seletor de Perfil Simulado (RBAC)
                </div>
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex flex-col gap-0.5 cursor-pointer ${
                      currentUser?.role === r.role
                        ? 'bg-emerald-950/70 border border-emerald-800/60 text-emerald-200'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.label}</span>
                      {currentUser?.role === r.role && (
                        <span className="text-[10px] text-emerald-400 font-mono">Ativo</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{r.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Abrir central de notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-transparent hover:border-red-950/60 transition-colors cursor-pointer"
            title="Sair da sessão simulada"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Confirm Demo Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Restaurar dados de demonstração?"
        description="Esta ação restaurará todas as 90 medições determinísticas, os 3 alertas de referência (alta anomalia, anomalia média e consumo ocioso), metas e tarifas padrão. Quaisquer registros criados manualmente nesta sessão serão reinicializados."
        confirmLabel="Restaurar Dados"
        onConfirm={() => {
          resetToDefaultData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
