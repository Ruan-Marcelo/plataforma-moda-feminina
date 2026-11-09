# Auditoria final BÉLIN — 9 de novembro de 2026

## Conclusão e escopo

Revisão do projeto existente, sem reconstrução, novos modelos de dados, migração de framework, checkout ou pagamento. As correções são localizadas. A aprovação para produção permanece condicionada às pendências de segurança, infraestrutura e privacidade abaixo. Integração técnica com FASHN não equivale a geração real validada.

Ambiente: Windows, Node 24.15.0, Next.js 15.5.29, React 19, PostgreSQL local. As medições públicas usam `next start` em `localhost:3200`; a suíte funcional usa servidor de desenvolvimento e bancos descartáveis `belin_product_e2e_*`. O banco `belin_local`, seus produtos e imagens não foram usados como alvo de criação/edição/exclusão dos testes. Uploads de teste usam o logo público da marca, sem fotografia pessoal.

## Funcionalidades verificadas

| Área | Evidência / limite |
| --- | --- |
| Início e navegação | Página inicial, links, menu mobile, Escape, foco e atalho para conteúdo |
| Categorias e catálogo | Categorias com peças publicadas; busca e filtros por categoria/disponibilidade em banco real isolado |
| Detalhes | Galeria, teclado/toque, variantes existentes, indisponíveis e estrangeiras, identificação, preço e relacionados reais |
| Favoritos | Inclusão/remoção, duplicidade, recarga, sincronização entre abas, storage bloqueado, peças removidas/esgotadas e falha de consulta |
| Upload pessoal | Prévia local, validação de formato/conteúdo/tamanho, substituição, cancelamento e limpeza; nenhum processamento real disparado |
| FASHN / resultado | Adaptador HTTP oficial, timeout, erros, retry de status, quota e privacidade em testes controlados; estados de resultado/comparação com respostas interceptadas somente nos testes |
| WhatsApp | Destino configurado, mensagem codificada, peça/variante revalidadas e exclusão de fotos dos links; nenhuma mensagem enviada |
| Administração | Login, bloqueio anônimo, criação/edição/exclusão de produto pela UI, upload/exclusão de imagem, acesso a imagem de rascunho e CSV |

A chave FASHN continua ausente, a autorização de gasto falsa e o orçamento zero. Não houve compra, contratação, geração paga ou verificação de qualidade/latência do provedor real. O storage S3 não está configurado nem foi exercitado.

## Problemas encontrados e correções

1. **Contraste:** texto muted sobre nude tinha 4,4:1, detectado pelo axe em início, catálogo e detalhes. O token foi escurecido para `#665757`, preservando a identidade visual.
2. **Teclado:** logo sem foco visível explícito e menu sem retorno de foco no Escape. Foram adicionados foco, retorno ao botão e link para pular a navegação. Os botões aninhados dentro de links na página inicial foram substituídos por links com o mesmo estilo.
3. **Cookies:** acesso ao localStorage podia lançar exceção. O componente trata bloqueio de leitura/gravação e usa diálogo nativo com contexto de foco modal e Escape; opções continuam desativadas por padrão. A escolha em memória é identificada quando o armazenamento não funciona.
4. **Imagem de rascunho local:** a rota servia imagens pela chave sem verificar publicação. Agora peças não publicadas exigem ADMIN/EDITOR; anônimos e clientes recebem 404. A autorização não se estende automaticamente ao S3 público.
5. **Upload administrativo:** havia apenas assinatura inicial e limite por Content-Length. O corpo agora é limitado por bytes lidos, arquivos duplicados são rejeitados e o conteúdo inteiro é decodificado/validado antes de salvar JPEG normalizado sem EXIF. Arquivos existentes não foram regravados.
6. **Autenticação e abuso:** login ganhou limite por conta com chave HMAC e limite global por processo. O limitador compartilhado limita sua memória a 10.000 chaves e remove janelas expiradas. Isso não substitui limites distribuídos/WAF.
7. **Formulários antes de estarem prontos:** testes rápidos expuseram perda de seleção de arquivo e de ações/campos no painel. O upload lê o arquivo diretamente do input. Formulários do catálogo administrativo e login só habilitam campos após a montagem do cliente. O login declara POST, impedindo um fallback HTML com senha na query string.
8. **Foco de variante administrativa:** a key React incluía o texto editado e remontava o campo a cada tecla. Foi estabilizada; o teste digita `GG` e `Bordô` sequencialmente e verifica foco e persistência no banco.
9. **Requisições redundantes:** o painel já tinha imagens no resultado Prisma, mas cada card fazia outra consulta. Os dados iniciais agora são reaproveitados. O teste CRUD confirma zero GETs individuais de listas de imagens nesse fluxo; upload/exclusão continuam atualizando suas imagens.
10. **Imagens/layout:** hero recebeu sizes; imagens públicas locais do catálogo podem usar o otimizador Next; imagens privadas/blob/data e externas ficam fora dele. Cards e miniaturas usam lazy loading. A imagem administrativa ganhou dimensões reservadas e lazy loading, eliminando o aviso do lint.
11. **Atualização do catálogo:** o build classificava início e categorias como estáticos e não havia invalidação após edição do catálogo. Essas páginas agora são dinâmicas; o build final confirma `ƒ`, evitando manter o catálogo da época do build.
12. **Dependências:** Next e eslint-config-next foram alinhados em 15.5.29, PostCSS em 8.5.32 via override compatível de mesma versão principal e os plugins TypeScript do ESLint em 8.72.2. O primeiro ajuste automático revelou incompatibilidade do plugin antigo com ESLint 9; a resolução foi corrigida e o lint voltou a passar. Não foi executado `npm audit fix --force`.
13. **Sobreposição visual:** a inspeção de screenshot em 320 px mostrou o botão flutuante de cookies cobrindo texto. A reabertura das preferências foi colocada no fluxo do rodapé; fechar o diálogo devolve foco ao botão, sem deslocar a página. A conferência final inclui esse foco nas sete larguras.
14. **Nome visível/acessível de favoritos:** o rótulo visual dizia salvar/salvo e o aria-label dizia adicionar/remover. Os textos visíveis foram alinhados à ação acessível para suportar também controle por voz, mantendo coração, cor e aria-pressed como estado.

