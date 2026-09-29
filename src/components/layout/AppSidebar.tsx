import React from 'react';
import {
  Zap,
  LayoutDashboard,
  Activity,
  Gauge,
  Building2,
  Target,
  AlertOctagon,
  Lightbulb,
  FileBarChart,
  GitBranch,
  Coins,
  Users,
  History,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { RoleBadge } from '../shared/Badges';

interface AppSidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badgeCount?: number;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { currentRoute, navigateTo, currentUser, alerts } = useApp();

  const activeAlertsCount = alerts.filter(
    (a) => a.status === 'NOVO' || a.status === 'VISUALIZADO'
  ).length;

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: 'VISÃO GERAL',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO', 'FINANCEIRO'],
        },
      ],
    },
    {
      groupTitle: 'MONITORAMENTO',
      items: [
        {
          id: 'consumo',
          label: 'Consumo',
          icon: Activity,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO', 'FINANCEIRO'],
        },
        {
          id: 'pontos-medicao',
          label: 'Pontos de medição',
          icon: Gauge,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO'],
        },
        {
          id: 'unidades',
          label: 'Unidades',
          icon: Building2,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO'],
        },
        {
          id: 'metas',
          label: 'Metas',
          icon: Target,
          roles: ['ADMIN', 'GESTOR', 'FINANCEIRO'],
        },
      ],
    },
    {
      groupTitle: 'INTELIGÊNCIA',
      items: [
        {
          id: 'alertas',
          label: 'Alertas',
          icon: AlertOctagon,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO'],
          badgeCount: activeAlertsCount > 0 ? activeAlertsCount : undefined,
        },
        {
          id: 'analises',
          label: 'Análises e insights',
          icon: Lightbulb,
          roles: ['ADMIN', 'GESTOR', 'OPERACAO'],
        },
      ],
    },
    {
      groupTitle: 'GESTÃO',
      items: [
        {
          id: 'relatorios',
          label: 'Relatórios',
          icon: FileBarChart,
          roles: ['ADMIN', 'GESTOR', 'FINANCEIRO'],
        },
        {
          id: 'automacoes',
          label: 'Automações',
          icon: GitBranch,
          roles: ['ADMIN', 'GESTOR'],
        },
      ],
    },
    {
      groupTitle: 'ADMINISTRAÇÃO',
      items: [
        {
          id: 'tarifas',
          label: 'Tarifas e custos',
          icon: Coins,
          roles: ['ADMIN', 'GESTOR', 'FINANCEIRO'],
        },
        {
          id: 'usuarios',
          label: 'Usuários e acessos',
          icon: Users,
          roles: ['ADMIN'],
        },
        {
          id: 'auditoria',
          label: 'Auditoria',
          icon: History,
          roles: ['ADMIN'],
        },
        {
          id: 'configuracoes',
          label: 'Configurações',
          icon: Sliders,
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    navigateTo(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/40">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  EcoIA
                </span>
                <span className="text-[10px] text-emerald-400 font-mono tracking-wide uppercase">
                  Energia Elétrica
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navigationGroups.map((group) => {
            // Filter items user has permission to see in menu
            const visibleItems = group.items.filter((item) =>
              currentUser ? item.roles.includes(currentUser.role) : false
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono mb-2">
                    {group.groupTitle}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentRoute === item.id ||
                    (item.id === 'alertas' && currentRoute.startsWith('alertas/'));

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600/15 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!isCollapsed && item.badgeCount !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600/90 text-white font-mono">
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card in Footer */}
        {currentUser && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {currentUser.name}
                  </p>
                  <div className="mt-0.5">
                    <RoleBadge role={currentUser.role} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  {currentUser.name[0]}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
