# Plano de commits para continuar o projeto em outro computador

Este documento organiza uma sequência para publicar o projeto no GitHub e continuar o desenvolvimento. O repositório local foi inicializado em `main` em 2026-11-05, seguindo as nove etapas abaixo. O remoto `origin` foi configurado a pedido do usuário para `https://github.com/Ruan-Marcelo/plataforma-moda-feminina.git`. Confirme a sincronização com `git status -sb` e `git log origin/main`.

Os commits organizam por tema um código que já existia integrado. Não representam etapas históricas de desenvolvimento nem garantem que cada commit intermediário compile isoladamente; a validação se refere ao conjunto final. Os originais de `Designer/` permanecem locais; somente os dois assets oficiais usados pelo site em `public/brand/` entram no histórico.

## Preparação

No outro computador:

```powershell
git clone <URL_DO_REPOSITORIO>
cd RUAN
npm install
Copy-Item .env.example .env
```

Não versione `node_modules`, `.next`, `.env`, senhas, chaves OAuth/FASHN/S3 ou imagens pessoais. Cada computador deve usar seu próprio `.env`.

## Commit 01 — fundação e documentação

Mensagem:

```text
chore: establish Belin platform foundation and documentation
```

Inclua Next.js, TypeScript strict, Tailwind, `AGENTS.md`, `README.md`, `.env.example`, `docs/`, ADRs, scripts, configuração de lint/testes e migrations Prisma.

Valide `npm install` e `npm run check`.

## Commit 02 — identidade visual e vitrine

Mensagem:

```text
feat: add Belin responsive storefront
```

Inclua identidade BÉLIN, paleta bordô/creme/nude, página inicial, navegação, catálogo, categorias, produto, SEO, sitemap, robots, estados vazios e layout mobile-first.

Valide `npm run typecheck`, `npm run lint` e `npm run build`. Confira `/`, `/catalogo`, `/categorias` e `/privacidade` no celular e desktop.

## Commit 03 — WhatsApp e consentimento

Mensagem:

```text
feat: add WhatsApp conversion and cookie consent
```

Inclua o serviço de WhatsApp, mensagens contextualizadas, registro de cliques condicionado ao consentimento, banner e preferências de cookies.

Valide `npm run typecheck`, `npm run lint` e `npm test`. Não use número fictício em produção.

## Commit 04 — autenticação administrativa

Mensagem:

```text
feat: protect admin access with server-side authorization
```

Inclua credenciais, papéis, proteção server-side, provisionamento restrito do primeiro administrador e OAuth Google/Apple somente com credenciais oficiais.

Configure localmente `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_PROVISION_CONFIRM=YES`; depois execute `npm run db:provision-admin`. Nunca versione esses valores.

## Commit 05 — catálogo e taxonomias

Mensagem:

```text
feat: add protected catalog management
```

Inclua CRUD de produtos, variações, status, categorias, coleções, associação de taxonomias, confirmação de exclusão, auditoria e Zod.

Valide com banco de desenvolvimento: `npm run db:migrate`, `npm run db:seed`, `npm run typecheck` e `npm test`.

## Commit 06 — imagens e storage

Mensagem:

```text
feat: add validated catalog image storage
```

Inclua adaptador S3 compatível, `ProductImage.storageKey`, upload/exclusão protegidos, validação de assinatura, limites e UI administrativa.

Configure somente no `.env`:

```text
S3_ENDPOINT=
S3_REGION=us-east-1
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=
S3_FORCE_PATH_STYLE=false
```

## Commit 07 — analytics e CSV

Mensagem:

```text
feat: add consent-aware analytics dashboard
```

Inclua eventos com consentimento/rate limit, dashboard de 7/30/90 dias e exportação CSV somente com contagens agregadas. Não exporte identificadores ou metadata pessoal.

Valide `npm run typecheck`, `npm run lint` e `npm test`.

## Commit 08 — provador virtual real

Mensagem:

```text
feat: integrate server-side virtual try-on provider
```

Inclua o adaptador `VirtualTryOnProvider`, validação de imagem, limites, timeout, rate limit e FASHN somente com chave real.

```text
FASHN_API_KEY=<chave-real>
FASHN_MODEL=tryon-max
```

Sem chave, exiba “não configurado”; nunca crie resultado simulado.

## Commit 09 — endurecimento e publicação

Mensagem:

```text
chore: harden production readiness and deployment docs
```

Inclua headers, limites, backups, observabilidade, CDN/WAF, retenção, OAuth, HTTPS, testes de autorização, Playwright e acessibilidade. Atualize `docs/security.md` e `docs/deployment.md`.

Validação final:

```powershell
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

## Criar os commits

Para cada etapa:

```powershell
git status
git add <arquivos-da-etapa>
git diff --cached --check
git commit -m "mensagem da etapa"
```

Se ainda não houver Git, execute somente dentro desta pasta:

```powershell
git init
git branch -M main
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```

Não faça commit de `.env` nem de credenciais. O banco, storage, OAuth e IA são configurações de ambiente e devem ser cadastrados separadamente em cada computador.
