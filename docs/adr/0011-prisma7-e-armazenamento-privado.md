# ADR 0011 — Prisma 7 e proteção dos objetos do catálogo

## Contexto

O relatório de segurança da etapa 1 identificou alertas nas cadeias Prisma 6, Vitest 3 e minimatch 10, URLs diretas de S3 e o risco de falha entre operações SQL e armazenamento. A etapa seguinte foi autorizada para concluir o trabalho local sem serviço pago ou publicação.

## Decisão

Atualizar Prisma Client e CLI para 7.10.1 com adaptador PostgreSQL, configuração explícita do CLI e requisitos Node `^20.19 || ^22.12 || >=24`; atualizar Vitest para 4.1.12. Enquanto a cadeia TypeScript-ESLint não oferece versão estável corrigida, restringir o override de minimatch 11.0.1 ao `typescript-estree` e validar lint, testes e build. O gerador `prisma-client-js` é mantido por compatibilidade de imports; sua substituição futura deve ser planejada antes de sua remoção pelo Prisma.

Servir imagens com chave própria pelo backend após conferir publicação ou papel administrativo, preservando URLs externas sem chave. Não incluir a URL direta do S3 nos novos uploads. A política de acesso do bucket permanece um requisito externo e não é inferida dos cabeçalhos HTTP.

Criar `StorageDeletionTask` por migration aditiva. Após a transação, uma tentativa remove o objeto; falhas geram tarefas com tentativas limitadas, atrasos e concessão temporária. O comando de reconciliação é observacional por padrão e só executa remoções com `--execute`. Não usar auditLog como fila. Chaves de objetos com referência ativa não são removidas.

## Limitações

A tabela não resolve automaticamente uploads órfãos sem metadados nem controla dados em buckets públicos legados. A operação automática de retries requer agendamento e supervisão; nenhuma infraestrutura paga é criada. Esta decisão não habilita a API FASHN paga, não ativa IA e não dispensa a revisão de privacidade do fornecedor usado futuramente.

Referências: [guia oficial Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [migração Vitest 4](https://v4.vitest.dev/guide/migration.html), [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html).
