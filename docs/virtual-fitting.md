# Provador virtual

O contrato VirtualTryOnProvider, a validacao de upload e o endpoint POST /api/virtual-fitting ja existem. O endpoint aceita JPEG, PNG e WebP, valida a assinatura real do arquivo, limita o tamanho a 8 MiB e nao registra a imagem.

O adaptador server-side do FASHN usa `tryon-max` por padrao quando `FASHN_API_KEY` existe. Ele envia a fotografia como dado de entrada ao endpoint `/v1/run`, consulta `/v1/status/:id`, aplica timeout de 70 segundos e aceita somente URL de resultado no CDN oficial. Sem credencial, o endpoint responde 503 com `not_configured`; nao existe simulacao de resultado.

A pagina do produto agora possui o componente `VirtualTryOnUpload`: ele oferece selecao de arquivo ou camera no celular, pre-visualizacao local, envio ao endpoint, mensagens de progresso e tratamento explicito para o estado `not_configured`. Um resultado so e exibido quando a resposta do servidor fornece uma URL real do provedor.

Antes da publicacao, ainda devem ser configurados contrato de tratamento de dados, armazenamento/retencao, limites de custo, alertas de credito e revisao dos termos comerciais do fornecedor. A chave permanece somente no ambiente do servidor.
