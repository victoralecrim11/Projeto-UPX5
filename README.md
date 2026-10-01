# EcoIA — Plataforma Inteligente para Monitoramento do Consumo de Energia Elétrica

> **MVP Full-stack (React + API Node/Express)** voltado exclusivamente para o monitoramento, análise explicável, gestão de metas e detecção de anomalias no consumo de **energia elétrica**.

---

## 📑 Sumário

1. [Visão Geral do Produto](#-1-visão-geral-do-produto)
2. [Funcionalidades do MVP](#-2-funcionalidades-do-mvp)
3. [Arquitetura e Tecnologias](#️-3-arquitetura-e-tecnologias)
4. [Estrutura de Diretórios](#-4-estrutura-de-diretórios)
5. [Instruções de Execução](#-5-instruções-de-execução)
6. [Perfis para Demonstração](#-6-perfis-para-demonstração)
7. [Backend — API REST](#-7-backend--api-rest)
8. [Regras de Negócio e Motor de Análise](#-8-regras-de-negócio-e-motor-de-análise)
9. [Banco de Dados (db.json)](#️-9-banco-de-dados-dbjson)
10. [Variáveis de Ambiente](#️-10-variáveis-de-ambiente)
11. [Testes e Qualidade](#-11-testes-e-qualidade)
12. [Solução de Problemas](#-12-solução-de-problemas)
13. [Próximos Passos](#️-13-próximos-passos)

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

## 🚀 2. Funcionalidades do MVP

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
- Login real contra a API, com senha (hash `scrypt`) e sessão via **token JWT**.
- Simulação de 2FA (TOTP de 6 dígitos) na tela de login.
- Seletor rápido de perfis de teste (Admin, Gestor, Operação, Financeiro) e alternador instantâneo no cabeçalho (modo demonstração).
- Persistência no servidor (`backend/data/db.json`) com opção de restauração rápida para os dados de demonstração padrão.

### 🖥️ Backend (novo)
- **API REST** em Node.js + Express 5 + TypeScript.
- **Autenticação JWT** e **RBAC validado no servidor**: a API recusa ações de perfis sem permissão, não apenas a interface.
- **Motor de regras no servidor**: média móvel de 7 dias, consumo ocioso, geração de alertas, recomendações explicáveis, notificações e disparo de automações.
- **Trilha de auditoria** gravada automaticamente em toda alteração relevante.
- **Validação de payloads** com Zod e respostas de erro padronizadas.
- **Persistência em arquivo JSON** com escrita atômica (sem banco para instalar).

---

## 🛠️ 3. Arquitetura e Tecnologias

O repositório é um monorepo com **npm workspaces**:

| Camada | Pasta | Stack |
|---|---|---|
| **Frontend** | `frontend/` | React 19 + TypeScript + Vite 8, Tailwind CSS v4, Recharts, Lucide React, Motion |
| **Backend** | `backend/` | Node.js + Express 5 + TypeScript, JSON Web Token, Zod, Vitest, tsx |
| **Persistência** | `backend/data/db.json` | Banco em memória persistido em arquivo JSON (escrita atômica) |

```
┌──────────────────────────┐   HTTP /api/*    ┌──────────────────────────────┐
│  Frontend (React + Vite) │ ───────────────▶ │  Backend (Express 5 + TS)    │
│  localhost:3000          │   JSON + JWT     │  localhost:3333              │
│                          │ ◀─────────────── │                              │
│  AppContext ─ lib/api.ts │                  │  middleware/auth (JWT, RBAC) │
└──────────────────────────┘                  │  routes/* → services/*       │
         ▲  proxy do Vite                     │  domain/calculations (regras)│
         │  /api → :3333                      │  db/store ──▶ data/db.json   │
                                              └──────────────────────────────┘
```

- O frontend consome a API REST via `frontend/src/lib/api.ts`. Em desenvolvimento, o Vite faz proxy de `/api` para `http://localhost:3333`, por isso não há problema de CORS.
- Ao logar, o front chama `GET /api/bootstrap`, que devolve todas as coleções de uma vez. Após cada alteração (POST/PATCH/DELETE), o estado é sincronizado novamente.
- O **motor de regras** roda no servidor (`backend/src/services/consumption.ts`).
- O **RBAC** é aplicado no backend (`requireRoles`) e espelhado na UI (`hasPermission`).
- O token JWT fica no `localStorage` (`ecoia_token`). Se a API responder 401 (sessão expirada), o usuário volta para a tela de login.

---

## 📁 4. Estrutura de Diretórios

```
/
├── package.json                 # Workspaces + scripts que sobem front e back juntos
├── package-lock.json
├── README.md
│
├── frontend/
│   ├── index.html               # Entry point HTML com metadados do EcoIA
│   ├── metadata.json            # Configurações do applet
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts           # Plugins React/Tailwind + proxy /api → backend
│   ├── .env.example             # VITE_API_URL, VITE_API_PROXY_TARGET
│   └── src/
│       ├── main.tsx             # Montagem do React no DOM
│       ├── App.tsx              # Roteamento, tela de carregamento e aviso de erros da API
│       ├── index.css            # Importação do Tailwind CSS v4
│       ├── types/index.ts       # Interfaces do domínio de energia
│       ├── lib/
│       │   ├── api.ts           # Cliente HTTP (token JWT, tratamento de 401)
│       │   └── calculations.ts  # Formatadores e cálculos de exibição
│       ├── context/
│       │   └── AppContext.tsx   # Estado global sincronizado com a API
│       ├── components/
│       │   ├── layout/          # AppHeader, AppSidebar, NotificationDropdown
│       │   └── shared/          # Badges, FilterBar, ConfirmDialog, TwoFactorModal...
│       └── views/               # Telas (Dashboard, Consumo, Pontos, Alertas, Metas...)
│
└── backend/
    ├── package.json
    ├── tsconfig.json            # Checagem de tipos (inclui testes)
    ├── tsconfig.build.json      # Build de produção (exclui testes)
    ├── vitest.config.ts
    ├── .env                     # Configuração local (valores de demonstração)
    ├── .env.example             # Modelo de configuração
    ├── data/
    │   └── db.json              # "Banco de dados" em arquivo JSON
    └── src/
        ├── server.ts            # Sobe o servidor HTTP
        ├── app.ts               # Express: CORS, JSON, rotas, tratamento de erros
        ├── config.ts            # Leitura das variáveis de ambiente
        ├── schemas.ts           # Schemas Zod de validação dos payloads
        ├── types/index.ts       # Interfaces do domínio (espelho do frontend)
        ├── db/
        │   ├── store.ts         # Carrega, persiste e restaura o db.json
        │   ├── seed.ts          # Dados de demonstração (90 dias determinísticos)
        │   └── reset.ts         # Script para restaurar o banco (npm run seed:reset)
        ├── domain/
        │   ├── calculations.ts       # Regras estatísticas puras
        │   └── calculations.test.ts  # Testes das regras (Vitest)
        ├── lib/
        │   ├── http.ts          # HttpError, validação e handlers de erro
        │   └── password.ts      # Hash e verificação de senha (scrypt)
        ├── middleware/
        │   └── auth.ts          # Autenticação JWT e RBAC (requireRoles)
        ├── services/
        │   ├── consumption.ts   # Motor de lançamento e análise de consumo
        │   └── audit.ts         # Registro na trilha de auditoria
        └── routes/
            ├── auth.routes.ts         # login, me, switch-role
            ├── bootstrap.routes.ts    # carga inicial do frontend
            ├── consumption.routes.ts  # unidades, pontos e registros
            ├── alerts.routes.ts       # alertas, recomendações e notificações
            ├── management.routes.ts   # metas, tarifas e automações
            └── admin.routes.ts        # usuários, auditoria, limiares e reset
```

---

## 💻 5. Instruções de Execução

### Pré-requisitos
- **Node.js 20.6+** (testado com Node 24) e **npm 10+**

### Instalação de Dependências
Na raiz do projeto (instala frontend e backend de uma vez, via workspaces):
```bash
npm install
```

### Execução em Modo de Desenvolvimento
```bash
npm run dev
```
Sobe os dois serviços juntos, com logs identificados como `[back]` e `[front]`:

| Serviço | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| API | `http://localhost:3333/api` |
| Health check | `http://localhost:3333/api/health` |

Para subir cada um separadamente:
```bash
npm run dev:back     # somente a API (com reload automático via tsx watch)
npm run dev:front    # somente o frontend
```

### Comandos Disponíveis (na raiz)

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe API (:3333) e frontend (:3000) juntos |
| `npm run lint` | Checagem de tipos do backend e do frontend |
| `npm test` | Testes das regras estatísticas (Vitest) |
| `npm run build` | Build do backend (`backend/dist`) e do frontend (`frontend/dist`) |
| `npm run seed:reset -w backend` | Restaura o `db.json` com os dados de demonstração |

### Build e Execução em Produção
```bash
npm run build
npm run start -w backend      # API compilada em backend/dist
npm run preview -w frontend   # serve o build do frontend
```

---

## 🔒 6. Perfis para Demonstração

Senha de todos os perfis de demonstração: **`demo123456`**

| Perfil | E-mail de Teste | Permissões |
|---|---|---|
| **Administrador** | `admin@ecoia.demo` | Acesso total a todas as áreas, usuários, configurações e auditoria |
| **Gestor** | `gestor@ecoia.demo` | Visão geral, monitoramento, metas, alertas, relatórios e automações |
| **Operação** | `operacao@ecoia.demo` | Visualização de consumo, cadastro manual de medições e tratamento de alertas |
| **Financeiro** | `financeiro@ecoia.demo` | Foco em estimativas de custos, configurações de tarifas e relatórios executivos |

### Matriz de Permissões (aplicada na API)

| Ação | ADMIN | GESTOR | OPERACAO | FINANCEIRO |
|---|:-:|:-:|:-:|:-:|
| Visualizar dashboard, consumo, alertas e relatórios | ✅ | ✅ | ✅ | ✅ |
| Lançar consumo manual | ✅ | ✅ | ✅ | ❌ |
| Editar/excluir registros de consumo | ✅ | ❌ | ✅ | ❌ |
| Tratar alertas | ✅ | ✅ | ✅ | ❌ |
| Cadastrar/editar pontos de medição | ✅ | ✅ | ❌ | ❌ |
| Gerenciar metas | ✅ | ✅ | ❌ | ❌ |
| Gerenciar automações | ✅ | ✅ | ❌ | ❌ |
| Gerenciar tarifas | ✅ | ❌ | ❌ | ✅ |
| Usuários, auditoria e limiares | ✅ | ❌ | ❌ | ❌ |

---

## 🌐 7. Backend — API REST

Base URL: `http://localhost:3333/api` (ou `http://localhost:3000/api` pelo proxy do Vite).

### Autenticação
Todas as rotas, exceto `/health` e `/auth/login`, exigem o cabeçalho:
```
Authorization: Bearer <token>
```
O token é obtido no login e expira em `JWT_EXPIRES_IN` (padrão: 8h).

### Endpoints

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | `/health` | Status da API | público |
| POST | `/auth/login` | Login com e-mail e senha, devolve `{ token, user }` | público |
| GET | `/auth/me` | Dados do usuário logado | autenticado |
| POST | `/auth/switch-role` | Troca rápida de perfil (somente modo demonstração) | autenticado |
| GET | `/bootstrap` | Carga inicial com todas as coleções (usuários e auditoria só para ADMIN) | autenticado |
| GET | `/units` | Lista unidades | autenticado |
| GET | `/points` | Lista pontos de medição | autenticado |
| POST | `/points` | Cadastra ponto de medição | ADMIN, GESTOR |
| PATCH | `/points/:id` | Edita ponto de medição | ADMIN, GESTOR |
| GET | `/records?pointId=&from=&to=` | Lista registros de consumo (filtros opcionais) | autenticado |
| POST | `/records` | Lançamento manual com análise automática | ADMIN, GESTOR, OPERACAO |
| PATCH | `/records/:id` | Edita registro | ADMIN, OPERACAO |
| DELETE | `/records/:id` | Exclui registro | ADMIN, OPERACAO |
| GET | `/alerts` | Lista alertas | autenticado |
| GET | `/alerts/:id` | Detalhe do alerta com suas recomendações | autenticado |
| POST | `/alerts/:id/view` | Marca como visualizado | autenticado |
| POST | `/alerts/:id/treat` | Registra tratamento do alerta | ADMIN, GESTOR, OPERACAO |
| GET | `/recommendations` | Lista recomendações da IA explicável | autenticado |
| GET | `/notifications` | Lista notificações | autenticado |
| POST | `/notifications/:id/read` | Marca notificação como lida | autenticado |
| POST | `/notifications/read-all` | Marca todas como lidas | autenticado |
| GET / POST | `/goals` | Lista / cria metas | autenticado / ADMIN, GESTOR |
| PATCH / DELETE | `/goals/:id` | Edita / exclui meta | ADMIN, GESTOR |
| GET / POST | `/tariffs` | Lista / cria tarifas | autenticado / ADMIN, FINANCEIRO |
| PATCH / DELETE | `/tariffs/:id` | Edita / exclui tarifa | ADMIN, FINANCEIRO |
| GET / POST | `/automations` | Lista / cria regras de automação | autenticado / ADMIN, GESTOR |
| GET | `/automations/logs` | Histórico de execuções das automações | autenticado |
| POST | `/automations/:id/toggle` | Ativa/desativa regra | ADMIN, GESTOR |
| GET / POST | `/users` | Lista / cria usuários | ADMIN |
| PATCH | `/users/:id` | Edita usuário (nome, perfil, ativo, senha) | ADMIN |
| GET | `/audit-logs` | Trilha de auditoria | ADMIN |
| GET | `/settings/thresholds` | Limiares de anomalia | autenticado |
| PUT | `/settings/thresholds` | Atualiza limiares | ADMIN |
| POST | `/admin/reset` | Restaura os dados de demonstração (somente modo demonstração) | autenticado |

### Exemplos

**Login**
```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecoia.demo","password":"demo123456"}'
```
```json
{ "token": "eyJhbGciOi...", "user": { "id": "usr-admin", "name": "Ricardo Torres", "role": "ADMIN", "...": "..." } }
```

**Lançamento manual de consumo**
```bash
curl -X POST http://localhost:3333/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pointId":"pt-clima-a","value":420.5,"timestamp":"2026-09-29T10:00:00.000Z","notes":"Leitura manual"}'
```
```json
{
  "message": "Registro manual salvo com sucesso! Atenção: foi identificado desvio relevante e um alerta foi gerado.",
  "alertGenerated": true,
  "record": { "id": "rec-1a2b3c4d", "status": "ANOMALIA", "...": "..." },
  "alert":  { "id": "alert-5e6f7a8b", "criticality": "ALTA", "type": "CONSUMO_EXCESSIVO", "...": "..." }
}
```

**Tratamento de alerta**
```bash
curl -X POST http://localhost:3333/api/alerts/<id>/treat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"Manutenção acionada","observation":"Compressor travado no Bloco A"}'
```

### Formato de Erros

| Status | Quando acontece |
|---|---|
| `400` | Payload inválido (validação Zod) |
| `401` | Token ausente, inválido ou expirado; senha incorreta |
| `403` | Perfil sem permissão para a ação |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex.: e-mail de usuário já cadastrado) |
| `422` | Regra de negócio violada (valor negativo, data futura, ponto inativo) |
| `500` | Erro interno |

```json
{ "error": "Dados inválidos.", "issues": [{ "path": "highThresholdPercent", "message": "O limiar alto deve ser maior que o limiar médio." }] }
```

---

## 🧮 8. Regras de Negócio e Motor de Análise

Ao receber um `POST /records`, o backend (`services/consumption.ts`) executa:

1. **Validações (RN-004, RNF-012)**: valor não negativo, data válida, sem datas futuras (em relação à `REFERENCE_DATE`) e ponto existente e **ativo**.
2. **Média móvel de 7 dias**: média do ponto na janela anterior ao registro.
3. **Consumo ocioso**: o registro é marcado como ocioso quando ocorre **fora dos dias/horários operacionais** do ponto e com carga **acima de 15 kWh**. Os horários são lidos em UTC, o mesmo formato em que o frontend grava o horário informado.
4. **Classificação**:

   | Resultado | Condição |
   |---|---|
   | `OCIOSO` | Carga expressiva fora da janela operacional |
   | `HISTORICO_INSUFICIENTE` | Menos de `minHistoryDays` (padrão 7) dias de histórico |
   | `EXCESSO_ALTO` | Desvio ≥ limiar alto (padrão **40%**) |
   | `EXCESSO_MEDIO` | Desvio ≥ limiar médio (padrão **20%**) |
   | `NORMAL` | Dentro dos limiares |

   Desvio = `((observado − média) / média) × 100`.
5. **Em caso de anomalia** (`EXCESSO_MEDIO`, `EXCESSO_ALTO` ou `OCIOSO`):
   - cria um **alerta** (criticidade **ALTA** para excesso alto e ocioso, **MÉDIA** para excesso médio), com custo estimado pela tarifa aplicável (`kWh × R$/kWh`);
   - cria uma **recomendação explicável** com motivo, evidência e ação sugerida;
   - cria uma **notificação**;
   - executa as **automações ativas** compatíveis (`DESVIO_MAIOR_QUE` e `CONSUMO_OCIOSO`) e registra o log.
6. **Auditoria**: grava o lançamento na trilha (RN-015, RNF-008).

As funções estatísticas puras ficam em `backend/src/domain/calculations.ts` e têm testes unitários.

---

## 🗄️ 9. Banco de Dados (db.json)

O backend usa um **banco em memória persistido no arquivo `backend/data/db.json`**:

- Na inicialização, a API carrega o arquivo. Se ele não existir, é criado a partir dos dados de demonstração (`db/seed.ts`).
- Toda alteração é gravada no disco imediatamente, com **escrita atômica** (arquivo temporário + rename) para evitar JSON corrompido.
- As senhas são armazenadas apenas como hash `scrypt` (`passwordHash`) e nunca são devolvidas pela API.

Estrutura do arquivo:
```jsonc
{
  "organization": { ... },
  "users": [ ... ],            // inclui passwordHash
  "units": [ ... ],
  "points": [ ... ],
  "tariffs": [ ... ],
  "goals": [ ... ],
  "records": [ ... ],          // ~730 medições (90 dias)
  "alerts": [ ... ],
  "recommendations": [ ... ],
  "automations": [ ... ],
  "automationLogs": [ ... ],
  "notifications": [ ... ],
  "auditLogs": [ ... ],
  "thresholds": { "mediumThresholdPercent": 20, "highThresholdPercent": 40, "minHistoryDays": 7 }
}
```

Para voltar aos dados originais:
```bash
npm run seed:reset -w backend
```
Também é possível pelo botão **"Restaurar dados"** no cabeçalho ou na tela de Configurações.

> ℹ️ O `db.json` é versionado para que o projeto já abra com dados. Como ele muda a cada ação feita no sistema, rode `npm run seed:reset -w backend` antes de commitar, caso não queira subir os dados de teste.

---

## ⚙️ 10. Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3333` | Porta HTTP da API |
| `JWT_SECRET` | `troque-este-segredo` | Segredo de assinatura dos tokens. **Troque em produção.** |
| `JWT_EXPIRES_IN` | `8h` | Validade do token |
| `CORS_ORIGIN` | `http://localhost:3000` | Origens permitidas (separadas por vírgula) |
| `DB_FILE` | `./data/db.json` | Caminho do arquivo de dados |
| `REFERENCE_DATE` | `2026-09-29T23:59:59.000Z` | "Agora" do motor de análise (os dados demo são ancorados nessa data). Vazio = data real |
| `DEMO_MODE` | `true` | Habilita troca rápida de perfil e restauração dos dados |
| `DEMO_PASSWORD` | `demo123456` | Senha dos usuários de demonstração e de novos usuários criados sem senha |

### Frontend (`frontend/.env`, opcional)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base da API usada pelo navegador |
| `VITE_API_PROXY_TARGET` | `http://localhost:3333` | Destino do proxy `/api` do Vite em desenvolvimento |

> ⚠️ O `backend/.env` versionado contém apenas valores de **demonstração**. Em um ambiente real, gere um `JWT_SECRET` forte, desative o `DEMO_MODE` e não versione o arquivo.

---

## 🧪 11. Testes e Qualidade

```bash
npm test        # testes unitários das regras estatísticas (Vitest)
npm run lint    # checagem de tipos TypeScript (backend + frontend)
```

Cenários cobertos pelos testes (`backend/src/domain/calculations.test.ts`):
- cálculo do desvio percentual;
- classificação `NORMAL`, `EXCESSO_MEDIO`, `EXCESSO_ALTO`, `HISTORICO_INSUFICIENTE` e `OCIOSO`;
- custo estimado com e sem tarifa;
- detecção de consumo ocioso (fim de semana vs. dia útil em horário operacional).

---

## 🧯 12. Solução de Problemas

| Problema | Solução |
|---|---|
| `npm install` falha com `ERESOLVE` | Rode `npm install` **na raiz** do projeto, não dentro das subpastas |
| Porta 3000 ou 3333 em uso | Encerre o processo que ocupa a porta ou altere `PORT` no `backend/.env` (e `VITE_API_PROXY_TARGET` no front) |
| Front mostra "Não foi possível conectar à API" | Confirme que o backend está rodando (`http://localhost:3333/api/health`) |
| "Sua sessão expirou" | O token expirou ou o `JWT_SECRET` mudou; faça login novamente |
| Dados estranhos após testes | `npm run seed:reset -w backend` ou botão "Restaurar dados" |
| `http proxy error ... ECONNREFUSED` logo ao iniciar | Normal nos primeiros segundos, enquanto a API ainda está subindo |

---

## 🗺️ 13. Próximos Passos

- Migrar a persistência JSON para um banco relacional (SQLite/PostgreSQL), alterando apenas `backend/src/db/store.ts`.
- Ingestão automática de leituras de sensores (`origin: SENSOR`) via endpoint ou fila.
- 2FA real (TOTP) no backend.
- Paginação e filtros server-side em `/records` para grandes volumes.
- Testes de integração das rotas da API.
