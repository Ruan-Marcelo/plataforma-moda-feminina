# Status da fundação técnica

Atualizado após o build de produção validado localmente.

## Estado atual da instalação local

Em 2026-11-05, a instalação foi restaurada com `npm ci --cache .npm-cache --no-audit --no-fund` (474 pacotes), após repetir fora do sandbox a tentativa bloqueada por permissões/rede. O Prisma Client 6.19.3 foi gerado. Typecheck passou, lint passou com 6 avisos de `<img>` e as 8 suítes unitárias passaram com 19 testes. A auditoria online voltou a reportar 14 vulnerabilidades (8 moderadas, 4 altas e 2 críticas); não foi executado `npm audit fix` nesta retomada.

O Git local foi inicializado em `main`, com commits organizados conforme `docs/transfer-commit-plan.md`. Não há remoto configurado nem publicação no GitHub. Os originais de `Designer/` ficam ignorados, e os dois assets oficiais usados pelo site são versionados em `public/brand/`.

O cache `.npm-cache/` permanece dentro do projeto e é ignorado pelo Git, assim como `node_modules/` e relatórios Playwright. No outro computador, instalar dependências a partir do lockfile em vez de transportar `node_modules`.

## Verificado

- Next.js App Router, React e TypeScript strict compilam.
- Tailwind e identidade BÉLIN estão configurados com bordô `#8D263B`, creme `#FFF0D0` e nude `#E8D8C4`.
- Home responsiva usa o logotipo e a peça editorial oficiais da pasta `Designer/`, com menu mobile acessível e links reais para catálogo, categorias, provador e Instagram.
- Novidades da home usam somente produtos publicados no banco; quando não há dados, a interface exibe estado vazio sem inventar peças.
- Componentes compartilhados de botão, campo, card, cabeçalho, rodapé e card de produto estão documentados em `docs/design-system.md`.
- Catálogo, categorias, produto, provador, privacidade, sitemap e robots possuem rotas.
- PostgreSQL está modelado com Prisma e migrations versionadas.
- Prisma Client regenerado e schema validado sintaticamente com URL temporária. A migration do índice ainda precisa ser aplicada e testada em PostgreSQL; `prisma validate` não executa migrations.
- Produtos, variações, categorias, coleções e imagens possuem fluxo administrativo protegido.
- Upload de imagens valida MIME, assinatura real, tamanho e storage configurado.
- Analytics usa consentimento, validação Zod, rate limit e agregações sem dados pessoais no CSV.
- Provador possui adaptador FASHN server-side, timeout, limites e resposta explícita quando não configurado.
- Typecheck passou.
- Último lint executado passou sem erros, com 6 avisos de `<img>`.
- 8 suítes e 19 testes unitários passaram na retomada de 2026-11-05. Esses testes não comprovam o comportamento da galeria e dos seletores em navegador.
- Build de produção passou novamente na retomada de 2026-11-05 (Next.js 15.5.28), sem banco ou integrações externas configurados. Isso não valida os fluxos reais dessas integrações.
- Playwright foi configurado com 6 smoke tests públicos para desktop e mobile; a execução depende dos navegadores instalados no ambiente.
- A última auditoria online reportou 14 vulnerabilidades (8 moderadas, 4 altas e 2 críticas). O resultado zero de auditorias offline não invalida esse relatório. Correção pendente antes da publicação.
- Os dois diretórios de staging conhecidos foram removidos. Essa checagem não comprova ausência de caches e logs de ferramentas fora do projeto.

## Depende de configuração externa

- `DATABASE_URL` e PostgreSQL para catálogo, administração e analytics.
- `AUTH_SECRET` e provisionamento do primeiro administrador.
- Credenciais Google/Apple, se os logins OAuth forem ativados.
- `STORE_WHATSAPP_NUMBER` real.
- `S3_*` para uploads de imagens.
- `FASHN_API_KEY` para geração real do provador.
- CDN/WAF, HTTPS, domínio, backups, alertas e observabilidade para produção.

## Ainda não considerado concluído

- Execução dos testes E2E com navegadores Playwright instalados.
- Auditoria manual completa de acessibilidade em leitores de tela e navegadores reais.
- Fluxos completos de verificação/recuperação de e-mail com provedor de envio configurado.
- Edição de categorias/coleções já cadastradas.
- Intervalo personalizado e séries temporais avançadas no dashboard.
- Revisão jurídica final de LGPD, retenção e termos do provedor de IA.

Esses itens não devem ser mascarados por dados fictícios ou integrações simuladas. O plano de commits em `docs/transfer-commit-plan.md` organiza a continuação.
