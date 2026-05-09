# Projeto QA Automacao Web (Wiki.js)

## Visao geral
Pipeline de automacao para aplicacoes web com Playwright.

### Etapas
1. Autenticacao
2. Descoberta de rotas
3. Navegacao automatizada
4. Coleta de evidencias
5. Geracao de relatorios

## Stack
1. Playwright: automacao de browser
2. Node.js: runtime dos scripts
3. npm: orquestracao via scripts
4. dotenv: configuracao por ambiente
5. Chromium: execucao dos cenarios

## Saidas
1. `crawl.summary.md`
2. `crawl.report.json`
3. `crawl.pages.csv`
4. `crawl.redmine.txt`

## Boas praticas
1. Nao publicar `.env`.
2. Usar usuarios de teste dedicados.
3. Sanitizar dados antes de compartilhar evidencias.
4. Executar em janelas de menor impacto operacional.
