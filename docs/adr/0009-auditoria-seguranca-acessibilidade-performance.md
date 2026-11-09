# ADR 0009 — Correções pontuais após auditoria

Status: aceita para implementação local; não representa aprovação de produção.

## Decisões

- Preservar Next App Router, serviços/repositórios, autenticação Auth.js e o contrato do provador. Não adicionar checkout, serviços pagos ou novos modelos de dados.
- Imagens de catálogo não publicadas exigem editor na rota local. O armazenamento S3 precisa de revisão própria; essa proteção não transforma URLs de bucket público em URLs privadas.
- Novos uploads administrativos usam limite efetivo de corpo e decodificação/normalização já disponível no servidor. As cópias salvas são JPEG sem metadados. Arquivos existentes não são reprocessados em lote.
- Adicionar limites de login por conta HMAC e processo e limitar a memória do limitador compartilhado. Os controles permanecem locais ao processo; o orçamento do provador continua global no PostgreSQL.
- Tornar início/categorias dinâmicos porque sua fonte é o banco e não há invalidação da renderização estática ao alterar produtos. A decisão privilegia atualidade; avaliar cache com invalidação explícita somente após medição real.
- Usar diálogo HTML nativo para preferências de cookies, com retorno de foco e tratamento de storage bloqueado. O botão de reabertura fica no fluxo do rodapé para evitar cobrir conteúdo/foco.
- Reaproveitar imagens já consultadas pelo servidor no painel, sem consultar novamente cada lista ao montar um card. Arquivos pessoais/blob/data não passam pelo otimizador público; URLs externas não ganham proxy irrestrito.
- Atualizar apenas versões compatíveis dentro das versões principais atuais e registrar overrides explícitos de PostCSS e ferramentas de lint. Não forçar migração de Prisma/Vitest por `npm audit fix --force` durante uma auditoria sem autorização para mudança abrangente.
- Executar axe/web-vitals como ferramentas de desenvolvimento, sem embarcar telemetria nova ou enviar métricas de visitantes a terceiros.

## Limitações e evidência

O relatório `docs/quality-audit-2026-11-09.md` reúne falhas, reexecuções, medições de laboratório e riscos ainda abertos. Alertas remanescentes de dependências, S3, revisão de privacidade, limpeza agendada, infraestrutura HTTPS/WAF e teste real autorizado com FASHN impedem tratar esta entrega como liberação irrestrita para produção.
