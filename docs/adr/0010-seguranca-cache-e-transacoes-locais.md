# ADR 0010 — Cache privado e transações locais, sem migração de arquitetura

Status: aceita para correções compatíveis da primeira etapa. Propostas de major/S3 privado/outbox aguardam autorização.

## Decisão

Preservar as interfaces públicas, o modelo de dados, o design e as regras comerciais. Aplicar política HTTP no-store em APIs sensíveis; antecipar autorização e limitar os bytes realmente lidos. Usar as transações Prisma já disponíveis para juntar cada gravação de catálogo/taxonomia/imagem à sua auditoria. Nenhuma migration é necessária.

Não compensar um upload removendo o objeto se houver referência no banco ou se o resultado do commit não puder ser determinado. Isso prioriza não destruir uma imagem confirmada, deixando reconciliação explícita como risco pendente.

Não tratar Cache-Control ou ACL de objeto como substituto de políticas do bucket. O cache privado de novas gravações S3 é defesa complementar; não garante privacidade de URLs existentes. Fotos pessoais do provador não entram nesse storage.

## Alternativas não executadas

Não executar majors, downgrades para silenciar audit, override incompatível ou npm audit fix --force. Não criar uma outbox/worker/tabela de estado ou migrar URLs S3 sem autorização. Não aplicar limpeza de órfãos ao banco ou storage reais.

## Evidência e consequências

Ver `docs/security-stage-1-2026-11-09.md` para os 13 pacotes, versões corrigidas, testes, restrições e propostas. Permanecem alertas de dependência e a impossibilidade de garantir uma transação única entre PostgreSQL e storage. Esta decisão não equivale a aprovação de produção nem certificação de configuração S3 externa.
