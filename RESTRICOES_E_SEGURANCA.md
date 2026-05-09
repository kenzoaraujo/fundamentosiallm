# Restrições e Segurança

## Guardrails de Segurança
- **Nunca expor credenciais**: Não versionar senhas, keys, tokens reais. Usar placeholders como [SENHA_DO_1PASSWORD].
- **Mascarar dados sensíveis**: Em logs, evidências e documentação, substituir por placeholders.
- **Revisão obrigatória**: Qualquer mudança de alto risco deve ser revisada por humano.
- **Janela operacional**: Sem restrição, mas evitar ações destrutivas sem autorização.

## Compliance
- **LGPD e privacidade**: Projeto para fins educacionais, não coletar dados reais de usuários.
- **Direitos autorais**: Usar apenas recursos open-source ou próprios; citar fontes.
- **Uso ético**: Compartilhar conhecimento, não para fins comerciais sem permissão.

## O que Não Pode Fazer
- ❌ Expor credenciais em commits, PRs ou documentação.
- ❌ Executar comandos destrutivos sem confirmação.
- ❌ Compartilhar dados sensíveis em evidências.

## Checklist de Segurança Pré-Push
- [ ] Nenhum segredo no diff.
- [ ] Dados sensíveis mascarados.
- [ ] Comando destrutivo? Autorização explícita?
- [ ] Evidências e rollback descritos.