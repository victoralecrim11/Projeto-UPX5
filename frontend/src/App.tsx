import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ConsumptionView } from './views/ConsumptionView';
import { PointsView } from './views/PointsView';
import { UnitsView } from './views/UnitsView';
import { GoalsView } from './views/GoalsView';
import { AlertsView } from './views/AlertsView';
import { InsightsView } from './views/InsightsView';
import { ReportsView } from './views/ReportsView';
import { AutomationsView } from './views/AutomationsView';
import { TariffsView } from './views/TariffsView';
import { UsersView } from './views/UsersView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';

const ApiErrorToast: React.FC = () => {
  const { errorMessage, clearError } = useApp();
  if (!errorMessage) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 flex items-start gap-3 p-3 rounded-xl bg-red-950/95 border border-red-800 text-red-100 text-xs shadow-2xl"
    >
      <span className="flex-1 leading-relaxed">{errorMessage}</span>
      <button
        onClick={clearError}
        className="text-red-300 hover:text-white font-semibold cursor-pointer"
        aria-label="Fechar aviso"
      >
        ✕
      </button>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentRoute, currentUser, isLoading } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Carregando dados da plataforma…
      </div>
    );
  }

  // If user is not logged in or explicitly on login screen
  if (!currentUser || currentRoute === 'login') {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView />;
      case 'consumo':
        return <ConsumptionView />;
      case 'pontos-medicao':
        return <PointsView />;
      case 'unidades':
        return <UnitsView />;
      case 'metas':
        return <GoalsView />;
      case 'alertas':
        return <AlertsView />;
      case 'analises':
        return <InsightsView />;
      case 'relatorios':
        return <ReportsView />;
      case 'automacoes':
        return <AutomationsView />;
      case 'tarifas':
        return <TariffsView />;
      case 'usuarios':
        return <UsersView />;
      case 'auditoria':
        return <AuditView />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans antialiased">
      {/* App Sidebar */}
      <AppSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AppHeader onToggleMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto min-w-0">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <ApiErrorToast />
    </AppProvider>
  );
}
