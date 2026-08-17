# 🛡️ Radar de Segurança de Fortaleza

Plataforma web para a **SSPDS** (Secretaria da Segurança Pública e Defesa Social do Ceará) que mapeia, em tempo real e com base em dados oficiais das corporações **PM, CBM e GMF**, as unidades de segurança de Fortaleza. O sistema é dividido em **frontend** (HTML/CSS/JS puro) e **backend** (API REST em Node.js + Express + PostgreSQL).

> 📌 **Este README é o norte do projeto.** Ele descreve o estado atual, a arquitetura-alvo e o caminho de evolução que todo desenvolvedor deve seguir. Leia antes de codificar.

---

## Sumário

- [🎯 Missão e Visão Técnica](#-missão-e-visão-técnica)
- [🧱 Stack Tecnológica](#-stack-tecnológica)
- [📁 Estrutura Atual do Projeto](#-estrutura-atual-do-projeto)
- [🏛️ Arquitetura-Alvo do Backend (Refatoração MVC)](#-arquitetura-alvo-do-backend-refatoração-mvc)
- [🗺️ Roadmap da Refatoração Backend](#-roadmap-da-refatoração-backend)
- [🔗 Integração Frontend ↔ Backend](#-integração-frontend-backend)
- [🚀 Deploy do Backend](#-deploy-do-backend)
- [⚙️ Variáveis de Ambiente](#-variáveis-de-ambiente)
- [💻 Rodando o Projeto Localmente](#-rodando-o-projeto-localmente)
- [✅ Boas Práticas e Padrões do Projeto](#-boas-práticas-e-padrões-do-projeto)
- [🤝 Como Contribuir](#como-contribuir)

---

## 🎯 Missão e Visão Técnica

O projeto evolui em **duas grandes frentes** que este documento orienta:

1. **Refatoração do backend** para arquitetura **MVC com camadas adicionais**:
   `config`, `middleware`, `route`, `validation`, `repository` e `service`.
2. **Integração do frontend com o backend** (via API REST) e **deploy do backend**
   em ambiente de produção (PostgreSQL gerenciado + platform-as-a-service).

A regra de ouro: **nenhum novo endpoint, controller ou regra de negócio deve ser criado sem seguir a arquitetura-alvo abaixo.**

---

## 🧱 Stack Tecnológica

| Camada         | Tecnologia                       | Observação                                   |
| -------------- | -------------------------------- | -------------------------------------------- |
| Frontend       | HTML5 + CSS3 + JavaScript (ES6+) | Sem framework; servido estaticamente         |
| Mapas          | Leaflet.js                       | Marcadores das unidades                      |
| Gráficos       | Chart.js                         | KPIs e análises operacionais                 |
| Backend        | Node.js + Express 4              | API REST                                     |
| Banco de dados | PostgreSQL                       | Tabelas criadas automaticamente via `dbInit` |
| Autenticação   | Bcrypt (hash de senha)           | A evoluir para JWT (roadmap)                 |
| Acesso a dados | `pg` (node-postgres, Pool)       | Direto no controller → vai para `repository` |

---

## 📁 Estrutura Atual do Projeto

```
radar-de-seguranca/
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── server.js               # Bootstrap do Express + init do banco
│   ├── config/
│   │   ├── db.js               # Pool de conexão PostgreSQL
│   │   └── dbInit.js           # Cria tabelas + seed automático
│   ├── controllers/
│   │   ├── authController.js   # Registrar, Login, Recuperar senha
│   │   └── unidadeController.js # Listar unidades (com fallback mock)
│   └── routes/
│       ├── authRoutes.js
│       └── unidadeRoutes.js
└── frontend/
    ├── index.html              # Splash/redirect
    ├── assets/                 # Logomarcas
    ├── css/                    # Estilos (global, login, dashboard...)
    ├── data/regionais.json     # Dados mock de localização
    ├── js/                     # login.js, dashboard.js, usuario.js
    └── pages/                  # login | dashboard | usuario | sobre
```

### Endpoints atuais (linha de base)

| Método | Rota                   | Controlador                           | Descrição                                                                                                         |
| ------ | ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/register`        | `authController.registrar`            | Cria usuário (valida senha, CPF e e-mail únicos)                                                                  |
| POST   | `/api/login`           | `authController.login`                | Autentica e devolve dados do usuário (sem senha)                                                                  |
| POST   | `/api/forgot-password` | `authController.solicitarRecuperacao` | Fluxo de recuperação de senha                                                                                     |
| GET    | `/api/unidades`        | `unidadeController.buscarUnidades`    | Lista unidades com filtros `?corporacao=` e `?regional=`; **fallback** para mock se o banco estiver vazio/offline |

> ⚠️ **Problemas conhecidos que a refatoração resolve:** SQL embutido nos controllers,
> validações espalhadas dentro dos controllers, sem camada de repositório, sem
> middlewares de autenticação e tratamento de erros centralizado, e URL da API
> hardcoded no frontend.

---

## 🏛️ Arquitetura-Alvo do Backend (Refatoração MVC)

A refatoração deve transformar o backend em uma arquitetura **MVC em camadas**.
Fluxo de uma requisição:

```
  rota → validation (schemas) → middleware → controller → service → repository → PostgreSQL
     └────────────────────────────── resposta JSON ◄────────────────────────────────────┘
        (erros passam pelo middleware global de erro / errorMiddleware)
```

### Árvore de destino

```
backend/
├── server.js                 # Bootstrap: registra middlewares e rotas (thin)
├── config/
│   ├── env.js                # Carrega e valida variáveis de ambiente
│   ├── db.js                 # Pool PostgreSQL (já existe)
│   └── dbInit.js             # Migração/seed (já existe)
├── middleware/
│   ├── authMiddleware.js     # Protege rotas autenticadas
│   ├── validationMiddleware.js # Executa os schemas da camada validation
│   ├── errorMiddleware.js    # Handler central de erros
│   └── notFoundMiddleware.js # 404 padronizado
├── validation/
│   ├── authValidation.js     # Schemas de /register, /login, /forgot-password
│   └── unidadeValidation.js  # Schemas de queryString de /unidades
├── routes/
│   ├── index.js              # Agrupador de rotas (mount em /api)
│   ├── authRoutes.js
│   └── unidadeRoutes.js
├── controllers/
│   ├── authController.js
│   └── unidadeController.js  # Só orquestram request/response via service
├── services/                 # REGRAS DE NEGÓCIO
│   ├── authService.js        # Hierarquia/permissões, hash, fluxos de acesso
│   └── unidadeService.js     # Regras de negócio (inclusive fallback mock)
├── repositories/             # ÚNICO LUGAR COM SQL
│   ├── usuarioRepository.js
│   └── unidadeRepository.js
└── models/                   # (opcional, se adotar um ORM depois)
    └── usuario.model.js
```

> **Regra de ouro das camadas:** SQL apenas em `repositories/`, regras de negócio
> em `services/`, validação de entrada em `validation/`, proteção de rotas e erros
> em `middleware/`. O controller fica **fino** (só orquestra).

---

## 🗺️ Roadmap da Refatoração Backend

Siga os passos **na ordem**. Cada fase deve terminar com o backend rodando e a
compatibilidade de contrato com o frontend mantida (rotas e payloads iguais).

### Fase 0 — Preparação

- [ ] Criar branch `refactor/mvc-layers` a partir de `develop`.
- [ ] Manter compatibilidade total: **não mudar rotas nem o formato das respostas**.
- [ ] Instalar dependências auxiliares: `express-validator` (validação) e
      `jest` + `supertest` (testes de integração, devDependencies).

### Fase 1 — Camada `config`

- [ ] Criar `config/env.js` centralizando a leitura de `process.env.*`, com valores
      padrão e validação de obrigatórios em produção.
- [ ] Refatorar `config/db.js` para consumir valores via `config/env.js`
      (hoje ele lê `dotenv` diretamente no próprio módulo).
- [ ] `server.js` deve inicializar a config no topo e apenas montar o app.

### Fase 2 — Camada `validation`

- [ ] Criar `validation/authValidation.js` com regras de `register` (nome, CPF, e-mail
      institucional, telefone, corporação, posto/graduação permitidos e senha forte) e de
      `login` / `forgot-password`. Hoje parte desse código vive no `authController`.
- [ ] Criar `validation/unidadeValidation.js` validando `corporacao` e `regional`
      na query string de `GET /api/unidades`.
- [ ] Remover validações dos controllers, delegando-as ao middleware de validação.

### Fase 3 — Camada `repository`

- [ ] Criar `repositories/usuarioRepository.js`: `findByEmailOrCpf`, `findByEmail`, `create`.
- [ ] Criar `repositories/unidadeRepository.js`: `findAll({ corporacao, regional })`.
- [ ] **Todo SQL sai dos controllers** e passa a viver exclusivamente nos repositórios.
      Nenhum `pool.query` fora desta camada.
- [ ] O fallback mock do `unidadeController` vai para o **service**; o repositório
      apenas retorna linhas (ou lança erro tipado, ex. `EmptyResultError`).

### Fase 4 — Camada `middleware`

- [ ] `validationMiddleware.js`: roda os schemas e responde `400` com
      `{ success: false, errors: [...] }` consolidado.
- [ ] `authMiddleware.js`: verifica token JWT nas rotas protegidas
      (ver Fase 5 e seção de autenticação abaixo).
- [ ] `errorMiddleware.js`: captura erros de forma central, padroniza resposta
      `{ success: false, error }` e faz log estruturado — eliminando os
      `try/catch` duplicados dos controllers.
- [ ] Registrar middleware em `server.js` na ordem correta (globais → rotas → erro).

### Fase 5 — Camada `service` + controllers finos

- [ ] `services/authService.js`: recebe as regras que hoje estão no controller
      (`validaSenhaForte`, `permissoesMapeadas`/nível de acesso, geração de hash,
      fluxo de recuperação).
- [ ] `services/unidadeService.js`: busca no repository + fallback mock + filtros.
- [ ] `controllers/*` viram orquestradores finos: `req` → chamar `service` → `res`.
      Sem SQL e sem regra de negócio no controller.
- [ ] Adotar **JWT** no login: gerar token em `authService`, validar em
      `authMiddleware` e proteger as rotas apropriadas.

### Fase 6 — Rotas e contrato

- [ ] `routes/index.js` agrupa e exporta um único router montado em `/api`.
- [ ] Padronizar respostas de erro e manter contratos (payloads atuais do frontend).

### Fase 7 — Qualidade e testes

- [ ] Testes de integração com `supertest`: register (sucesso, duplicado, senha fraca),
      login (ok, credenciais inválidas), unidades (filtros e fallback).
- [ ] Garantir que `dbInit.js` continua idempotente (tabelas criadas uma única vez).
- [ ] Atualizar esta seção do README quando a refatoração for concluída.

---

## 🔗 Integração Frontend ↔ Backend

### Estado atual

O frontend faz `fetch` direto para `http://localhost:3000/api/...` de forma
**hardcoded** em `frontend/js/login.js` e `frontend/js/dashboard.js`.

### Ações necessárias

1. **Centralizar a URL da API**

   Criar `frontend/js/config/api.js` (ou `config.js`) exportando uma constante:

   ```js
   // config/api.js
   const API_BASE_URL =
     window.__ENV__?.API_BASE_URL ||
     (location.hostname === "localhost"
       ? "http://localhost:3000"
       : "https://api.seu-dominio.com.br");
   ```

   Substituir todos os `fetch('http://localhost:3000/...')` por chamadas usando
   `API_BASE_URL`, idealmente dentro de um pequeno helper `apiClient.js`:

   ```js
   async function api(url, options = {}) {
     const res = await fetch(`${API_BASE_URL}${url}`, {
       headers: { "Content-Type": "application/json", ...options.headers },
       ...options,
     });
     const data = await res.json();
     if (!res.ok) throw new Error(data.error || "Erro na requisição");
     return data;
   }
   ```

2. **CORS no backend (continuidade)**

   O backend já usa `app.use(cors())` (libera origem). Em desenvolvimento está ok,
   mas em **produção restrinja os domínios** autorizados:

   ```js
   const allowedOrigins = ["https://frontend.seu-dominio.com.br"];
   app.use(cors({ origin: allowedOrigins }));
   ```

3. **Contrato da API (a manter estável)**

   ```jsonc
   // POST /api/login  -> 200
   { "success": true, "user": { "id": 1, "nome": "...", "email": "...",
     "corporacao": "PM", "tipo_militar": "Sargento", "nivel_acesso": "Supervisão" } }

   // GET /api/unidades?corporacao=PM&regional=SER%20II  -> 200
   [ { "id": 1, "nome": "8º BPM (Aldeota)", "corporacao": "PM", "regional": "SER II",
       "latitude": -3.738050, "longitude": -38.502220, "efetivo": 240 } ]

   // Erro padronizado (todas as rotas) -> 400 / 401 / 409 / 500
   { "success": false, "error": "mensagem amigável" }
   ```

4. **Autenticação no frontend**
   - Hoje: o usuário é salvo em `localStorage` (chave `usuario`) e as rotas
     `dashboard.js` / `usuario.js` redirecionam para `login.html` quando inexistente.
   - Meta (com JWT no backend): guardar o token em `localStorage`, enviar o header
     `Authorization: Bearer <token>` nas chamadas autenticadas e deslogar em `401`.

5. **Execução em desenvolvimento**
   - Backend: `cd backend && npm run dev` → porta 3000.
   - Frontend: servir a pasta `frontend/` com um servidor estático
     (`npx serve ../frontend -l 5000` ou extensão Live Server do VS Code).
     **Não abrir os HTML via `file://`** para evitar bloqueios de CORS.

---

## 🚀 Deploy do Backend

### Opções sugeridas (platform-as-a-service)

| Plataforma     | PostgreSQL            | Pontos fortes                                   |
| -------------- | --------------------- | ----------------------------------------------- |
| **Railway**    | Sim (add-on)          | Deploy automático via Git, fácil de subir       |
| **Render**     | Sim (créditos)        | Web Service + PostgreSQL gerenciado             |
| **Fly.io**     | Sim (volumes)         | CLI declarativa, ideal para Node                |
| **VPS/Docker** | Próprio ou gerenciado | Controle total; maior esforço de infraestrutura |

> Referência do time: **Railway ou Render** pela simplicidade e integração Git.

### Roteiro passo a passo (padrão Railway/Render)

1. **Preparar o repositório**
   - `.env*` já está no `.gitignore` — **nunca commitar credenciais**.
   - Criar `Procfile` na raiz: `web: cd backend && npm start`
   - Ou um `Dockerfile` minimal na raiz:
     ```dockerfile
     FROM node:20-alpine
     WORKDIR /app/backend
     COPY backend/package*.json ./
     RUN npm install --omit=dev
     COPY backend/ ./
     EXPOSE 3000
     CMD ["node", "server.js"]
     ```

2. **Provisionar o PostgreSQL gerenciado** no provedor e copiar as credenciais.

3. **Configurar variáveis de ambiente no painel do provedor**

   ```env
   DB_HOST=...
   DB_PORT=5432
   DB_NAME=...
   DB_USER=...
   DB_PASSWORD=...
   PORT=3000
   ```

   Ajustar `config/db.js` (Fase 1) para aceitar também `DATABASE_URL`
   (formato padrão dos PaaS) como alternativa aos campos separados.

4. **Porta dinâmica**: usar `process.env.PORT` — já implementado no `server.js`.
   Nunca fixar a porta 3000 em produção.

5. **Integração com Git**: ligar o deploy à branch `main` com disparo automático
   a cada `push`; a inicialização do banco (`dbInit`) já é executada no boot do server.

6. **CORS de produção**: liberar somente o domínio do frontend (seção anterior).

7. **Validar o ambiente de produção**

   ```bash
   curl https://SEU-BACKEND/api/unidades
   curl -X POST https://SEU-BACKEND/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"...","senha":"..."}'
   ```

8. **Opcional — CI/CD**: GitHub Actions executando `npm test` no backend a cada PR
   antes do deploy automático na `main`.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `backend/.env` local (nunca commitado):

```env
# Servidor
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=radar_seguranca

# Futuro (Fase 5 - autenticação com token)
JWT_SECRET=troque_por_um_valor_aleatorio_e_longo
JWT_EXPIRES_IN=8h
```

> Em produção, defina essas variáveis diretamente no painel do provedor — nunca em
> arquivos commitados.

---

## 💻 Rodando o Projeto Localmente

```bash
# 1. Subir o PostgreSQL local (ou via Docker):
#    docker run --name radar-pg \
#      -e POSTGRES_PASSWORD=sua_senha -e POSTGRES_DB=radar_seguranca \
#      -p 5432:5432 -d postgres:16

# 2. Backend
cd backend
npm install
cp .env.example .env   # ajustar credenciais (ou criar o arquivo na raiz)
npm run dev            # porta 3000 — tabelas/seed são criados automaticamente via dbInit

# 3. Frontend (em outro terminal/dir)
npx serve ../frontend -l 5000
#    Acesse http://localhost:5000 — o splash (index.html) redireciona para /pages/login.html
```

---

## ✅ Boas Práticas e Padrões do Projeto

1. **Arquitetura**: siga o fluxo `rota → middleware → controller → service → repository`.
   Nada de SQL ou regras de negócio fora da sua camada.
2. **Contratos**: não altere rotas, status codes nem formato das respostas sem
   migrar o frontend no mesmo PR.
3. **Erros**: responder sempre `{ success: false, error: "..." }`; para erros de
   validação incluir também `errors[]` (campo por campo).
4. **Segurança**: bcrypt para senhas; nunca logar segredos; `JWT_SECRET` forte;
   CORS restrito em produção; nunca commitar `.env`.
5. **SQL**: 100% dentro de `repositories/`, sempre com parâmetros (`$1`, `$2`, ...) —
   nada de concatenação de strings.
6. **Idioma**: manter o padrão do projeto — comentários e mensagens em português;
   nomes de arquivos/camadas em inglês (`controllers`, `services`, `repositories`).
7. **Validação**: nunca confiar no frontend — validar tudo no backend (camada
   `validation`).
8. **Banco**: `dbInit.js` deve permanecer idempotente (usa `to_regclass` / verificações
   antes de criar).
9. **Versionamento**: branches a partir de `develop` com o padrão
   `tipo/descricao` (ex.: `refactor/mvc-layers`, `feat/frontend-api-integration`,
   `feat/deploy-backend`); PRs para `develop` e o merge de `develop` → `main`
   dispara o deploy.
10. **Privacidade**: CPF mascarado na UI (`***.***.***-XX`); nunca expor
    `senha_hash` nas respostas da API (o login já remove o campo).

---

## 📋 Como Contribuir

1. Crie uma branch a partir de `develop` com a sintaxe `<tipo>/<descricao>`
   (ex.: `refactor/mvc-layers`, `feat/frontend-api-integration`, `feat/deploy-backend`).
2. Implemente seguindo o **Roadmap da Refatoração** e mantenha compatibilidade
   de contrato com o frontend.
3. Abra um Pull Request para `develop` descrevendo: o que mudou, como testar e
   se há impacto no frontend.
4. Após a revisão, o merge `develop` → `main` inicia o deploy automático.

---

## 🚦 Status do projeto (referência rápida)

| Área                    | Estado                         | Próximo passo                                 |
| ----------------------- | ------------------------------ | --------------------------------------------- |
| Backend (atual)         | Controllers + routes básicos   | Refatoração para camadas (Fases 0–7)          |
| Camada `config`         | `db.js` / `dbInit.js`          | Criar `env.js` centralizado                   |
| Camada `validation`     | Inline no controller           | Schemas próprios + middleware                 |
| Camada `repository`     | ❌ não existe                  | Extrair SQL dos controllers                   |
| Camada `middleware`     | Apenas globais (cors/json)     | `auth` + `validation` + `errorHandler`        |
| Integração front ↔ back | URL hardcoded `localhost:3000` | `config/api.js` + `apiClient.js`              |
| Deploy                  | ❌ não configurado             | PaaS (Railway/Render) + PostgreSQL gerenciado |
| Autenticação robusta    | Sessão via `localStorage`      | JWT + header Bearer nas rotas protegidas      |

---

> **Recomendação de leitura:** _Refactoring: Improving the Design of Existing Code_
> (Martin Fowler) — livro de cabeceira desta refatoração.
>
> Dúvidas técnicas: abra uma issue no repositório com as tags `refactor` ou `deploy`.
