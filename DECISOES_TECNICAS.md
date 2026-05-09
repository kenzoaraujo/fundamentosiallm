# Decisões Técnicas

## Decisão: Estrutura do Projeto
- **Data**: 2026-05-09
- **Decisão**: Usar Playwright para automação de testes E2E, com estrutura separada para scripts de crawl e testes smoke.
- **Motivo**: Playwright é robusto para testes web, permite crawl de rotas e captura de evidências. Estrutura modular facilita manutenção.
- **Alternativas**: Cypress (menos flexível para crawl), Selenium (mais complexo).
- **Impacto**: Facilita testes automatizados, reduz tempo de QA manual.

## Decisão: Linguagem e Framework
- **Data**: 2026-05-09
- **Decisão**: TypeScript/Node.js para scripts e testes.
- **Motivo**: TypeScript oferece tipagem forte, Node.js é padrão para Playwright.
- **Alternativas**: JavaScript puro (menos seguro), Python (não nativo para Playwright).
- **Impacto**: Melhor manutenção e escalabilidade.

## Decisão: Segurança
- **Data**: 2026-05-09
- **Decisão**: Não versionar credenciais; usar placeholders e variáveis de ambiente.
- **Motivo**: Compliance com segurança, evitar exposição de dados sensíveis.
- **Alternativas**: Hardcode de credenciais (risco de vazamento).
- **Impacto**: Projeto seguro para compartilhamento público.