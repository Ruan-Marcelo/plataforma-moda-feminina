# Desenvolvimento local neste computador

## Preparação realizada

- Dependências restauradas pelo `package-lock.json` com `npm ci` e Prisma Client gerado.
- PostgreSQL 18 em `localhost:5432`; banco separado `belin_local` criado e quatro migrations aplicadas com `npx prisma migrate deploy`.
- Administrador provisionado com os valores reais do `.env`; login, papel ADMIN, painel, API protegida e exportação CSV verificados no navegador.
- Catálogo conectado ao PostgreSQL. Na etapa de detalhes das peças, três exemplos demonstrativos foram gravados a pedido do usuário, com ilustrações identificadas e preços de exemplo.
- Chromium instalado para Playwright.

## Iniciar

1. Mantenha o serviço PostgreSQL iniciado.
2. Execute `npm run dev -- --hostname 127.0.0.1` na pasta do projeto.
3. Abra `http://localhost:3000`. O login está em `/login`, e o painel em `/admin`.

O `.env` contém `DATABASE_URL`, `AUTH_SECRET` e as credenciais administrativas locais. Não o versione nem compartilhe seu conteúdo. Para atualizar a conta administrativa conscientemente, execute `npm run db:provision-admin`; o comando lê esse arquivo e exige confirmação YES e senha de pelo menos 12 caracteres. Reinicie o servidor após alterar a conexão do banco, para renovar o Prisma Client em memória.

## Imagens

Use `STORAGE_DRIVER=local` no `.env` para uploads reais em disco durante `npm run dev`. Imagens de catálogo ficam em `.local-data/catalog-images/`, fora do histórico. Preserve essa pasta junto ao backup do banco. Em produção, configure S3 conforme `docs/storage.md`.

## Integrações externas

O provador existente depende de FASHN e não funciona offline. Sem chave real, permanece explicitamente não configurado. Google/Apple e WhatsApp também dependem de serviços externos e de configuração real; não são necessários para acessar o painel por e-mail/senha. Nenhuma credencial desses serviços é inventada na preparação local.

## Verificações

Execute `npm run check` e `npm run build` para as verificações estáticas/unitárias e compilação. Os smoke tests públicos originais incluem um cenário sem banco: execute-os em ambiente isolado sem `DATABASE_URL`; não espere esse estado no servidor local conectado. Os testes locais de login utilizam as credenciais do `.env` sem gravar screenshots, traces ou sessões autenticadas no histórico.
