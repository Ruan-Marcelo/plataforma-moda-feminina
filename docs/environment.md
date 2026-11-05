# Ambiente

Copie .env.example para .env no desenvolvimento. Nunca versione .env, segredos OAuth ou senhas.

Obrigatorias para dados: DATABASE_URL.

Obrigatoria para Auth.js quando a autenticacao estiver ativa: AUTH_SECRET com pelo menos 32 caracteres.

OAuth opcional: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_APPLE_ID e AUTH_APPLE_SECRET. Configure somente callbacks e credenciais criados nos consoles oficiais.

Provador real opcional: FASHN_API_KEY habilita o adaptador server-side FASHN; FASHN_MODEL usa `tryon-max` por padrão. Nunca exponha a chave em variáveis `NEXT_PUBLIC_*`.

Provisionamento restrito: ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_PROVISION_CONFIRM=YES sao usados apenas pelo comando server-side db:provision-admin e nao devem ficar em arquivos versionados.

O comando `npm run db:provision-admin` carrega explicitamente o `.env` local. O arquivo precisa existir, o e-mail deve ser válido e a senha administrativa deve ter pelo menos 12 caracteres. Execute somente contra o banco de desenvolvimento desejado; o provisionamento também atualiza uma conta existente com o mesmo e-mail.

Armazenamento de imagens: `STORAGE_DRIVER=local` habilita uploads em disco durante desenvolvimento, sem credenciais externas. O padrão `STORAGE_DRIVER=s3` exige S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY e S3_PUBLIC_BASE_URL. Use S3_ENDPOINT para serviços compatíveis com S3, S3_REGION para a região e S3_FORCE_PATH_STYLE=true quando exigido pelo provedor. Sem a configuração do adaptador escolhido, a aplicação não aceita upload e não simula armazenamento. Local fica desativado em produção.
