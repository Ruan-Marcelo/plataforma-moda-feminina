# Status da fundação técnica

Atualizado após o build de produção validado localmente.

## Estado atual da instalação local

Em 2026-11-05, a instalação foi restaurada com `npm ci --cache .npm-cache --no-audit --no-fund` (474 pacotes), após repetir fora do sandbox a tentativa bloqueada por permissões/rede. O Prisma Client 6.19.3 foi gerado. Typecheck passou, lint passou com 6 avisos de `<img>` e as 8 suítes unitárias passaram com 19 testes. A auditoria online voltou a reportar 14 vulnerabilidades (8 moderadas, 4 altas e 2 críticas); não foi executado `npm audit fix` nesta retomada.

O Git local foi inicializado em `main`, com commits organizados conforme `docs/transfer-commit-plan.md`. A pedido do usuário, `origin` aponta agora para `https://github.com/Ruan-Marcelo/plataforma-moda-feminina.git`. Os originais de `Designer/` ficam ignorados, e os dois assets oficiais usados pelo site são versionados em `public/brand/`.

Na configuração local posterior, o PostgreSQL 18.6 foi conectado usando o `.env` privado, o banco separado `belin_local` foi criado e as quatro migrations foram aplicadas sem alterar outros bancos. Administrador provisionado e login, papel ADMIN, painel, API protegida e CSV verificados no navegador. O catálogo está conectado e vazio, sem seed. O adaptador local de imagens foi testado pelo painel com um rascunho temporário e uma imagem oficial da marca; upload, leitura dos bytes, exibição e exclusão passaram, e o rascunho foi removido. Não há fotografias pessoais nesses testes.

O cache `.npm-cache/` permanece dentro do projeto e é ignorado pelo Git, assim como `node_modules/` e relatórios Playwright. No outro computador, instalar dependências a partir do lockfile em vez de transportar `node_modules`.

## Etapa de detalhes das peças

A página de detalhes recebeu galeria responsiva com controles, teclado e gesto horizontal, seleção consistente de variante, preços configuráveis e relacionados do banco. WhatsApp e provador revalidam os identificadores e a disponibilidade no servidor. O provador nesta etapa é somente navegação/confirmacão, sem envio de fotografias ou geração por IA. O login foi corrigido para entrar diretamente em `/admin` na mesma origem.

A pedido do usuário, três exemplos identificados como demonstração foram salvos em `belin_local`, com ilustrações SVG e preços demonstrativos. Isso substitui o estado vazio da etapa inicial; não representa catálogo comercial real.

Passaram typecheck, lint (4 avisos preexistentes de `<img>`), 28 testes unitários e 14 cenários Playwright (desktop/mobile, preços visíveis/ocultos, variantes, links e login). Os testes de produto usaram PostgreSQL temporário `belin_product_e2e_*`, removido ao final, preservando o banco local e seus exemplos. Detalhes em `docs/product-details.md`.

## Verificado

- Integração real preparada conforme análise prévia da API FASHN: ambas as imagens e resultado em base64 privado, normalização/remoção de metadados no servidor, reserva persistente de créditos e operações em PostgreSQL, POST sem repetição automática, retry GET limitado e política de retenção. Chave ausente, aprovação falsa e orçamento zero: nenhuma geração paga foi chamada. Testes: 60 unitários, dois de cotas/concorrência em banco temporário e 26 E2E com contratos controlados. A validação operacional/qualidade com IA real continua bloqueada, conforme `docs/ai-integration-review.md`.

- Etapa posterior do provador: interface completa com seis estados, fotografia local, autorização, cancelamento e comparação; geração real desabilitada por padrão. Passaram 46 testes unitários e 26 cenários E2E em banco temporário, com respostas do serviço interceptadas apenas nos testes e chamadas externas ao FASHN bloqueadas. Isso não comprova a integração operacional com IA. Veja `docs/virtual-fitting.md` e ADR 0006.

