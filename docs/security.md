# Segurança

## Dependências — pendência de publicação

A auditoria online executada nesta sessão retornou 14 alertas: 8 moderados, 4 altos e 2 críticos. As cadeias reportadas incluem Vitest/@vitest/mocker/tinypool, Prisma/@prisma/config/deepmerge-ts, PostCSS/Next e minimatch/@typescript-eslint. O relatório exige avaliação de alcance e versões corrigidas; não significa que todos os vetores sejam exploráveis na vitrine pública.

Na sessão anterior, `npm audit fix` foi interrompido após demora prolongada. Na retomada de 2026-11-05, `npm ci` restaurou o lockfile e `npm audit --audit-level=high` confirmou os mesmos 14 alertas, retornando código 1. Typecheck, lint e os 19 testes unitários passaram. Nenhuma correção de vulnerabilidades foi aplicada nesta organização do histórico. Não usar `npm audit --offline` como prova de ausência de alertas. Antes da publicação, revisar versões compatíveis, atualizar de forma controlada, executar auditoria online, testes e build novamente. O aviso de Node 20.9.0 incompatível pertence ao ambiente da sessão anterior.

## Limites da verificação

Build e testes unitários não validam OAuth real, migrations em PostgreSQL nem exclusão de fotografias no fornecedor. Os 6 smoke tests Playwright passaram na retomada local sem banco, cobrindo home, menu mobile e indisponibilidade do catálogo; não validam autenticação ou persistência. A validação sintática do Prisma não equivale à aplicação de migrations.

Controles iniciais: TypeScript strict, validação com Zod, autorização server-side, ausência de credenciais no código, MIME sniffing para uploads e rate limiting local no endpoint do provador (3 solicitações por IP a cada 10 minutos, com limite de corpo de 9 MiB). O limite em memória é apenas uma camada da aplicação; produção ainda precisa de rate limiting distribuído, CDN/WAF, storage isolado, logs sem imagens e revisão ASVS.
