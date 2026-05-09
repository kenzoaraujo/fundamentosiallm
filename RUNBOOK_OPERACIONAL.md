# Runbook Operacional

## Execução
1. Instalar dependências: `npm install`
2. Executar testes: `npx playwright test`
3. Crawl de sistema: `node scripts/system_crawl_report.js`
4. Bootstrap auth: `node scripts/bootstrap_storage_state.js`

## Validação
- Testes passam: Verificar saída do Playwright.
- Sem Erros: Logs limpos de credenciais.
- Performance: Tempo de carregamento < 5s por página.

## Rollback
- Reverter commit: `git reset --hard HEAD~1`
- Remover arquivos: `rm -rf artifacts/`
- Restaurar backup: Se houver, copiar de backup.

## Monitoramento
- Logs em artifacts/system-crawl/
- Evidências em screenshots/test-results/

## Troubleshooting
- Erro de auth: Verificar placeholders em auth.ts.
- Timeout: Aumentar timeout em playwright.config.ts.