# BÉLIN — primeira etapa de segurança

Base: commit f892179. Escopo: correções compatíveis no backend, sem reconstrução, mudança visual/comercial, migration, serviço contratado ou deploy. Não foi usado npm audit fix --force, downgrade para ocultar alertas ou override para uma versão principal incompatível.

## Dependências investigadas

O npm audit inicial confirmou 13 alertas de pacotes: oito moderados, três altos e dois críticos. Há quatro causas principais com alertas propagados aos dependentes; não são treze falhas independentes na aplicação. As consultas npm view/ls e os advisories foram usadas para conferir versões publicadas. As versões máximas estáveis das linhas atualmente utilizadas consultadas foram Prisma 6.19.3, Vitest 3.2.7, minimatch 10.2.6 e typescript-eslint 8.72.2. Não foi encontrada correção estável compatível dentro dessas linhas para os alertas observados; nenhuma versão/lockfile foi alterada apenas para gerar churn.

| Pacote afetado | Instalado | Gravidade | Correção publicada / impacto |
| --- | --- | --- | --- |
| minimatch | 10.2.6, sob typescript-estree | moderado | 11.0.1; major transitiva, fora de ^10.2.2 solicitado pelo pai |
| @typescript-eslint/typescript-estree | 8.72.2 | moderado | herda minimatch; sem versão estável seguinte corrigida encontrada |
| @typescript-eslint/parser | 8.72.2 | moderado | herda typescript-estree |
| @typescript-eslint/type-utils | 8.72.2 | moderado | herda typescript-estree/utils |
| @typescript-eslint/utils | 8.72.2 | moderado | herda typescript-estree |
| @typescript-eslint/eslint-plugin | 8.72.2 | moderado | herda parser/type-utils/utils |
| eslint-config-next | 15.5.29 | moderado | herda a cadeia TypeScript acima; não aplicar downgrade incompatível com ESLint 9 |
| deepmerge-ts | 7.1.5 | alto | 8.0.0 ou superior; major transitiva |
| @prisma/config | 6.19.3 | alto | a linha 7.10.1 consultada utiliza deepmerge-ts 8.0.2 |
| prisma | 6.19.3 | alto | npm recomenda 7.10.1; major, com revisão de configuração, client e requisitos Node |
| @vitest/mocker | 3.2.7 | moderado | 4.1.12 resolve os avisos de mocker consultados; major do conjunto de testes |
| tinypool | 1.1.1 | crítico | 2.1.2 cobre os dois advisories; major transitiva, não forçar sob Vitest 3 |
| vitest | 3.2.7 | crítico por propagação | avaliar 4.1.12 ou linha estável aprovada; npm audit recomenda 5.1.0, também major |

