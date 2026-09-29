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

const MainLayout: React.FC = () => {
  const { currentRoute, currentUser } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onToggleMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
    </AppProvider>
  );
}
