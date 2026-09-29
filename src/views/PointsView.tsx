import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  X,
  Edit2,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/Badges';
import { formatKwh, formatCurrency, formatDateTime } from '../lib/calculations';
import { MeasurementPoint, PointType } from '../types';

export const PointsView: React.FC = () => {
  const {
    points,
    units,
    records,
    tariffs,
    alerts,
    goals,
    hasPermission,
    addPoint,
    updatePoint,
  } = useApp();

  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<MeasurementPoint | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [meterId, setMeterId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [type, setType] = useState<PointType>('PRODUCAO');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(18);

  const canManage = hasPermission(['ADMIN', 'GESTOR']);

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setName('');
    setMeterId(`MED-${Math.floor(100 + Math.random() * 900)}`);
    setUnitId(units[0]?.id || '');
    setType('PRODUCAO');
    setLocation('');
    setStatus('ATIVO');
    setStartHour(8);
    setEndHour(18);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: MeasurementPoint) => {
    setEditingPoint(p);
    setName(p.name);
    setMeterId(p.meterIdentifier);
    setUnitId(p.unitId);
    setType(p.type);
    setLocation(p.location);
    setStatus(p.status);
    setStartHour(p.operatingSchedule?.startHour ?? 8);
    setEndHour(p.operatingSchedule?.endHour ?? 18);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !meterId || !unitId) return;

    if (editingPoint) {
      updatePoint(editingPoint.id, {
        name,
        meterIdentifier: meterId,
        unitId,
        type,
        location,
        status,
        operatingSchedule: {
          weekdays: [1, 2, 3, 4, 5],
          startHour,
          endHour,
        },
      });
    } else {
      addPoint({
        name,
        meterIdentifier: meterId,
        unitId,
        type,
        location,
        status,
        operatingSchedule: {
          weekdays: [1, 2, 3, 4, 5],
          startHour,
          endHour,
        },
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Pontos de Medição
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Cadastro de medidores, circuitos e instalações monitoradas com limites operacionais.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Ponto</span>
          </button>
        )}
      </div>

      {/* Grid of Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {points.map((pt) => {
          const unit = units.find((u) => u.id === pt.unitId);
          const ptRecords = records.filter((r) => r.pointId === pt.id);
          const lastRecord = ptRecords[0]; // records sorted desc
          const totalKwh = ptRecords.reduce((acc, r) => acc + r.value, 0);
          const activeAlerts = alerts.filter(
            (a) => a.pointId === pt.id && a.status !== 'TRATADO'
          );

          const tariff = tariffs.find(
            (t) =>
              t.active &&
              (t.targetEntityId === pt.id ||
                t.targetEntityId === pt.unitId ||
                t.scope === 'ORGANIZACAO')
          );

          return (
            <div
              key={pt.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                pt.hasInsufficientHistory
                  ? 'bg-slate-900/60 border-amber-900/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                        {pt.meterIdentifier}
                      </span>
                      <h3 className="text-sm font-bold text-white truncate max-w-[180px]">
                        {pt.name}
                      </h3>
                    </div>
                  </div>

                  <StatusBadge status={pt.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{unit?.name} · {pt.location}</span>
                  </div>

                  {pt.operatingSchedule && (
                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Janela: {pt.operatingSchedule.startHour}:00 às {pt.operatingSchedule.endHour}:00 (Seg-Sex)
                      </span>
                    </div>
                  )}

                  {pt.hasInsufficientHistory && (
                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/50 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>RN-006: Histórico &lt;7 dias (análise estatística em espera).</span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Última Leitura:</span>
                    <span className="font-bold text-white">
                      {lastRecord ? formatKwh(lastRecord.value) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Consumo Total:</span>
                    <span className="font-bold text-emerald-400">
                      {formatKwh(totalKwh)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Detail CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPoint(pt)}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Ver Detalhes</span>
                </button>

                {canManage && (
                  <button
                    onClick={() => handleOpenEdit(pt)}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    title="Editar Ponto de Medição"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer / Modal: Detalhes do Ponto de Medição */}
      {selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPoint.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedPoint.meterIdentifier} · Tipo: {selectedPoint.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Unidade Vinculada:</span>
                <p className="font-semibold text-white mt-0.5">
                  {units.find((u) => u.id === selectedPoint.unitId)?.name}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Localização Específica:</span>
                <p className="text-slate-200 mt-0.5">{selectedPoint.location}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Status Operacional:</span>
                <div className="mt-1">
                  <StatusBadge status={selectedPoint.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Janela de Expediente:</span>
                <p className="font-mono text-slate-200 mt-0.5">
                  {selectedPoint.operatingSchedule
                    ? `${selectedPoint.operatingSchedule.startHour}:00 às ${selectedPoint.operatingSchedule.endHour}:00`
                    : 'Operação Contínua (24h)'}
                </p>
              </div>
            </div>

            {/* Recent Readings List */}
            <div>
              <span className="font-semibold text-slate-300 block mb-2">
                Últimas 5 Leituras Registradas:
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {records
                  .filter((r) => r.pointId === selectedPoint.id)
                  .slice(0, 5)
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800"
                    >
                      <span className="text-slate-400">{formatDateTime(rec.timestamp)}</span>
                      <span className="font-bold text-white">{formatKwh(rec.value)}</span>
                      <span className="text-[11px] text-slate-400 font-sans">({rec.origin})</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPoint(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastro / Edição de Ponto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">
              {editingPoint ? 'Editar Ponto de Medição' : 'Cadastrar Ponto de Medição'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome do Ponto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Climatização Bloco B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Identificador do Medidor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MED-IND-05"
                  value={meterId}
                  onChange={(e) => setMeterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Unidade Vinculada *</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipo de Ponto</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PointType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="PRODUCAO">Produção / Maquinário</option>
                  <option value="CLIMATIZACAO">Climatização / HVAC</option>
                  <option value="ILUMINACAO">Iluminação Setorial</option>
                  <option value="DATA_CENTER">Data Center / TI</option>
                  <option value="SUBESTACAO">Subestação / Entrada</option>
                  <option value="GERAL">Cargas Gerais</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Localização Física</label>
                <input
                  type="text"
                  placeholder="Ex: Pavilhão Sul - Bloco 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Início Expediente (h)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fim Expediente (h)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
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
                  Salvar Ponto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
