# Armazenamento de imagens

Na auditoria de 2026-11-09, novos uploads administrativos passaram a validar o corpo efetivamente lido e decodificar a imagem inteira, salvando JPEG sem metadados; imagens já existentes não foram regravadas. A rota local exige ADMIN/EDITOR para peças não publicadas, enquanto imagens publicadas continuam públicas. Miniaturas administrativas permanecem fora do otimizador público. A estratégia S3 usa sua base pública configurada e precisa de revisão própria para garantir privacidade de rascunhos; isso não foi certificado pelo ajuste local. Ver `docs/quality-audit-2026-11-09.md`.

O provador real lê a imagem da peça por chave autorizada via `ObjectStorage.read`, sem fazer fetch de URLs arbitrárias. Fotos pessoais e resultados não passam por esse storage. O servidor prepara cópias transitórias em memória e envia ambas as imagens em base64. Ver ADR 0007.

Em desenvolvimento, `STORAGE_DRIVER=local` habilita armazenamento em `.local-data/catalog-images/`, ignorado pelo Git. A aplicação entrega essas imagens pela rota local somente fora de produção. Veja `docs/local-development.md` e a ADR 0004. S3 permanece o padrão e a opção de produção descrita abaixo.

As imagens de catálogo são enviadas pelo backend para um serviço compatível com S3. O navegador nunca recebe as credenciais do bucket. A chave do objeto é criada no servidor no formato `products/{productId}/{uuid}.{ext}` e é registrada em `ProductImage.storageKey` para permitir exclusão segura.

O endpoint administrativo valida MIME, assinatura real do arquivo e limite de 8 MiB antes do upload. A configuração é opcional em desenvolvimento; quando ausente, o endpoint retorna `storage_not_configured` e não cria uma imagem falsa.

Configure `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` e `S3_PUBLIC_BASE_URL`. Para MinIO, Cloudflare R2 ou outro serviço compatível, informe também `S3_ENDPOINT` e, se necessário, `S3_FORCE_PATH_STYLE=true`.

O bucket deve permitir leitura pública somente dos objetos de catálogo, sem permitir listagem ou escrita pública. As credenciais devem possuir apenas as permissões de objeto necessárias. Resultados pessoais do provador virtual não são armazenados por este módulo.
