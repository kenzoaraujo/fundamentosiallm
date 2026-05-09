# Checklist de Publicacao (Repositorio Publico)

## Segurança e sigilo
- [ ] `.env` nao esta versionado
- [ ] Nao existe credencial real em arquivos `.md`, `.json`, `.js`, `.ts`
- [ ] Nao existe URL interna/confidencial
- [ ] Nao existe nome de cliente/produto privado
- [ ] Nao existem screenshots com dados sensiveis

## Qualidade tecnica
- [ ] `npm install` funciona
- [ ] `npx playwright install chromium` funciona
- [ ] `npm run test:smoke` executa
- [ ] `npm run crawl:system` gera relatorios

## Documentacao
- [ ] `README.md` instrutivo na pagina principal
- [ ] `qa-docs/SETUP_ANALISTA.md` atualizado
- [ ] `qa-docs/WIKIJS_PROJETO_QA_AUTOMACAO_WEB.md` pronto para colar
