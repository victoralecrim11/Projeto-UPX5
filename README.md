# EcoIA — Plataforma Inteligente para Monitoramento do Consumo de Energia Elétrica

> **MVP Full-stack (React + API Node/Express)** voltado exclusivamente para o monitoramento, análise explicável, gestão de metas e detecção de anomalias no consumo de **energia elétrica**.

---

## ⚡ 1. Visão Geral do Produto

O **EcoIA** é um SaaS B2B moderno projetado para responder seis perguntas operacionais fundamentais da gestão energética:

1. **O consumo de energia elétrica está dentro do esperado?**
2. **Qual é o gasto estimado?** (calculado via tarifas homologadas e transparentes)
3. **Existe consumo excessivo ou consumo ocioso?** (anomalias fora do horário operacional ou desvios em relação à média móvel)
4. **Onde o desvio aconteceu?** (visão granular por Unidade e Ponto de Medição)
5. **Por que o sistema gerou o alerta?** (IA Explicável com dados observados vs. linha de base de 7 dias)
6. **Que ação de investigação pode ser tomada?** (recomendações investigativas direcionadas para operadores e gestores)

> ⚠️ **Escopo Estrito de Domínio**: O EcoIA monitora **exclusivamente energia elétrica** (grandezas em kWh, kW e valores monetários estimados em R$). Não abrange água, resíduos, créditos de carbono, emissões de CO₂ ou faturamento/emissão de faturas reais de concessionárias.

---

## 🚀 2. Funcionalidades do MVP Frontend

### 📊 Visão Geral & Dashboard
- **Cards de Métricas Principais**: Consumo total no período (kWh), Gasto estimado (R$), Desempenho em relação à meta (%) e Alertas ativos categorizados por severidade.
- **Gráficos Temporais Interativos**:
  - Evolução temporal diária com preenchimento em gradiente e comparativo de período anterior.
  - Distribuição percentual do consumo por Unidade e Ponto de Medição.
- **Painel de Insights da EcoIA**: Recomendações explicáveis com motivo, evidência estatística (desvio vs. média móvel de 7 dias) e ação sugerida de investigação.

### 🔌 Monitoramento & Medições
- **Consumo Histórico**: Tabela com paginação, filtros de período (7d, 30d, 90d ou personalizado), unidade, ponto de medição e busca. Modal de inserção manual de consumo e exportação para CSV.
- **Pontos de Medição**: Cadastro e listagem de pontos categorizados por tipo (Climatização, Iluminação, Produção, Data Center, Subestação, Geral), incluindo horários operacionais e dias de funcionamento para detecção de consumo ocioso.
- **Unidades Organizacionais**: Visão de filiais/plantas (ex.: Matriz Administrativa, Unidade Industrial, Centro de Distribuição) com responsáveis, endereço e status operacional.
- **Metas de Consumo**: Definição de limites mensais/diários em kWh por organização, unidade ou ponto específico, com barras de progresso e alertas visuais de estouro.

### 🧠 Inteligência & Alertas
- **Central de Alertas**: Filtros por criticidade (Alta, Média), tipo (Consumo Excessivo, Consumo Ocioso) e status (Novo, Visualizado, Tratado).
- **Detalhe do Alerta (/alertas/:id)**:
  - Classificação e cálculo exato do desvio percentual.
  - Explicação passo a passo do motivo do disparo da regra estatística.
  - Ações de tratamento: registrar anotação técnica e atualizar status para "Tratado" com registro imediato na trilha de auditoria.
  - *Disclaimer legal*: recomendações têm caráter investigativo e consultivo.

### 📋 Gestão & Relatórios
- **5 Modelos de Relatórios Prontos**:
  1. Consumo Consolidado por Período
  2. Demonstrativo de Gastos Estimados por Unidade
  3. Desempenho e Aderência a Metas
  4. Relatório Executivo de Alertas e Anomalias
  5. Diagnóstico de Eficiência dos Pontos de Medição
- **Exportação & Impressão**: Suporte a download de CSV estruturado e impressão direta (`window.print`).

### ⚙️ Governança & Administração (RBAC)
- **Controle de Acesso Baseado em Funções (RBAC)**:
  - **Administrador**: Acesso total, incluindo usuários, configurações e auditoria.
  - **Gestor**: Gestão operacional, metas, alertas e relatórios.
  - **Operação**: Visualização de consumo, tratamento de alertas e registro manual.
  - **Financeiro**: Foco em estimativas de custos, tarifas e relatórios executivos.
- **Configuração de Tarifas**: Gestão do custo por kWh por escopo com transparência do cálculo (`Custo = kWh × R$/kWh`).
- **Trilha de Auditoria**: Registro imutável de todas as ações de inserção de medições, alterações de limiares, criação de regras e tratamento de alertas.
- **Limiares Parametrizáveis**: Ajuste fino do percentual de desvio para anomalias médias (padrão: 20%) e altas (padrão: 40%).

### 🔐 Demonstração & Autenticação
- Tela de login com suporte a simulação de 2FA (TOTP de 6 dígitos).
- Seletor rápido de perfis de teste (Admin, Gestor, Operação, Financeiro) e alternador instantâneo no cabeçalho.
- Persistência reativa em `localStorage` com opção de restauração rápida para dados de demonstração padrão.

