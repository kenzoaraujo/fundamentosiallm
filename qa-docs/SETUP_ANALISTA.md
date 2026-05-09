# Setup do Analista QA (Template Generico)

## Requisitos
1. Node.js 18+
2. npm 9+
3. Git
4. Chromium (instalado via Playwright)

## Primeira execucao
```bash
git clone <seu-repositorio>
cd posia-ex-playwright
npm install
npx playwright install chromium
cp .env.example .env
```

Preencha o `.env` com dados de ambiente de QA.

## Gerar sessao autenticada
```bash
npm run auth:bootstrap
```

## Executar crawl
```bash
npm run crawl:system
```

## Arquivos gerados
1. `crawl.summary.md` - resumo rapido
2. `crawl.report.json` - detalhado tecnico
3. `crawl.pages.csv` - analise em planilha
4. `crawl.redmine.txt` - pronto para wiki/ticket
5. `progress.log` - trilha de execucao

## Notas operacionais
1. O crawler usa continue-on-error.
2. Se houver redirecionamento para `/login` no meio da execucao, ele tenta re-login automatico.
3. Use `LATEST_RUN.txt` para localizar o ultimo run.
