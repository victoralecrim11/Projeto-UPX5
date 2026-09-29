# EcoIA — Plataforma Inteligente para Monitoramento do Consumo de Energia Elétrica

> **MVP Frontend de Alta Fidelidade** voltado exclusivamente para o monitoramento, análise explicável, gestão de metas e detecção de anomalias no consumo de **energia elétrica**.

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

- **Framework**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS v4 com paleta B2B especializada (tons petróleo, slate profundo, acentos em verde esmeralda e âmbar)
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Animações**: Motion
- **Estado**: Context API reativo com persistência em `localStorage`
- **Validação & Testes**: Regras estatísticas puras isoladas em `src/lib/calculations.ts`

---

## 📁 4. Estrutura de Diretórios

```
/
├── index.html                 # Entry point HTML com metadados do EcoIA
├── metadata.json              # Configurações do applet
├── package.json               # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
├── vite.config.ts             # Configuração do Vite e Tailwind
└── src/
    ├── main.tsx               # Montagem do React no DOM
    ├── App.tsx                # Roteamento e layout com sidebar recolhível
    ├── index.css              # Importação do Tailwind CSS v4
    ├── types/                 # Interfaces do domínio de energia (RBAC, Metas, Pontos, etc.)
    │   └── index.ts
    ├── lib/                   # Funções puras de cálculo estatístico e formatação
    │   ├── calculations.ts
    │   └── calculations.test.ts
    ├── data/                  # Conjunto de dados simulados (fixtures)
    │   └── fixtures.ts
    ├── context/               # Estado global da aplicação e persistência
    │   └── AppContext.tsx
    ├── components/
    │   ├── layout/            # Sidebar, Header e dropdown de notificações
    │   │   ├── AppHeader.tsx
    │   │   ├── AppSidebar.tsx
    │   │   └── NotificationDropdown.tsx
    │   └── shared/            # Componentes reutilizáveis do Design System
    │       ├── Badges.tsx
    │       ├── FilterBar.tsx
    │       ├── RecommendationCard.tsx
    │       ├── AccessDenied.tsx
    │       └── TwoFactorModal.tsx
    └── views/                 # Telas da aplicação
        ├── LoginView.tsx
        ├── DashboardView.tsx
        ├── ConsumptionView.tsx
        ├── PointsView.tsx
        ├── UnitsView.tsx
        ├── GoalsView.tsx
        ├── AlertsView.tsx
        ├── AlertDetailView.tsx
        ├── InsightsView.tsx
        ├── ReportsView.tsx
        ├── AutomationsView.tsx
        ├── TariffsView.tsx
        ├── UsersView.tsx
        ├── AuditView.tsx
        └── SettingsView.tsx
```

---

## 💻 5. Instruções de Execução

### Instalação de Dependências
```bash
npm install
```

### Execução em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor será iniciado na porta local `3000` (acessível em `http://localhost:3000`).

### Validação de Tipagem
```bash
npm run lint
```

### Build de Produção
```bash
npm run build
```

---

## 🔒 6. Perfis para Demonstração

| Perfil | E-mail de Teste | Permissões |
|---|---|---|
| **Administrador** | `admin@ecoia.demo` | Acesso total a todas as áreas, usuários, configurações e auditoria |
| **Gestor** | `gestor@ecoia.demo` | Visão geral, monitoramento, metas, alertas, relatórios e automações |
| **Operação** | `operacao@ecoia.demo` | Visualização de consumo, cadastro manual de medições e tratamento de alertas |
| **Financeiro** | `financeiro@ecoia.demo` | Foco em estimativas de custos, configurações de tarifas e relatórios executivos |