## Responsividade e acessibilidade

Larguras: **320, 375, 390, 430, 768, 1024 e 1440 px**, altura de 900 px na matriz pública. A primeira matriz tinha 63 combinações de nove páginas e sete larguras. Nenhuma apresentou overflow; 21 combinações tinham a falha de contraste citada. A matriz pública após as correções também foi executada em produção local, sem violações automáticas ou erros JavaScript.

A conferência adicional inclui 40 estados: menu aberto nas cinco larguras abaixo de 1024 px; diálogo de cookies, favorito preenchido e três etapas do provador (seleção, prévia e consentimento bloqueado) nas sete larguras. São **103 combinações** de páginas/estados/largura, além da suíte funcional. O build final passou nessas 103 verificações: zero overflow, zero violações automáticas sob as tags selecionadas e zero erros JavaScript. Screenshots de consentimento em 320 e 1440 px também foram inspecionados visualmente. A suíte administrativa percorreu as sete larguras, incluindo formulário e imagem cadastrada. Testes de teclado verificam o atalho, retorno de foco e impossibilidade de focar controles de fundo no diálogo de cookies. O navegador pode levar o Tab à sua própria interface; o teste não confunde isso com foco em conteúdo de fundo.

O axe usa tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Controles principais têm áreas de toque de 44–56 px. Nomes acessíveis, alt, mensagens e contraste são inspecionados automaticamente e nos fluxos de teclado. Isso **não certifica conformidade WCAG 2.2 AA**: leitores de tela, dispositivos físicos, todas as tecnologias assistivas e avaliação humana integral permanecem pendentes. [Referência WCAG](https://www.w3.org/WAI/WCAG22/quickref/), [limites dos testes automatizados](https://playwright.dev/docs/accessibility-testing).

## Performance e Core Web Vitals

Foram executadas 18 amostras: três por página e largura, usando web-vitals somente no navegador de auditoria, sem telemetria na aplicação. Chromium, servidor de produção local, cache do navegador desabilitado e cache do servidor aquecido, sem emulação de latência de rede; CPU desacelerada 4× em 390 px e normal em 1440 px. Cookies opcionais recusados previamente. INP inclui abrir/fechar preferências de cookies; a amostra não cobre toda interação possível. A tabela mostra intervalos de três execuções, não percentil de usuários reais.

| Largura | Página | LCP (ms) | INP (ms) | CLS máximo | JS inicial codificado (KiB) |
| --- | --- | --- | --- | --- | --- |
| 390 px | / | 468–628 | 64–120 | 0 | 139.1 |
| 390 px | /catalogo | 856–964 | 56–88 | 0 | 139.1 |
| 390 px | /produto/demo-blusa-bordo | 608–684 | 48–88 | 0 | 141.7 |
| 1440 px | / | 388–448 | 24–48 | 0 | 146.5 |
| 1440 px | /catalogo | 452–504 | 24–24 | 0 | 146.5 |
| 1440 px | /produto/demo-blusa-bordo | 388–428 | 24–32 | 0 | 149.1 |

O build final informa aproximadamente 103 kB de JavaScript compartilhado e 141 kB de First Load JS para início/catálogo. O JS codificado da tabela é uma medida distinta do navegador; a contagem de recursos posterior às interações pode incluir prefetch automático de links. Não houve medição comparável de performance antes das mudanças, portanto não se afirma uma melhora percentual.

Referência diagnóstica: LCP até 2,5 s, INP até 200 ms, CLS até 0,1. Dados de campo e percentil 75 de usuários reais não estão disponíveis em localhost. [Core Web Vitals](https://web.dev/articles/vitals).

Imagens externas de catálogo continuam sem transformação automática por falta de política de domínio/storage de produção; não foi aberto um proxy de imagens arbitrárias. Fotos pessoais e resultados inline permanecem intencionalmente sem otimização/cache público. O catálogo local usa ilustrações SVG demonstrativas: repetir medições com fotografias comerciais e infraestrutura reais é necessário.

## Segurança: validação e pendências

- Segredos: varredura de 45 arquivos JS/map estáticos contra três valores sensíveis configurados não encontrou correspondências. `.env`, `.codex` e `.local-data` não estão versionados. A verificação é do build/árvore atuais, sem promessa de análise forense de históricos ou serviços externos.
- Imagens: testes verificam cliente anônimo/cliente comum/editor, conteúdo truncado, corpo inválido, duplicidade, tamanho e imagem válida. A prévia pessoal nunca entra no catálogo nem na mensagem de WhatsApp.
- Sondagem HTTP no build de produção: health 200; `/admin` redireciona 307 para login; listagem de produtos, taxonomia e exportação administrativas retornam 401 ao anônimo; imagem local inválida retorna 404; provador desabilitado retorna 503 com `private, no-store`. `nosniff`, `DENY` e política de referrer foram confirmados nas respostas. As APIs administrativas ainda não declaram Cache-Control privado explicitamente; endurecer essa política no ambiente de destino.
- Operações de IA: banco, consentimento versionado, imagem autorizada, reserva atômica de créditos e os flags continuam exigidos no backend. Resultados não usam endpoint público por ID nem URL de CDN compartilhada.
- Auditoria de dependências **ainda falha**: 13 alertas no grafo completo (8 moderados, 3 altos e 2 críticos). `npm audit --omit=dev` aponta três altos na cadeia Prisma / @prisma/config / deepmerge-ts. Críticos estão na cadeia Vitest/tinypool das ferramentas de teste. Correções indicadas envolvem versões principais; não foram aplicadas sem revisão de migração. Não expor servidores de teste/watch nem executar testes de código não confiável. Esses alertas exigem análise/mitigação antes de aprovar produção.
- O armazenamento S3 atual usa uma base pública do catálogo: privacidade de rascunhos nesse ambiente não foi garantida por este ajuste da rota local. Validar bucket, permissões e estratégia de acesso antes da implantação.
- Rotas JSON administrativas e analytics ainda dependem de endurecimento de tamanho no proxy/servidor; analytics mantém um limitador separado em memória, sem o teto de chaves do limitador compartilhado. Recomenda-se revisão específica, limites globais e retenção/minimização de metadata.
- Limites por processo não são distribuídos. O provador tem orçamento persistente global, mas cotas por sessão podem ser contornadas ao trocar cookies. WAF/anti-bot e conciliação de operações incertas continuam necessários.
- Não há CSP estrita/HSTS validado na infraestrutura. Definir HTTPS, cookies Secure, política CSP compatível, segredo de produção próprio, backup/restore, monitoramento e restrição do banco no ambiente de destino.
- Revisão de base legal, DPA/suboperadores, transferência internacional e atendimento a titulares permanece pendente; o texto de privacidade ainda é uma estrutura para aprovação. O job de exclusão de metadata após 30 dias precisa ser agendado e verificado antes de habilitar IA. Não houve parecer jurídico de conformidade LGPD.

## Execuções e falhas registradas

- Typecheck: passou após corrigir o tipo BlobPart de uma fixture de teste.
- Lint: passou sem erros ou avisos após alinhamento das dependências e troca da imagem administrativa.
- Unitários: 76 passaram; os dois testes SQL são ignorados nessa execução normal e foram executados separadamente, com sucesso, em PostgreSQL isolado.
- E2E: 52 cenários únicos passaram ao combinar a execução principal com reexecuções focadas e o modo de serviço desabilitado. Dois cenários de catálogo **sem banco** foram ignorados porque a suíte estava conectada a PostgreSQL; não são contados como aprovação.
- Houve falhas intermediárias reais de upload/formulário, corrigidas. Também foram corrigidos testes que assumiam Tab sempre dentro do documento, usavam uma seleção por label inadequada ou tentavam operar o menu atrás do diálogo sem definir a preferência de cookies. As falhas e as reexecuções não foram tratadas como sucesso inicial.
- Uma execução auxiliar foi interrompida antes dos testes; seu banco temporário sem conexões ativas foi removido explicitamente. Os demais bancos foram removidos no finally dos runners.
- Build: passou com Next 15.5.29 e confirmou início/categorias dinâmicos. Scripts de auditoria passaram por `node --check`.
- Não foram executados geração real com IA, S3 real, mensagens a terceiros, auditoria completa com leitor de tela, navegadores Safari/Firefox, aparelhos físicos ou dados de campo de produção.

Comandos usados: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm audit --json`, `npm audit --omit=dev --json`; Playwright e testes PostgreSQL via orquestrador local de bancos descartáveis. Para repetir os testes funcionais, preparar um banco local `belin_product_e2e_*` migrado, definir E2E_DATABASE_URL/DATABASE_URL para esse banco e E2E_BASE_URL para o servidor correspondente. O processo Next dos testes deve bloquear qualquer saída para api.fashn.ai; não usar chave real. A execução sem banco é outro ambiente e não foi realizada nesta auditoria.

Os scripts `audit:browser` e `audit:performance` são somente de auditoria e exigem uma peça publicada disponível no banco local. `AUDIT_BASE_URL` aponta para o servidor já iniciado; `AUDIT_STATES_ONLY=true` limita a conferência aos estados interativos. Não executar Next dev e Next start simultaneamente sobre a mesma pasta `.next`. Artefatos locais ficam em `.codex`, fora do Git.

## Arquivos modificados

Evidências resumidas e métricas brutas, sem segredos ou fotografias: [JSON da auditoria](audit/2026-11-09-evidence.json).

```text
auth.ts
docs/adr/0009-auditoria-seguranca-acessibilidade-performance.md
docs/audit/2026-11-09-evidence.json
docs/quality-audit-2026-11-09.md
docs/storage.md
docs/testing.md
package-lock.json
package.json
scripts/audit-browser.cjs
scripts/audit-client-secrets.cjs
scripts/audit-performance.cjs
src/app/admin/page.tsx
src/app/api/admin/products/[id]/images/route.ts
src/app/api/admin/products/route.ts
src/app/api/local-images/[...key]/route.ts
src/app/catalogo/page.tsx
src/app/categorias/page.tsx
src/app/contato/page.tsx
src/app/favoritos/page.tsx
src/app/login/page.tsx
src/app/page.tsx
src/app/produto/[slug]/page.tsx
src/components/admin-product-images.tsx
src/components/admin-product-manager.tsx
src/components/cookie-consent.tsx
src/components/favorites/button.tsx
src/components/product-gallery.tsx
src/components/product-tile.tsx
src/components/site-header.tsx
src/components/ui/button.tsx
src/components/virtual-fitting/experience.tsx
src/features/products/image-policy.ts
src/lib/security/rate-limit.ts
src/styles/design-tokens.css
tests/catalog-image-security.test.ts
tests/e2e/admin-crud.spec.ts
tests/e2e/public-navigation.spec.ts
tests/e2e/quality-audit.spec.ts
tests/rate-limit.test.ts
```

Próximos passos de produção, em ordem: resolver/mitigar os alertas remanescentes de dependências; definir storage e privacidade de rascunhos; fechar revisão de privacidade e exclusão agendada; endurecer limites/caches/headers na infraestrutura; validar a IA real com chave, orçamento e fotos autorizados; repetir testes com fotos comerciais, navegadores/aparelhos reais e tecnologias assistivas. A auditoria local está concluída, mas não constitui liberação de produção.
