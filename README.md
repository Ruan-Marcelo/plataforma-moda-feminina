# BÉLIN — vitrine digital de moda feminina

Fundacao inicial de uma vitrine Next.js com catalogo orientado a PostgreSQL, conversao por WhatsApp e provador virtual isolado por adaptador.

## Desenvolvimento

1. Instale Node.js 20.9+.
2. Copie .env.example para .env e configure PostgreSQL.
3. Execute npm install.
4. Execute npm run db:generate e npm run db:migrate.
5. Para visualizar dados de demonstracao, execute npm run db:seed em desenvolvimento.
6. Execute npm run typecheck, npm run lint, npm test e npm run build.
7. Para uma verificação única, execute `npm run check`.
8. Inicie com npm run dev.

O catálogo consulta apenas produtos publicados no PostgreSQL e oferece busca, filtros básicos, ordenação e paginação. O painel administrativo permite cadastrar produtos, variações e imagens; uploads exigem storage S3 compatível configurado no servidor. Os registros demo não representam catálogo comercial real e o seed é bloqueado em produção.

Para levar o projeto a outro computador e organizar o histórico do GitHub, consulte [docs/transfer-commit-plan.md](docs/transfer-commit-plan.md).

O estado verificado e as pendências reais estão em [docs/foundation-status.md](docs/foundation-status.md).

O funcionamento do catálogo está descrito em [docs/catalog.md](docs/catalog.md).

A configuração deste computador, os comandos para iniciar e os limites das integrações estão em [docs/local-development.md](docs/local-development.md).

O projeto usa UTF-8 e finais de linha LF para preservar acentos e reduzir diferenças entre computadores; veja `.editorconfig` e `.gitattributes`.
