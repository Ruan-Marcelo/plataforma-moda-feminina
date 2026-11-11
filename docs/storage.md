# Armazenamento de imagens

Imagens de catálogo recebidas pelo painel são validadas, decodificadas integralmente, normalizadas para JPEG e armazenadas sem metadados. A chave tem o formato `products/{productId}/{uuid}.jpg`. Fotografias pessoais do provador não passam pelo armazenamento do catálogo.

O backend entrega objetos próprios pela rota `/api/catalog-images/...`: ela valida a chave e a referência no banco, permite acesso público apenas para peças publicadas e exige ADMIN ou EDITOR para rascunhos e itens arquivados. As respostas usam `private, no-store`. URLs antigas que possuem `storageKey` são convertidas no momento da leitura, sem regravar dados antigos. Recursos externos sem chave permanecem sob responsabilidade da origem. A rota local antiga continua disponível por compatibilidade.

## Local

Em desenvolvimento, `STORAGE_DRIVER=local` armazena imagens em `.local-data/catalog-images/`, que deve acompanhar os backups do banco e não deve ser versionado. Essa implementação fica indisponível em produção. Imagens de demonstração sem chave continuam servidas pelos arquivos públicos do projeto.

## S3 compatível

Configure `STORAGE_DRIVER=s3`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY`; para serviços compatíveis, configure também endpoint e path-style quando necessário. `S3_PUBLIC_BASE_URL` não é necessário para novos uploads. O servidor usa credenciais para ler objetos e não precisa expor a URL do bucket.

**A rota da aplicação não altera a política da conta.** Antes de usar S3, configure bloqueio de acesso público e objetos privados no próprio fornecedor, revise URLs públicas antigas e caches externos e teste a configuração real. Objetos que já foram expostos por um bucket público continuam acessíveis por sua URL direta enquanto a política externa os permitir. Não há S3 configurado ou verificado neste computador.

## Exclusões e recuperação

Excluir uma imagem ou produto registra, na mesma transação que exclui os metadados, uma tarefa persistente de limpeza. Depois do commit a aplicação tenta remover o objeto. Se houver falha, a tarefa mantém código técnico sem fotografias ou credenciais e pode ser repetida; uma referência ativa impede a exclusão. As tarefas são limitadas a oito tentativas e usam uma concessão temporária para execução concorrente. O alvo do armazenamento é identificado por hash, evitando aplicar tarefas de um bucket ou diretório em outro.

`npm run db:reconcile-storage` apenas conta tarefas pendentes. `npm run db:reconcile-storage -- --execute` tenta até 20 tarefas elegíveis no armazenamento atualmente configurado; planeje execução periódica e monitoramento antes de produção. Tarefas esgotadas, chaves antigas inválidas e objetos órfãos anteriores devem ser investigados manualmente. Se uma falha acontecer antes de o banco receber a tarefa de um upload, o objeto ainda pode ficar órfão; não há atomicidade distribuída nem varredura automática de objetos antigos.
