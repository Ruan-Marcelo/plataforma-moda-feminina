# Testes

Na interface completa do provador, passaram 46 testes unitários e 26 cenários Playwright (12 de regressão dos detalhes e 14 do provador, contando a execução separada com serviço desabilitado). Dois cenários de serviço desabilitado são ignorados propositalmente no modo habilitado e executados na segunda configuração. Upload, comparação e conclusão são verificados com respostas interceptadas somente nos testes; nenhuma IA real foi chamada. O teste de cancelamento verifica também a revogação da URL local da fotografia. Veja `docs/virtual-fitting.md` para responsabilidades e dependências.

Na etapa de detalhes das peças, passaram 28 testes unitários e 14 cenários Playwright em banco PostgreSQL separado, incluindo galeria, variantes, links, preços e redirecionamento ao painel. Veja os requisitos de isolamento e execução em `docs/product-details.md`.

- npm run typecheck
- npm run lint
- npm test
- npm run build
- npm run test:e2e
- npm run test:e2e:ui

Os testes unitarios atuais cobrem contratos de produtos e catalogo, autorizacao, consentimento, analytics, WhatsApp e validacao de imagens. Ainda faltam auditoria automatizada de acessibilidade, integracao com banco isolado e cenarios completos de autenticacao/OAuth.

Os testes E2E usam Playwright em Chromium desktop e emulacao mobile. Depois de instalar as dependencias, instale o navegador uma vez com `npx playwright install chromium` e execute `npm run test:e2e`. O script faz o build e inicia o servidor de producao automaticamente. Para testar uma URL ja publicada, defina `E2E_BASE_URL` e execute `npx playwright test`.

Após configurar o PostgreSQL local, passaram 9 suítes e 22 testes unitários, incluindo persistência em disco, proteção contra caminhos inválidos, recusa de sobrescrita e validação do tipo de conteúdo. Também foram verificados no navegador o login do administrador, painel, listagem protegida, CSV, criação de rascunho, upload da imagem, leitura dos mesmos bytes, exibição e exclusão. O rascunho de verificação foi removido; nenhum produto demo foi mantido no catálogo. Veja `docs/local-development.md`.

Em máquinas Windows, prefira executar o projeto em um caminho local. Em compartilhamentos UNC, o processo pode mapear a mesma pasta para letras de unidade diferentes; nesse caso, execute os comandos a partir de uma única letra de unidade. Na retomada de 2026-11-05, após restaurar as dependências e gerar o Prisma Client, typecheck passou, lint passou com 6 avisos e a suíte unitária passou com 8 arquivos e 19 testes. Após instalar Chromium, os 6 testes E2E passaram com `E2E_BASE_URL=http://localhost:3000` contra o servidor de desenvolvimento sem banco. O cenário de catálogo dessa suíte pressupõe ausência de banco e deve ser executado em ambiente isolado com essa condição; não valida o catálogo conectado.
