# Armazenamento de imagens

As imagens de catálogo são enviadas pelo backend para um serviço compatível com S3. O navegador nunca recebe as credenciais do bucket. A chave do objeto é criada no servidor no formato `products/{productId}/{uuid}.{ext}` e é registrada em `ProductImage.storageKey` para permitir exclusão segura.

O endpoint administrativo valida MIME, assinatura real do arquivo e limite de 8 MiB antes do upload. A configuração é opcional em desenvolvimento; quando ausente, o endpoint retorna `storage_not_configured` e não cria uma imagem falsa.

Configure `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` e `S3_PUBLIC_BASE_URL`. Para MinIO, Cloudflare R2 ou outro serviço compatível, informe também `S3_ENDPOINT` e, se necessário, `S3_FORCE_PATH_STYLE=true`.

O bucket deve permitir leitura pública somente dos objetos de catálogo, sem permitir listagem ou escrita pública. As credenciais devem possuir apenas as permissões de objeto necessárias. Resultados pessoais do provador virtual não são armazenados por este módulo.
