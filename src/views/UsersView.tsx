import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RoleBadge, StatusBadge } from '../components/shared/Badges';
import { AccessDenied } from '../components/shared/AccessDenied';
import { formatDateTime } from '../lib/calculations';
import { UserRole, User } from '../types';
import { initialUsers } from '../data/fixtures';

export const UsersView: React.FC = () => {
  const { hasPermission, currentUser, switchUserRole } = useApp();
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('OPERACAO');

  // RBAC Guard
  if (!hasPermission(['ADMIN'])) {
    return <AccessDenied requiredRoles={['Administrador']} />;
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organizationId: 'org-ecoia-01',
      active: true,
      lastLogin: new Date().toISOString(),
    };

    setUsersList((prev) => [...prev, newUser]);
    setIsModalOpen(false);
  };

  const toggleUserActive = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Novo Usuário do Sistema</h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Perfil de Acesso (RBAC) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
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
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
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
