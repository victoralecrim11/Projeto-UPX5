import React, { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  ShieldAlert,
  Search,
  Bell,
  BellRing,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SeverityBadge, StatusBadge } from '../components/shared/Badges';
import {
  formatKwh,
  formatCurrency,
  formatPercent,
  formatDateTime,
} from '../lib/calculations';
import { AlertCriticality, AlertStatus, AlertType, EnergyAlert } from '../types';
import { AlertDetailView } from './AlertDetailView';

/* ────────────────────────────────────────────────────────────────────────────
   Notification Settings — Persisted to localStorage
   ──────────────────────────────────────────────────────────────────────────── */

interface NotificationSettings {
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  emailAddress: string;
  phoneNumber: string;
  immediateOnCritical: boolean;
  criticalThresholdPercent: number;
  digestFrequency: 'IMEDIATO' | 'DIARIO' | 'SEMANAL';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const NOTIF_STORAGE_KEY = 'ecoia_notification_settings';

const defaultNotifSettings: NotificationSettings = {
  channels: { email: true, push: true, sms: false },
  emailAddress: '',
  phoneNumber: '',
  immediateOnCritical: true,
  criticalThresholdPercent: 40,
  digestFrequency: 'IMEDIATO',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

function loadNotifSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return { ...defaultNotifSettings, ...JSON.parse(raw) };
  } catch { /* fallback */ }
  return { ...defaultNotifSettings };
}