---

## 🛠️ 3. Arquitetura e Tecnologias

O repositório é um monorepo com **npm workspaces**:

| Camada | Pasta | Stack |
|---|---|---|
| **Frontend** | `frontend/` | React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, Lucide, Motion |
| **Backend** | `backend/` | Node.js + Express 5 + TypeScript, JWT, Zod, Vitest |
| **Persistência** | `backend/data/db.json` | Banco em memória persistido em arquivo JSON (escrita atômica) |

- O frontend consome a API REST via `frontend/src/lib/api.ts`; em desenvolvimento o Vite faz proxy de `/api` → `http://localhost:3333`.
- O **motor de regras** (média móvel de 7 dias, consumo ocioso, alertas, recomendações, notificações e automações) roda no servidor (`backend/src/services/consumption.ts`).
- **RBAC** aplicado no backend (`requireRoles`) e espelhado na UI (`hasPermission`).
- Senhas com hash `scrypt`; sessão via **JWT Bearer**.

---

## 📁 4. Estrutura de Diretórios

```
/
├── package.json               # Workspaces + scripts que sobem front e back juntos
├── frontend/
│   ├── index.html
│   ├── vite.config.ts         # Tailwind + proxy /api
│   └── src/
│       ├── App.tsx            # Roteamento, carregamento e aviso de erros da API
│       ├── context/AppContext.tsx   # Estado global sincronizado com a API
│       ├── lib/api.ts         # Cliente HTTP (token JWT, tratamento de 401)
│       ├── lib/calculations.ts      # Formatadores e cálculos de exibição
│       ├── components/  views/  types/
└── backend/
    ├── .env.example
    └── src/
        ├── server.ts  app.ts  config.ts  schemas.ts
        ├── db/store.ts        # Banco JSON (load/persist/reset)
        ├── db/seed.ts         # Dados de demonstração (90 dias determinísticos)
        ├── domain/calculations.ts   # Regras estatísticas puras (+ testes)
        ├── services/          # Motor de consumo e auditoria
        ├── middleware/auth.ts # JWT + RBAC
        └── routes/            # auth, bootstrap, consumo, alertas, gestão, admin
```

### Endpoints da API (`/api`)

| Método | Rota | Perfis |
|---|---|---|
| POST | `/auth/login` · GET `/auth/me` · POST `/auth/switch-role` (demo) | público / autenticado |
| GET | `/bootstrap` (carga inicial de todas as coleções) | autenticado |
| GET | `/units`, `/points`, `/records?pointId&from&to` | autenticado |
| POST/PATCH | `/points`, `/points/:id` | ADMIN, GESTOR |
| POST | `/records` (lançamento manual + análise) | ADMIN, GESTOR, OPERACAO |
| PATCH/DELETE | `/records/:id` | ADMIN, OPERACAO |
| GET | `/alerts`, `/alerts/:id`, `/recommendations`, `/notifications` | autenticado |
| POST | `/alerts/:id/view` · `/alerts/:id/treat` | autenticado · ADMIN, GESTOR, OPERACAO |
| POST | `/notifications/:id/read`, `/notifications/read-all` | autenticado |
| CRUD | `/goals` | ADMIN, GESTOR |
| CRUD | `/tariffs` | ADMIN, FINANCEIRO |
| GET/POST | `/automations`, `/automations/logs`, `/automations/:id/toggle` | ADMIN, GESTOR |
| GET/POST/PATCH | `/users` | ADMIN |
| GET | `/audit-logs` | ADMIN |
| GET/PUT | `/settings/thresholds` | autenticado / ADMIN |
| POST | `/admin/reset` (demo) | autenticado |

---

## 💻 5. Instruções de Execução

```bash
npm install          # instala front e back (workspaces)
npm run dev          # sobe API (:3333) e frontend (:3000) juntos
```

- Frontend: `http://localhost:3000` · API: `http://localhost:3333/api/health`
- Opcional: copie `backend/.env.example` para `backend/.env` (porta, JWT_SECRET, CORS, data de referência).
- Separadamente: `npm run dev:back` / `npm run dev:front`

| Comando | O que faz |
|---|---|
| `npm run lint` | Checagem de tipos do back e do front |
| `npm test` | Testes das regras estatísticas (Vitest) |
| `npm run build` | Build do backend (`backend/dist`) e do frontend (`frontend/dist`) |
| `npm run seed:reset -w backend` | Restaura `db.json` com os dados de demonstração |

---

## 🔒 6. Perfis para Demonstração

Senha de todos os perfis de demonstração: **demo123456**

| Perfil | E-mail de Teste | Permissões |
|---|---|---|
| **Administrador** | `admin@ecoia.demo` | Acesso total a todas as áreas, usuários, configurações e auditoria |
| **Gestor** | `gestor@ecoia.demo` | Visão geral, monitoramento, metas, alertas, relatórios e automações |
| **Operação** | `operacao@ecoia.demo` | Visualização de consumo, cadastro manual de medições e tratamento de alertas |
| **Financeiro** | `financeiro@ecoia.demo` | Foco em estimativas de custos, configurações de tarifas e relatórios executivos |
