import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RoleBadge, StatusBadge } from '../components/shared/Badges';
import { AccessDenied } from '../components/shared/AccessDenied';
import { formatDateTime } from '../lib/calculations';
import { UserRole } from '../types';

export const UsersView: React.FC = () => {
  const {
    hasPermission,
    currentUser,
    switchUserRole,
    users: usersList,
    addUser,
    toggleUserActive,
  } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('OPERACAO');
  const [formError, setFormError] = useState('');

  // RBAC Guard
  if (!hasPermission(['ADMIN'])) {
    return <AccessDenied requiredRoles={['Administrador']} />;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    // Sem senha informada, o backend atribui a senha de demonstração.
    const result = await addUser({ name, email, role });
    if (!result.success) {
      setFormError(result.message);
      return;
    }
    setFormError('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Usuários e Controle de Acessos (RBAC)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Gerenciamento de contas, perfis corporativos e permissões na plataforma EcoIA.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setEmail('');
            setRole('OPERACAO');
            setFormError('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Roles Legend Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RoleBadge role="ADMIN" />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Acesso total irrestrito: usuários, limiares, tarifas e auditoria.
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RoleBadge role="GESTOR" />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Gestão estratégica: metas, relatórios, visualização de custos e alertas.
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RoleBadge role="OPERACAO" />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Operação de campo: lançamento manual de leituras e tratamento de alertas.
          </p>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <RoleBadge role="FINANCEIRO" />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Financeiro: configuração de tarifas, custos estimados e relatórios.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Nome do Usuário</th>
                <th className="px-4 py-3">E-mail Corporativo</th>
                <th className="px-4 py-3">Perfil de Acesso</th>
                <th className="px-4 py-3">Último Acesso</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ação Demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200">
                        {u.name[0]}
                      </div>
                      <span>{u.name}</span>
                      {currentUser?.id === u.id && (
                        <span className="text-[10px] font-mono text-emerald-400">(Você)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={u.active ? 'ATIVO' : 'INATIVO'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => switchUserRole(u.role)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                        title="Simular navegação com este usuário"
                      >
                        Simular Acesso
                      </button>
                      <button
                        onClick={() => toggleUserActive(u.id)}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        {u.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-base font-bold text-white">Novo Usuário do Sistema</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-red-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="joao@ecoia.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Perfil de Acesso (RBAC) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                >
                  <option value="ADMIN">Administrador (Total)</option>
                  <option value="GESTOR">Gestor de Energia</option>
                  <option value="OPERACAO">Operação / Facilities</option>
                  <option value="FINANCEIRO">Analista Financeiro</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