- Next.js App Router, React e TypeScript strict compilam.
- Tailwind e identidade BÉLIN estão configurados com bordô `#8D263B`, creme `#FFF0D0` e nude `#E8D8C4`.
- Home responsiva usa o logotipo e a peça editorial oficiais da pasta `Designer/`, com menu mobile acessível e links reais para catálogo, categorias, provador e Instagram.
- Novidades da home usam somente produtos publicados no banco; quando não há dados, a interface exibe estado vazio sem inventar peças.
- Componentes compartilhados de botão, campo, card, cabeçalho, rodapé e card de produto estão documentados em `docs/design-system.md`.
- Catálogo, categorias, produto, provador, privacidade, sitemap e robots possuem rotas.
- PostgreSQL está modelado com Prisma e migrations versionadas.
- Prisma Client regenerado e as quatro migrations aplicadas no PostgreSQL 18.6 local. `prisma migrate status` confirmou o schema atualizado; isso não executa migrations em outros ambientes.
- Produtos, variações, categorias, coleções e imagens possuem fluxo administrativo protegido.
- Upload de imagens valida MIME, assinatura real, tamanho e storage configurado. Em desenvolvimento, `STORAGE_DRIVER=local` permite persistência em disco sem S3; produção mantém o contrato S3 (ADR 0004).
- Analytics usa consentimento, validação Zod, rate limit e agregações sem dados pessoais no CSV.
- Provador possui adaptador FASHN server-side, timeout, limites e resposta explícita quando não configurado.
- Typecheck passou.
- Último lint executado passou sem erros, com 6 avisos de `<img>`.
- 9 suítes e 22 testes unitários passaram após adicionar os testes de persistência e segurança de caminhos do storage local. Esses testes não comprovam o comportamento de todos os seletores de produto em navegador.
- Build de produção passou novamente após a configuração local do PostgreSQL e do adaptador de imagens (Next.js 15.5.28). O adaptador local permanece desativado em produção; o fluxo de upload foi verificado no servidor de desenvolvimento.
- Chromium instalado e 6 smoke tests públicos passaram em desktop e mobile contra o servidor local de desenvolvimento, ainda sem banco configurado. O seletor do link do provador foi ajustado para o CTA visível nas duas larguras.
- A última auditoria online reportou 14 vulnerabilidades (8 moderadas, 4 altas e 2 críticas). O resultado zero de auditorias offline não invalida esse relatório. Correção pendente antes da publicação.
- Os dois diretórios de staging conhecidos foram removidos. Essa checagem não comprova ausência de caches e logs de ferramentas fora do projeto.

## Depende de configuração externa

- `DATABASE_URL`, PostgreSQL, `AUTH_SECRET` e administrador já estão configurados nesta máquina; outros ambientes exigem configuração própria.
- Credenciais Google/Apple, se os logins OAuth forem ativados.
- `STORE_WHATSAPP_NUMBER` real.
- `S3_*` para uploads de imagens em produção; desenvolvimento local usa disco com `STORAGE_DRIVER=local`.
- `FASHN_API_KEY` para geração real do provador.
- CDN/WAF, HTTPS, domínio, backups, alertas e observabilidade para produção.

## Ainda não considerado concluído

- Ampliação dos testes E2E versionados para PostgreSQL, autenticação, produto publicado, filtros e taxonomias. Os fluxos de login, CSV e upload/exclusão de imagens em rascunho foram verificados localmente com scripts privados que leem o `.env`.
- Auditoria manual completa de acessibilidade em leitores de tela e navegadores reais.
- Fluxos completos de verificação/recuperação de e-mail com provedor de envio configurado.
- Edição de categorias/coleções já cadastradas.
- Intervalo personalizado e séries temporais avançadas no dashboard.
- Revisão jurídica final de LGPD, retenção e termos do provedor de IA.

Esses itens não devem ser mascarados por dados fictícios ou integrações simuladas. O plano de commits em `docs/transfer-commit-plan.md` organiza a continuação.
