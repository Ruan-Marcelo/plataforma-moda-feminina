# Provador virtual

O contrato VirtualTryOnProvider, a validacao de upload e o endpoint POST /api/virtual-fitting ja existem. O endpoint aceita JPEG, PNG e WebP, valida a assinatura real do arquivo, limita o tamanho a 8 MiB e nao registra a imagem.

O adaptador server-side do FASHN usa `tryon-max` por padrao quando `FASHN_API_KEY` existe. Ele envia a fotografia como dado de entrada ao endpoint `/v1/run`, consulta `/v1/status/:id`, aplica timeout de 70 segundos e aceita somente URL de resultado no CDN oficial. Sem credencial, o endpoint responde 503 com `not_configured`; nao existe simulacao de resultado.

A página do produto encaminha a seleção para `/provador?productId=...&variantId=...`. A página de destino valida os IDs, consulta produto publicado e variante disponível e apresenta a escolha. Nesta etapa não renderiza `VirtualTryOnUpload`, não solicita fotografias e não chama o endpoint de IA. O componente e o adaptador preexistentes permanecem separados para uma etapa futura; nenhuma integração de IA foi implementada nesta mudança.

Antes da publicacao, ainda devem ser configurados contrato de tratamento de dados, armazenamento/retencao, limites de custo, alertas de credito e revisao dos termos comerciais do fornecedor. A chave permanece somente no ambiente do servidor.