function saveNotifSettings(s: NotificationSettings) {
  try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/* ────────────────────────────────────────────────────────────────────────────
   Export Utilities — Excel & PDF
   ──────────────────────────────────────────────────────────────────────────── */

function exportAlertsToExcel(
  alerts: EnergyAlert[],
  getPointName: (id: string) => string,
  getUnitName: (id: string) => string,
) {
  const headers = [
    'ID', 'Data/Hora', 'Título', 'Tipo', 'Criticidade', 'Status',
    'Ponto de Medição', 'Unidade', 'Consumo (kWh)', 'Referência (kWh)',
    'Desvio (%)', 'Custo Estimado (R$)', 'Descrição',
  ];

  const rows = alerts.map((a) => ([
    a.id,
    formatDateTime(a.timestamp),
    a.title,
    a.type === 'CONSUMO_EXCESSIVO' ? 'Consumo Excessivo' : 'Consumo Ocioso',
    a.criticality === 'ALTA' ? 'Alta' : 'Média',
    a.status === 'NOVO' ? 'Novo' : a.status === 'VISUALIZADO' ? 'Visualizado' : 'Tratado',
    getPointName(a.pointId),
    getUnitName(a.unitId),
    Number(a.observedKwh.toFixed(1)),
    Number(a.referenceKwh.toFixed(1)),
    Number(a.deviationPercent.toFixed(1)),
    a.estimatedCost !== null ? Number(a.estimatedCost.toFixed(2)) : '',
    a.description,
  ]));

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[i] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Alertas');

  XLSX.writeFile(wb, `alertas-ecoia-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportAlertsToPdf(
  alerts: EnergyAlert[],
  getPointName: (id: string) => string,
  getUnitName: (id: string) => string,
  stats: { total: number; novos: number; visualizados: number; tratados: number; altos: number },
) {
  const totalCost = alerts.reduce((s, a) => s + (a.estimatedCost || 0), 0);
  const avgDeviation = alerts.length
    ? alerts.reduce((s, a) => s + a.deviationPercent, 0) / alerts.length
    : 0;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório de Alertas — EcoIA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; font-size: 11px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; color: #0f172a; }
    .header p { color: #64748b; font-size: 11px; margin-top: 4px; }
    .header .date { color: #64748b; font-size: 11px; text-align: right; }
    .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi .value { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .kpi .label { font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi.red .value { color: #ef4444; }
    .kpi.amber .value { color: #f59e0b; }
    .kpi.green .value { color: #10b981; }
    .kpi.blue .value { color: #3b82f6; }
    .summary { margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead th { background: #0f172a; color: white; padding: 8px 6px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .badge-alta { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-media { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-novo { background: #fef2f2; color: #dc2626; }
    .badge-visualizado { background: #eff6ff; color: #2563eb; }
    .badge-tratado { background: #ecfdf5; color: #059669; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } @page { margin: 15mm; size: A4 landscape; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📊 Relatório de Alertas de Energia</h1>
      <p>EcoIA — Sistema de Monitoramento Inteligente de Energia</p>
    </div>
    <div class="date">
      <strong>Gerado em:</strong><br/>${new Date().toLocaleString('pt-BR')}
    </div>
  </div>

  <div class="kpis">
    <div class="kpi blue"><div class="value">${alerts.length}</div><div class="label">Total Filtrado</div></div>
    <div class="kpi red"><div class="value">${stats.novos}</div><div class="label">Novos</div></div>
    <div class="kpi amber"><div class="value">${stats.visualizados}</div><div class="label">Visualizados</div></div>
    <div class="kpi green"><div class="value">${stats.tratados}</div><div class="label">Tratados</div></div>
    <div class="kpi red"><div class="value">${stats.altos}</div><div class="label">Alta Criticidade</div></div>
  </div>

  <div class="summary">
    Resumo Consolidado: <span>${alerts.length}</span> alertas no período selecionado.
    Desvio médio de <span>${avgDeviation.toFixed(1)}%</span>.
    Impacto financeiro estimado total: <span>R$ ${totalCost.toFixed(2)}</span>.
  </div>

  <table>
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Título</th>
        <th>Tipo</th>
        <th>Criticidade</th>
        <th>Status</th>
        <th>Ponto</th>
        <th>Unidade</th>
        <th>Consumo</th>
        <th>Desvio</th>
        <th>Custo Est.</th>
      </tr>
    </thead>
    <tbody>
      ${alerts.map((a) => `
        <tr>
          <td style="white-space:nowrap">${formatDateTime(a.timestamp)}</td>
          <td>${a.title}</td>
          <td>${a.type === 'CONSUMO_EXCESSIVO' ? 'Excessivo' : 'Ocioso'}</td>
          <td><span class="badge badge-${a.criticality.toLowerCase()}">${a.criticality}</span></td>
          <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
          <td>${getPointName(a.pointId)}</td>
          <td>${getUnitName(a.unitId)}</td>
          <td style="font-variant-numeric:tabular-nums">${a.observedKwh.toFixed(1)} kWh</td>
          <td style="color:#dc2626;font-weight:600">+${a.deviationPercent.toFixed(1)}%</td>
          <td style="font-variant-numeric:tabular-nums">${a.estimatedCost !== null ? 'R$ ' + a.estimatedCost.toFixed(2) : '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>EcoIA — Relatório gerado automaticamente pelo painel de alertas.</span>
    <span>Página 1</span>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────────────────── */

export const AlertsView: React.FC = () => {
  const { alerts, points, units, selectedAlertId, setSelectedAlertId, navigateTo, markAlertViewed } = useApp();

  // If a specific alert is selected, render AlertDetailView
  if (selectedAlertId) {
    return (
      <AlertDetailView
        alertId={selectedAlertId}
        onBack={() => {
          setSelectedAlertId(null);
          navigateTo('alertas');
        }}
      />
    );
  }

  // Filter states
  const [filterCriticality, setFilterCriticality] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Notification settings panel
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(loadNotifSettings);
  const [notifSaved, setNotifSaved] = useState(false);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Helpers
  const getPointName = useCallback((id: string) => points.find((p) => p.id === id)?.name || id, [points]);
  const getUnitName = useCallback((id: string) => units.find((u) => u.id === id)?.name || id, [units]);

  // Counts
  const stats = useMemo(() => {
    const total = alerts.length;
    const novos = alerts.filter((a) => a.status === 'NOVO').length;
    const visualizados = alerts.filter((a) => a.status === 'VISUALIZADO').length;
    const tratados = alerts.filter((a) => a.status === 'TRATADO').length;
    const altos = alerts.filter((a) => a.criticality === 'ALTA' && a.status !== 'TRATADO').length;
    return { total, novos, visualizados, tratados, altos };
  }, [alerts]);

  // Filtered list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const point = points.find((p) => p.id === a.pointId);
      const unit = units.find((u) => u.id === a.unitId);

      const matchesCrit = filterCriticality === 'ALL' || a.criticality === filterCriticality;
      const matchesType = filterType === 'ALL' || a.type === filterType;
      const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        a.title.toLowerCase().includes(term) ||
        (point?.name && point.name.toLowerCase().includes(term)) ||
        (unit?.name && unit.name.toLowerCase().includes(term));

      return matchesCrit && matchesType && matchesStatus && matchesSearch;
    });
  }, [alerts, points, units, filterCriticality, filterType, filterStatus, searchTerm]);

  // Notification handlers
  const updateNotif = (patch: Partial<NotificationSettings>) => {
    setNotifSettings((prev) => ({ ...prev, ...patch }));
    setNotifSaved(false);
  };

  const updateChannel = (channel: keyof NotificationSettings['channels'], value: boolean) => {
    setNotifSettings((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: value },
    }));
    setNotifSaved(false);
  };

  const handleSaveNotif = () => {
    saveNotifSettings(notifSettings);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Painel de Alertas de Energia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Monitoramento de anomalias estatísticas, sobreconsumo e eventos ociosos fora da janela operacional.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Settings Toggle */}
          <button
            onClick={() => setShowNotifSettings(!showNotifSettings)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              showNotifSettings
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-600 hover:text-white'
            }`}
            title="Configurações de Notificação"
          >
            <BellRing className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-emerald-600 hover:text-white transition-all cursor-pointer"
              title="Exportar Relatório"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => {
                        exportAlertsToExcel(filteredAlerts, getPointName, getUnitName);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <div className="font-semibold">Exportar Excel</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Planilha .xlsx nativa</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        exportAlertsToPdf(filteredAlerts, getPointName, getUnitName, stats);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      <div className="text-left">
                        <div className="font-semibold">Exportar PDF</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Relatório consolidado para impressão</div>
                      </div>
                    </button>
                  </div>
                  <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-slate-500">
                    {filteredAlerts.length} alerta(s) serão exportados
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Notification Settings Panel ─── */}
      {showNotifSettings && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Configurações de Notificação</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Defina canais de aviso e limites para envio imediato de alertas críticos.</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifSettings(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Channels Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wider">
              Canais de Notificação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Email */}
              <div
                onClick={() => updateChannel('email', !notifSettings.channels.email)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  notifSettings.channels.email
                    ? 'border-emerald-500/60 bg-emerald-950/30'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Mail className={`w-5 h-5 ${notifSettings.channels.email ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${notifSettings.channels.email ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifSettings.channels.email ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </div>
                <div className="text-xs font-semibold text-white">E-mail</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Receba alertas na caixa de entrada</div>
              </div>

              {/* Push */}
              <div
                onClick={() => updateChannel('push', !notifSettings.channels.push)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  notifSettings.channels.push
                    ? 'border-emerald-500/60 bg-emerald-950/30'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className={`w-5 h-5 ${notifSettings.channels.push ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${notifSettings.channels.push ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifSettings.channels.push ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </div>
                <div className="text-xs font-semibold text-white">Notificação Push</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Alertas no navegador e dispositivo</div>
              </div>

              {/* SMS */}
              <div
                onClick={() => updateChannel('sms', !notifSettings.channels.sms)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  notifSettings.channels.sms
                    ? 'border-emerald-500/60 bg-emerald-950/30'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className={`w-5 h-5 ${notifSettings.channels.sms ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${notifSettings.channels.sms ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifSettings.channels.sms ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </div>
                <div className="text-xs font-semibold text-white">SMS</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Mensagens de texto para urgências</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endereço de E-mail
              </label>
              <input
                type="email"
                value={notifSettings.emailAddress}
                onChange={(e) => updateNotif({ emailAddress: e.target.value })}
                placeholder="operador@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Número de Telefone (SMS)
              </label>
              <input
                type="tel"
                value={notifSettings.phoneNumber}
                onChange={(e) => updateNotif({ phoneNumber: e.target.value })}
                placeholder="+55 (11) 99999-9999"
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Critical Threshold & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Immediate on Critical */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Envio Imediato em Críticos</span>
                <div
                  onClick={() => updateNotif({ immediateOnCritical: !notifSettings.immediateOnCritical })}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    notifSettings.immediateOnCritical ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifSettings.immediateOnCritical ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Notificar imediatamente quando um alerta de alta criticidade for gerado.
              </p>
            </div>

            {/* Threshold */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Limiar Crítico de Desvio
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={notifSettings.criticalThresholdPercent}
                  onChange={(e) => updateNotif({ criticalThresholdPercent: Number(e.target.value) })}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-slate-700 accent-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-bold font-mono text-emerald-400 min-w-[40px] text-right">
                  {notifSettings.criticalThresholdPercent}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Alertas com desvio acima deste valor disparam notificação imediata.
              </p>
            </div>

            {/* Digest Frequency */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Frequência de Resumo
              </label>
              <select
                value={notifSettings.digestFrequency}
                onChange={(e) => updateNotif({ digestFrequency: e.target.value as NotificationSettings['digestFrequency'] })}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="IMEDIATO">Imediato (cada alerta)</option>
                <option value="DIARIO">Resumo Diário</option>
                <option value="SEMANAL">Resumo Semanal</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Para alertas de média criticidade.
              </p>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-slate-300">Horário de Silêncio</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Suspender notificações não críticas durante este período.</p>
              </div>
              <div
                onClick={() => updateNotif({ quietHoursEnabled: !notifSettings.quietHoursEnabled })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  notifSettings.quietHoursEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notifSettings.quietHoursEnabled ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
            </div>
            {notifSettings.quietHoursEnabled && (
              <div className="flex items-center gap-3 mt-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Início</label>
                  <input
                    type="time"
                    value={notifSettings.quietHoursStart}
                    onChange={(e) => updateNotif({ quietHoursStart: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <span className="text-slate-500 mt-4">até</span>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Fim</label>
                  <input
                    type="time"
                    value={notifSettings.quietHoursEnd}
                    onChange={(e) => updateNotif({ quietHoursEnd: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Configurações salvas localmente no navegador.</span>
            </div>
            <button
              onClick={handleSaveNotif}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm ${
                notifSaved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {notifSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Novos Alertas</span>
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white tabular-nums truncate">
            {stats.novos}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Visualizados</span>
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-200 tabular-nums truncate">
            {stats.visualizados}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate">Tratados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums truncate">
            {stats.tratados}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-xs text-slate-400 gap-1.5">
            <span className="truncate" title="Alta Criticidade Ativa">Alta Criticidade</span>
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums truncate">
            {stats.altos}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por ponto, título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Criticidade */}
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todas as Criticidades</option>
            <option value="ALTA">Alta Criticidade</option>
            <option value="MEDIA">Média Criticidade</option>
          </select>

          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="CONSUMO_EXCESSIVO">Consumo Excessivo</option>
            <option value="CONSUMO_OCIOSO">Consumo Ocioso</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Todos os Status</option>
            <option value="NOVO">Novo</option>
            <option value="VISUALIZADO">Visualizado</option>
            <option value="TRATADO">Tratado</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {filteredAlerts.length} alerta(s)
        </div>
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            Nenhum alerta localizado para os critérios aplicados.
          </div>
        ) : (
          filteredAlerts.map((al) => {
            const point = points.find((p) => p.id === al.pointId);
            const unit = units.find((u) => u.id === al.unitId);

            return (
              <div
                key={al.id}
                onClick={() => {
                  markAlertViewed(al.id);
                  navigateTo('alertas', al.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  al.status === 'NOVO'
                    ? 'bg-slate-900/90 border-red-900/50 hover:border-red-700/80 shadow-xs'
                    : al.status === 'TRATADO'
                    ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      al.criticality === 'ALTA'
                        ? 'bg-red-950/80 border border-red-800/60 text-red-400'
                        : 'bg-amber-950/80 border border-amber-800/60 text-amber-400'
                    }`}
                  >
                    <AlertOctagon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <SeverityBadge criticality={al.criticality} />
                      <StatusBadge status={al.status} />
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDateTime(al.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {al.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {al.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>
                        Ponto: <strong className="text-slate-300 font-sans">{point?.name}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Unidade: <strong className="text-slate-300 font-sans">{unit?.name}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics & CTA */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left md:text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">Consumo Observado</div>
                    <div className="text-base font-bold text-white">
                      {formatKwh(al.observedKwh)}
                    </div>
                    <div className="text-[11px] text-red-400 font-semibold">
                      {formatPercent(al.deviationPercent)} vs ref.
                    </div>
                  </div>

                  {al.estimatedCost !== null && (
                    <div className="text-left md:text-right font-mono tabular-nums hidden sm:block">
                      <div className="text-xs text-slate-400">Impacto Estimado</div>
                      <div className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(al.estimatedCost)}
                      </div>
                      <div className="text-[10px] text-slate-400">Tarifa vigente</div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>Detalhes</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
