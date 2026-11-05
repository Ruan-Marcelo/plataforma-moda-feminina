# Testes

- npm run typecheck
- npm run lint
- npm test
- npm run build
- npm run test:e2e
- npm run test:e2e:ui

Os testes unitarios atuais cobrem contratos de produtos e catalogo, autorizacao, consentimento, analytics, WhatsApp e validacao de imagens. Ainda faltam testes E2E com Playwright, auditoria automatizada de acessibilidade, integracao com banco isolado e cenarios completos de autenticacao/OAuth.

Os testes E2E usam Playwright em Chromium desktop e emulacao mobile. Depois de instalar as dependencias, instale o navegador uma vez com `npx playwright install chromium` e execute `npm run test:e2e`. O script faz o build e inicia o servidor de producao automaticamente. Para testar uma URL ja publicada, defina `E2E_BASE_URL` e execute `npx playwright test`.

Em máquinas Windows, prefira executar o projeto em um caminho local. Em compartilhamentos UNC, o processo pode mapear a mesma pasta para letras de unidade diferentes; nesse caso, execute os comandos a partir de uma única letra de unidade. Na retomada de 2026-11-05, após restaurar as dependências e gerar o Prisma Client, typecheck passou, lint passou com 6 avisos e a suíte unitária passou com 8 arquivos e 19 testes. A configuração E2E havia listado 6 testes na sessão anterior; isso não comprova sua execução em navegador nesta máquina.