Referências: [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), [tinypool — Worker options](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [tinypool — run options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr), [Vitest — redirect mock](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [Vitest — mock registration](https://github.com/advisories/GHSA-qxg6-89mg-rqv8).

Prisma 7.10.1 exige Node ^20.19, ^22.12 ou >=24, enquanto o projeto declara >=20.9.0. Vitest 4.1.12 declara Node ^20 ou ^22 ou >=24 e já não lista tinypool como dependência direta. A migração exige verificar configuração, mocks, workers e lockfile em uma etapa autorizada, não apenas trocar um número de versão. O Node deste computador é 24.15.0; isso não elimina o impacto sobre outros ambientes.

## Correções aplicadas

- Cache-Control privado/no-store, Pragma e Expires nos caminhos de API administrativos, autenticação, provador, favoritos e imagens locais, inclusive respostas de erro. Imagens locais também variam por Cookie e continuam exigindo ADMIN/EDITOR para rascunhos.
- Autorização de produtos antes da leitura do corpo. JSON administrativo limitado a 256 KiB por bytes reais, mesmo sem Content-Length ou com cabeçalho falso; o teto acomoda o formulário comercial existente de 5.000 caracteres e 100 variantes. Taxonomia usa a mesma leitura limitada.
- Analytics mantém consentimento e cota anteriores de 60/minuto, mas usa leitura limitada a 32.000 bytes reais e o limitador compartilhado com teto de memória. Não foi acrescentada coleta de dados ou mudada a definição de métricas.
- Produtos, taxonomia e metadados de imagens gravam entidade e auditLog no mesmo cliente de transação SQL. Os repositórios de produtos aceitam opcionalmente o cliente transacional, preservando os chamadores existentes.
- No upload, a compensação só remove o novo objeto se o banco confirmar que não há referência. Uma resposta perdida do commit não provoca exclusão cega; se a consulta de reconciliação falha, o objeto é mantido para investigação. O commit confirmado também não é compensado indevidamente.
- O S3 recebe CacheControl privado/no-store nas novas gravações e um prazo total de 30 segundos para GetObject, incluindo obtenção inicial e leitura. Não foram adicionadas ACLs, alteradas políticas de bucket ou regravados objetos existentes.
- Uploads mantêm decodificação integral, limite de pixels/tamanho, normalização JPEG e remoção de metadados. Novos testes cobrem corpos sem tamanho confiável, transações, falhas de auditoria e resposta de commit incerta.
- Fotografias pessoais do provador continuam exclusivamente no processamento transitório e na resposta privada; não são enviadas ao ObjectStorage, catálogo, CDN ou WhatsApp. Há teste de regressão para impedir uma chamada de put no fluxo pessoal. Não existe resultado fictício de IA.

## Limites que NÃO foram declarados resolvidos

Cache-Control não é uma barreira de autorização e não torna privado um bucket com política pública. A configuração atual S3_PUBLIC_BASE_URL e URLs legadas precisam de desenho de acesso compatível. O S3 não está configurado neste computador e seus testes usam SDK mockado, sem requisições externas. [AWS: bloqueio de acesso público](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html).

Transação SQL não engloba S3/disco. A exclusão de imagem ainda pode remover o objeto e depois enfrentar falha no banco. Excluir um produto ainda pode deixar objetos órfãos; não foi implementada limpeza automática nem executada exclusão em massa. A compensação de upload pode deixar objeto não referenciado quando banco/storage ficam indisponíveis; isso evita destruir uma imagem cujo commit pode ter ocorrido, mas exige reconciliação. Não há garantia de atomicidade distribuída.

Os limites continuam por processo; não foi configurado Redis, WAF ou outro serviço. Metadata de analytics e retenção operacional ainda requerem revisão própria. As condições de privacidade, exclusão agendada e validação real autorizada da FASHN continuam pendentes. Não é uma liberação de produção.

## Propostas sujeitas a autorização — NÃO executadas

1. **Dependências major:** migrar Prisma/client para 7.10.1 com revisão de configuração e versão mínima do Node; avaliar Vitest 4.1.12/linha aprovada, mocks e workers; preferir uma release estável de typescript-eslint compatível com minimatch corrigido. Qualquer override 10→11 exige ensaio de compatibilidade autorizado. Sem migration ou conexão de escrita ao banco real nesta proposta.
2. **Acesso privado S3:** bucket/políticas com Block Public Access e objetos privados; servir imagens por gateway autorizado ou URLs temporárias, com publicação somente quando a peça estiver publicada. Revisar compatibilidade e invalidação das URLs existentes antes de mudar contratos ou dados. Não criar/contratar bucket ou alterar conta externa automaticamente.
3. **Consistência durável:** desenhar exclusão em duas fases e uma outbox/tabela de tarefas para reconciliação, tentativas e confirmação, antes de remover referências/objetos. Isso pode exigir migration e mudança arquitetural; exige aprovação separada. Não usar logs de auditoria como fila improvisada nem excluir objetos existentes automaticamente.

## Validação e dados reais

Typecheck/lint e 94 testes unitários passaram após as alterações. Dois testes PostgreSQL permanecem ignorados sem E2E_DATABASE_URL e não foram executados contra dados reais. Os testes de falha usam mocks e arquivos temporários, não uma transação real no banco da loja. A primeira rodada teve uma fixture sem mock de $transaction; ela foi atualizada e as suítes foram repetidas com sucesso.

`npm run build` passou em uma cópia temporária externa dos arquivos atuais, com node_modules compartilhado por junction e saída .next independente. Isso preservou o servidor de desenvolvimento e seu ambiente local. A cópia não recebeu arquivos .env; o teste HTTP com banco carregou o ambiente original apenas na memória do processo.

`npm audit --json --fetch-timeout=20000 --fetch-retries=0` terminou com código 1: **13 alertas restantes, oito moderados, três altos e dois críticos**. `npm audit --omit=dev --json --fetch-timeout=20000 --fetch-retries=0` também terminou com código 1: três altos na cadeia Prisma/deepmerge-ts. Nenhum alerta de dependência foi declarado corrigido. package.json e package-lock.json permaneceram inalterados.

`npx playwright test tests/e2e/public-navigation.spec.ts --workers=2`, com E2E_BASE_URL apontando para a cópia isolada e banco deliberadamente indisponível, passou em seis casos desktop/mobile: home, menu acessível e indisponibilidade do catálogo sem dados inventados.

Uma verificação adicional de navegador, somente leitura no banco local, passou para catálogo, detalhes, favoritos (adicionar, persistir após reload e remover no navegador), link WhatsApp com nome/referência/cor/tamanho e número oficial, navegação/preview do provador com imagem sintética temporária, bloqueio de geração e cancelamento. Nenhuma solicitação de processamento foi enviada. Sete verificações HTTP confirmaram status e Cache-Control privado/no-store para produtos e taxonomia administrativos, exportação, sessão, imagem inexistente, provador desativado e favoritos inválidos. O acesso anônimo ao painel redirecionou ao login; não houve erros JavaScript nesse percurso. Não foi feito login que pudesse atualizar o usuário, nem CRUD real no banco.

A primeira verificação de sessão na instância temporária de produção retornou 500 por Auth.js UntrustedHost. Ela foi repetida com AUTH_TRUST_HOST=true somente no processo de teste ligado a 127.0.0.1; passou. Nenhum .env/configuração persistente foi alterado para confiar em hosts. A configuração de host/proxy confiável continua necessária antes de uma publicação real. A falha inicial da fixture de transação e essa configuração temporária não foram ocultadas.

As impressões SHA-256 do catálogo antes e depois foram idênticas: abaa9e0c6b55877ea591cfcf66c108d02f25ddd230715037735611b781c8b136. Permaneceram três produtos, quatro imagens, um usuário, quatro registros de auditoria e zero operações do provador. Nenhum seed, migration, provisionamento, limpeza do banco, chamada FASHN ou operação S3 real fez parte desta etapa.

## Arquivos modificados ou criados

- Configuração/cache: next.config.ts e src/app/api/local-images/[...key]/route.ts.
- Limites/armazenamento: src/lib/security/request-body.ts, src/lib/storage/object-storage.ts e src/app/api/analytics/route.ts.
- Produtos: src/features/products/admin-service.ts, src/features/products/repository.ts, src/app/api/admin/products/route.ts, src/app/api/admin/products/[id]/route.ts, src/app/api/admin/products/[id]/images/route.ts e src/app/api/admin/products/[id]/images/[imageId]/route.ts.
- Taxonomia: src/app/api/admin/taxonomy/route.ts e src/app/api/admin/taxonomy/[kind]/[id]/route.ts.
- Testes: tests/admin-body-security.test.ts, tests/analytics-security.test.ts, tests/catalog-image-security.test.ts, tests/catalog-transactions.test.ts, tests/private-cache.test.ts, tests/s3-security-policy.test.ts, tests/security-request-body.test.ts, tests/taxonomy-transactions.test.ts e tests/virtual-fitting-api.test.ts.
- Documentação: este relatório e docs/adr/0010-seguranca-cache-e-transacoes-locais.md.

Scripts locais descartáveis e artefatos de validação ficam ignorados pelo Git. Nenhuma credencial ou fotografia pessoal foi adicionada aos commits.
