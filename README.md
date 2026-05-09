# posia-ex-playwright

Template público de automação QA para aplicações web com Playwright, crawler resiliente e relatórios multi-formato.

## Objetivo Educacional
Este repositório é um exemplo prático da disciplina **Fundamentos de IA e LLMs para Programadores**, ministrada pelo Professor Erick Wendel. Demonstra como implementar automação de testes E2E com Playwright, incluindo:

- **Smoke Tests**: Validação rápida de funcionalidades críticas (login, carregamento de páginas).
- **System Crawl**: Descoberta automática de rotas do sistema para garantir cobertura completa.
- **Evidências Automáticas**: Captura de screenshots, tempos de carregamento e erros para análise.
- **Integração em Pipeline**: Exemplo de como adicionar testes automatizados em CI/CD para garantir qualidade contínua.

**Uso Ético**: Projeto exclusivamente para fins educacionais e compartilhamento de conhecimento. Não coletar dados reais de usuários. Respeitar direitos autorais e compliance (LGPD, privacidade).

## O que este template entrega
1. Login automatizado com fallback para login manual bootstrap.
2. Re-login automático quando a sessão expira durante o crawl.
3. Descoberta dinâmica de rotas por prefixo de menu.
4. Evidências por página (screenshot, tempo, erros HTTP/console).
5. Relatórios automáticos em:
   - `crawl.summary.md`
   - `crawl.report.json`
   - `crawl.pages.csv`
   - `crawl.redmine.txt`

## Estrutura
```text
posia-ex-playwright/
├── .env.example
├── package.json
├── playwright.config.ts
├── scripts/
│   ├── bootstrap_storage_state.js
│   └── system_crawl_report.js
├── tests/smoke/login-smoke.spec.ts
├── qa-docs/
│   ├── SETUP_ANALISTA.md
│   ├── SUMARIO_EXECUTIVO.md
│   └── WIKIJS_PROJETO_QA_AUTOMACAO_WEB.md
└── artifacts/system-crawl/
```

## Setup rápido
```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Edite o `.env`:
- `APP_BASE_URL`: URL da aplicação alvo.
- `APP_USER`: usuário de teste.
- `APP_PASS`: senha de teste.
- `APP_MENU_PREFIX`: prefixo de rotas a serem exploradas (ex.: `/app/`).

## Executar
Autenticacao bootstrap (opcional, recomendado na primeira vez):
```bash
npm run auth:bootstrap
```

Crawl completo:
```bash
npm run crawl:system
```

Smoke test Playwright:
```bash
npm run test:smoke
```

## Onde ficam os resultados
1. Ponteiro do ultimo run:
   - `artifacts/system-crawl/LATEST_RUN.txt`
2. Pasta por execucao:
   - `artifacts/system-crawl/crawl-<timestamp>/`

## Seguranca e publicacao
Este template foi preparado para publicacao publica:
1. Sem credenciais reais.
2. Sem URLs de clientes.
3. Sem dados de negocio privados.
4. `.env` ignorado por git.

Antes de publicar fork/projeto derivado:
1. Revise `.env.example`.
2. Rode busca por termos sensiveis internos.
3. Garanta que `artifacts/` nao contenha dados reais.

## Licenca
MIT
