# Autenticacao

Auth.js (next-auth@beta) esta integrado ao App Router. O login por e-mail e senha usa Credentials com Zod e bcryptjs; a senha nunca e armazenada em texto puro. A sessao usa JWT por oito horas e o papel e lido novamente do banco no callback server-side.

Google e Apple so entram na lista de provedores quando AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET ou AUTH_APPLE_ID/AUTH_APPLE_SECRET estiverem configurados. Nao existem credenciais ou callbacks ficticios.

Para provisionar o primeiro administrador, configure ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_PROVISION_CONFIRM=YES somente no ambiente do servidor e execute npm run db:provision-admin. O comando exige senha com pelo menos 12 caracteres e nao imprime a senha.

No desenvolvimento local, esse comando carrega o arquivo `.env` explicitamente. Mantenha o arquivo privado e confirme a conexão de destino antes de executar, pois uma conta existente com o mesmo e-mail terá senha e papel atualizados.

Sem AUTH_SECRET, a rota Auth.js permanece indisponivel e retorna erro de configuracao. Gere um segredo aleatorio com pelo menos 32 caracteres; nunca o versione.
