# 🏋️ JS Fit App - Sistema Completo de Treinos

**Versão 3.0.0** - Sistema completo com backend PostgreSQL e deploy automático no Netlify

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue.svg)](https://neon.tech/)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Setup Local](#setup-local)
- [Deploy no Netlify](#deploy-no-netlify)
- [Configuração do Banco](#configuração-do-banco)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O **JS Fit App** é uma Progressive Web Application (PWA) completa que conecta personal trainers e alunos através de um sistema robusto de compartilhamento de planos de treino.

### 🚀 Principais Funcionalidades

#### Para Personal Trainers
- 🤖 **Criação com IA**: Planos automáticos baseados no perfil do aluno
- 📝 **Editor Manual**: Controle total sobre exercícios e parâmetros
- 🔗 **Sistema de Compartilhamento**: IDs únicos para distribuição segura
- 📊 **Dashboard Completo**: Estatísticas e acompanhamento
- 💾 **Backup na Nuvem**: Dados sincronizados automaticamente

#### Para Alunos
- 📱 **Interface Mobile-First**: Otimizada para uso durante treinos
- 🔍 **Importação Simples**: Sistema de ID de 6 caracteres
- ✅ **Acompanhamento em Tempo Real**: Progresso e execuções
- ⚖️ **Ajuste de Cargas**: Personalização durante o treino
- 📈 **Métricas de Progresso**: Ciclos completos e estatísticas

## 🏗️ Arquitetura

```
js-fit-app/
├── 📄 Frontend (PWA)
│   ├── index.html              # Landing page
│   ├── aluno.html             # App do aluno
│   ├── personal.html          # App do personal
│   ├── css/style.css          # Estilos unificados
│   └── js/
│       ├── aluno.js           # Lógica do aluno
│       ├── personal.js        # Lógica do personal
│       └── auth-manager.js    # Gerenciamento de auth
├── 🔧 Backend (Netlify Functions)
│   └── netlify/functions/
│       ├── auth.js            # Autenticação JWT
│       ├── plans.js           # CRUD de planos
│       ├── share.js           # Sistema de compartilhamento
│       ├── students.js        # Gerenciamento de alunos
│       └── health.js          # Health check
├── 🗄️ Database
│   └── scripts/
│       ├── schema.sql         # Schema PostgreSQL
│       └── migrate.js         # Migração de dados
└── ⚙️ Configuration
    ├── netlify.toml           # Configuração Netlify
    ├── package.json           # Dependências
    └── .env.example           # Variáveis de ambiente
```

## 🛠️ Tecnologias

### Frontend
- **HTML5/CSS3/JavaScript ES6+**: Base moderna
- **PWA**: Service Worker + Manifest
- **LocalStorage**: Cache local robusto
- **Fetch API**: Comunicação com backend

### Backend
- **Netlify Functions**: Serverless em Node.js
- **PostgreSQL (Neon)**: Banco de dados na nuvem
- **JWT**: Autenticação segura
- **CORS**: Configuração adequada

### DevOps
- **GitHub**: Controle de versão
- **Netlify**: Deploy automático
- **Neon**: Banco PostgreSQL gerenciado

## 🚀 Setup Local

### 1. Prerequisites

```bash
# Node.js 18+
node --version

# Netlify CLI
npm install -g netlify-cli

# Git
git --version
```

### 2. Clone e Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/js-fit-app.git
cd js-fit-app

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 3. Configurar .env

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_rsCkP3jbcal7@ep-red-cloud-acw2aqx0-pooler.sa-east-1.aws.neon.tech/academiajsfit?sslmode=require&channel_binding=require

# JWT
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-chars

# Ambiente
NODE_ENV=development
FRONTEND_URL=http://localhost:8888
```

### 4. Setup do Banco

```bash
# Executar schema
npm run setup-db

# Migrar dados (opcional)
npm run migrate-data
```

### 5. Executar Localmente

```bash
# Desenvolvimento
npm run dev

# Ou com Netlify CLI
netlify dev
```

Acesse: http://localhost:8888

## 🌐 Deploy no Netlify

### Configuração Automática via GitHub

#### 1. Preparar Repositório

```bash
# Criar repositório no GitHub
gh repo create js-fit-app --public

# Push inicial
git add .
git commit -m "Initial commit - JS Fit App v3.0"
git push -u origin main
```

#### 2. Conectar no Netlify

1. Acesse [Netlify Dashboard](https://app.netlify.com/)
2. Click **"New site from Git"**
3. Escolha **GitHub** como provider
4. Selecione o repositório `js-fit-app`
5. Configure as opções de build:

```yaml
# Build settings
Build command: npm run build
Publish directory: public
Functions directory: netlify/functions
```

#### 3. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings > Environment variables**:

```bash
# Banco de Dados
DATABASE_URL=postgresql://neondb_owner:npg_rsCkP3jbcal7@ep-red-cloud-acw2aqx0-pooler.sa-east-1.aws.neon.tech/academiajsfit?sslmode=require&channel_binding=require

# JWT Secret (gere uma chave segura)
JWT_SECRET=super-secret-jwt-key-min-32-characters-here-change-in-production

# Ambiente
NODE_ENV=production
FRONTEND_URL=https://SEU-SITE.netlify.app

# Opcional: Configurações adicionais
RATE_LIMIT_MAX_ATTEMPTS=10
RATE_LIMIT_WINDOW_MS=900000
```

#### 4. Deploy Inicial

```bash
# Deploy manual (opcional)
netlify deploy --prod --dir public

# Ou aguardar deploy automático via GitHub
```

## 🗄️ Configuração do Banco

### Schema PostgreSQL

O banco é configurado automaticamente com:

```sql
-- Tabelas principais
personal_trainers    # Personal trainers cadastrados
students            # Alunos do sistema  
workout_plans       # Planos de treino
workouts           # Treinos individuais (A, B, C...)
exercises          # Exercícios específicos
shared_plans       # Sistema de compartilhamento
workout_sessions   # Log de execuções
exercise_logs      # Histórico detalhado
```

### Comandos de Manutenção

```bash
# Verificar conexão
npm run db:check

# Resetar banco (CUIDADO!)
npm run db:reset

# Backup
npm run db:backup

# Restore
npm run db:restore backup.sql
```

## 🔐 Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Chave para tokens JWT (32+ chars) | `super-secret-key-here` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `FRONTEND_URL` | URL do frontend para CORS | `https://app.netlify.app` |

### Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `JWT_EXPIRES_IN` | Tempo de expiração JWT | `7d` |
| `RATE_LIMIT_MAX_ATTEMPTS` | Limite de tentativas | `10` |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limit | `900000` |

## 📡 API Documentation

### Base URL
- **Produção**: `https://SEU-SITE.netlify.app/api`
- **Desenvolvimento**: `http://localhost:8888/api`

### Endpoints Principais

#### Authentication
```http
POST /api/auth/register    # Registrar personal
POST /api/auth/login       # Login
GET  /api/auth/profile     # Perfil do usuário
POST /api/auth/refresh     # Renovar token
```

#### Plans Management
```http
GET    /api/plans          # Listar planos
POST   /api/plans          # Criar plano
GET    /api/plans/:id      # Obter plano específico
PUT    /api/plans/:id      # Atualizar plano
DELETE /api/plans/:id      # Excluir plano
```

#### Sharing System
```http
POST   /api/share          # Compartilhar plano
GET    /api/share/:shareId # Obter plano compartilhado
PUT    /api/share/:shareId # Renovar compartilhamento
DELETE /api/share/:shareId # Desativar compartilhamento
```

#### Health Check
```http
GET /api/health           # Status do sistema
```

### Exemplos de Uso

#### Autenticação
```javascript
// Login
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'personal@exemplo.com',
        password: 'senha123'
    })
});

const { user, token } = await response.json();
```

#### Compartilhamento
```javascript
// Compartilhar plano
const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        planId: 'uuid-do-plano',
        expiresInDays: 30
    })
});

const { shareId } = await response.json();
// shareId exemplo: "A7B9C2"
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar variáveis
echo $DATABASE_URL

# Testar conexão
npm run db:check

# Verificar logs
netlify logs
```

#### 2. CORS Issues
```javascript
// Verificar FRONTEND_URL no Netlify
// Deve corresponder exatamente ao domínio
FRONTEND_URL=https://seuapp.netlify.app
```

#### 3. JWT Token Inválido
```bash
# Verificar se JWT_SECRET está definido
# Deve ter pelo menos 32 caracteres
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-chars
```

#### 4. Functions Timeout
```javascript
// Verificar logs das functions
netlify logs --level debug

// Otimizar queries lentas no banco
```

### Logs e Monitoramento

```bash
# Logs do Netlify
netlify logs

# Logs específicos de function
netlify logs --function=auth

# Monitoramento de performance
npm run monitor
```

### Performance Tips

1. **Database Queries**: Use índices adequados
2. **Caching**: Implemente cache nas functions
3. **Bundle Size**: Minimize JavaScript
4. **Images**: Use SVG para ícones
5. **Service Worker**: Cache estratégico

## 📊 Monitoramento

### Métricas Importantes

- **Uptime**: Status das functions
- **Response Time**: Latência da API
- **Error Rate**: Taxa de erros
- **Database Connections**: Pool de conexões
- **PWA Score**: Lighthouse metrics

### Dashboards

```bash
# Netlify Analytics
https://app.netlify.com/sites/SEU-SITE/analytics

# Neon Database Metrics  
https://console.neon.tech/app/projects/YOUR-PROJECT

# Lighthouse CI
npm run lighthouse
```

## 🔄 CI/CD Pipeline

### GitHub Actions (opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to Netlify
        run: netlify deploy --prod --dir public
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor local
npm run build            # Build para produção

# Banco de dados
npm run setup-db         # Configurar schema
npm run migrate-data     # Migrar dados existentes
npm run db:check         # Verificar conexão
npm run db:reset         # Resetar banco

# Deploy
npm run deploy           # Deploy para Netlify
npm run deploy:preview   # Deploy preview

# Testes
npm run test             # Executar testes
npm run test:e2e         # Testes end-to-end
npm run lighthouse       # Auditoria PWA

# Utilitários
npm run lint             # Verificar código
npm run format           # Formatar código
npm run monitor          # Monitoramento
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@jsfitapp.com
- **Issues**: [GitHub Issues](https://github.com/SEU_USUARIO/js-fit-app/issues)
- **Documentação**: [Wiki](https://github.com/SEU_USUARIO/js-fit-app/wiki)

---

<div align="center">

**[🌐 Demo Live](https://jsfitapp.netlify.app)** | 
**[📱 PWA Install](https://jsfitapp.netlify.app)** | 
**[🐛 Report Bug](https://github.com/SEU_USUARIO/js-fit-app/issues)**

Desenvolvido com ❤️ para a comunidade fitness

</div>