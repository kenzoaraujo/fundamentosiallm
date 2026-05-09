# posia-ex-playwright

![GitHub repo size](https://img.shields.io/github/repo-size/kenzoaraujo/fundamentosiallm?style=flat-square)
![GitHub top language](https://img.shields.io/github/languages/top/kenzoaraujo/fundamentosiallm?style=flat-square)
![License](https://img.shields.io/github/license/kenzoaraujo/fundamentosiallm?style=flat-square)

> Exemplo de automação QA com Playwright e crawler de rotas para aplicações web. Projeto educacional para a disciplina **Fundamentos de IA e LLMs para Programadores** realizada pelo nosso professor Erick Wendel.

## 📌 Sumário
- [Por que este projeto?](#-por-que-este-projeto)
- [O que está neste template](#-o-que-está-neste-template)
- [Como começar](#-como-comecar)
- [Comandos principais](#-comandos-principais)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Segurança e compliance](#-segurança-e-compliance)
- [Documentação adicional](#-documentação-adicional)
- [Licença](#-licença)

## 🎯 Por que este projeto?
Este repositório mostra um fluxo completo de garantia de qualidade:
- **Smoke tests** para validar funcionalidades críticas rapidamente
- **Crawl dinâmico** de rotas para descobrir páginas da aplicação
- **Evidências automáticas** com screenshots, tempos e erros
- **Relatórios** prontos para análise técnica e operacional

## ✨ O que está neste template
- Login automatizado com fallback para bootstrap manual
- Re-login automático durante o crawl
- Descoberta de rotas por prefixo de menu configurável
- Captura de screenshots e métricas de desempenho
- Geração de relatórios `Markdown`, `JSON`, `CSV` e texto
- Documentação de processo e compliance em `qa-docs/`

## 🚀 Como começar
```bash
cd posia-ex-playwright
npm install
npx playwright install chromium
cp .env.example .env
```

### Configurar `.env`
Edite o arquivo criado com valores de exemplo:
- `APP_BASE_URL`: URL da aplicação alvo
- `APP_USER`: usuário de teste
- `APP_PASS`: senha de teste
- `APP_MENU_PREFIX`: prefixo de rotas a serem exploradas (`/app/`)

## ▶️ Comandos principais
```bash
npm run auth:bootstrap     # bootstrap de autenticação
npm run crawl:system       # executar crawler de rotas
npm run test:smoke         # rodar smoke tests Playwright
```

## 📁 Estrutura do repositório
```text
posia-ex-playwright/
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── scripts/
│   ├── bootstrap_storage_state.js
│   └── system_crawl_report.js
├── tests/
│   └── smoke/login-smoke.spec.ts
├── src/
│   └── helpers/auth.ts
├── qa-docs/
│   ├── SETUP_ANALISTA.md
│   ├── SUMARIO_EXECUTIVO.md
│   └── WIKIJS_PROJETO_QA_AUTOMACAO_WEB.md
├── artifacts/
│   └── system-crawl/.gitkeep
└── README.md
```

## 🔒 Segurança e compliance
- Nunca versionar credenciais reais
- Use `.env.example` como modelo
- `.gitignore` já protege:
  - `.env`
  - `node_modules/`
  - `artifacts/`
  - `playwright-report/`
  - `test-results/`
- Projeto para fins educacionais e compartilhamento de conhecimento

## 📚 Documentação adicional
- `STATE_OF_PROJECT.md` — status e próximos passos
- `DECISOES_TECNICAS.md` — decisões de arquitetura e segurança
- `RESTRICOES_E_SEGURANCA.md` — guardrails e compliance
- `RUNBOOK_OPERACIONAL.md` — execução, validação e rollback

## 📝 Licença
MIT
