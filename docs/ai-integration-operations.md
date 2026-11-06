# Operação do provador com IA real

## Estado entregue

Integração técnica FASHN preparada e testada com HTTP controlado, sem geração paga. Neste computador, a chave está ausente, o serviço está desabilitado e o orçamento padrão é zero. A tabela `VirtualFittingOperation` foi adicionada sem modificar produtos ou imagens existentes.

## Configuração necessária, sem ativar automaticamente

| Variável | Padrão / finalidade |
| --- | --- |
| FASHN_API_KEY | Chave real somente no servidor; nunca enviar pelo chat ou versionar |
| FASHN_MODEL | Somente tryon-max; outros perfis exigem revisão de código/custo |
| VIRTUAL_FITTING_ENABLED | false, até concluir configuração e revisão de privacidade |
| FASHN_SPENDING_APPROVED | false, até o titular autorizar uso pago |
| FASHN_DAILY_CREDIT_LIMIT | 0; unidade é crédito, não dólar. Mínimo técnico de 2 por tentativa |
| FASHN_OWNER_DAILY_LIMIT | 3 tentativas por sessão por dia UTC; não identifica uma pessoa |
| FASHN_MAX_CONCURRENT | 2, máximo aceito de 6; inclui operações incertas sem conciliação |
| AUTH_SECRET | Segredo existente usado também para hash das sessões do provador |

Não basta adicionar uma chave. O titular precisa autorizar um teto, conferir carteira/auto top-up no fornecedor e aprovar as condições operacionais. Nenhuma compra, recarga automática, assinatura ou aceite contratual foi realizado.

## Entradas e resultado

A cliente envia a fotografia para o backend. A peça é lida exclusivamente do storage da loja por uma chave válida vinculada ao produto. Disco local funciona em desenvolvimento, e S3 usa GetObject autenticado; não são necessárias URLs públicas para enviar as imagens ao provedor. Imagens externas sem chave confiável e ilustrações SVG não habilitam geração.

JPEG/PNG/WebP: até 8 MiB, conteúdo decodificável, mínimo de 15 px por lado, até 16 milhões de pixels e proporção até 16:1. O corpo multipart é limitado por bytes efetivamente lidos, inclusive sem Content-Length. A cópia de processamento é normalizada para JPEG sem metadados. O arquivo original da galeria/catálogo permanece intacto.

O fornecedor retorna base64. O backend valida e decodifica a saída e retorna somente a imagem privada inline e o identificador local da operação na própria resposta. Não existe rota de resultados compartilhados por ID. CDN ou ID bruto do fornecedor não são enviados ao frontend. O resultado não é armazenado no catálogo nem anexado ao WhatsApp.

## Custo, retry e incidentes

Uma transação Serializable verifica reservas do dia, cota da sessão, duplicidade e concorrência antes de criar a operação. A transação termina antes da rede externa. Falhas de serialização podem ser repetidas antes do POST; não são gerações. O POST pago é executado uma única vez por operação. Só GETs de status têm retry limitado, com deadline total de 70 segundos. O navegador espera até 120 segundos, considerando upload e validação.

Reservas não são devolvidas automaticamente em erro, timeout ou cancelamento. `actualCredits` é preenchido apenas quando o fornecedor informar o consumo; null não significa custo zero. Alterações de preço fora da aplicação não podem ser garantidas pela reserva técnica. Operações antigas ou incertas precisam de conciliação antes de liberar novas tentativas/cotas.

Para conciliar, um responsável com acesso ao banco deve localizar a operação pelo ID local, verificar o providerRequestId e consultar o status na conta oficial usando a chave do servidor. Não repetir `/run` para investigar uma solicitação. Se o ID não foi recebido por falha ambígua, conferir o histórico da organização e acionar o suporte do fornecedor. Marcar como concluída/falha e liberar `settledAt` somente após confirmação. Não copiar fotografias ou respostas completas para logs ou tickets.

## Política de retenção e exclusão

- Aplicação: não persiste imagens pessoais, originais de processamento ou resultados. Buffers são transitórios; não há promessa de apagamento físico instantâneo da memória do runtime.
- Navegador: mantém original/resultado apenas na sessão; limpar, substituir ou sair libera referências/URLs locais. Não remove a foto original da galeria do aparelho.
- Metadados locais: prazo de 30 dias em expiresAt, sem imagens/URLs/IPs. Executar diariamente `npm run db:purge-fitting-operations`; o comando só remove metadados expirados. O agendamento ainda precisa ser configurado pela operação.
- Fornecedor: seguir os prazos e o procedimento atuais nas fontes de `docs/ai-integration-review.md`. A aplicação não promete exclusão remota, nem o cancelamento de trabalho já aceito.
- Direitos dos titulares: o contato oficial e o procedimento da loja ainda precisam ser definidos. Usar os IDs técnicos para encaminhar o pedido de exclusão ao fornecedor antes da expiração local quando necessário. Não enviar mensagens a terceiros automaticamente.

Esta política técnica é proposta de implementação, não aprovação jurídica. DPA, suboperadores, base legal, avisos, prova de autorização e transferência internacional devem ser revisados antes da ativação. O consentimento versionado é registrado com a operação, mas não certifica conformidade.

## Testes e bloqueio restante

Há testes de contrato do adaptador real, validação completa de imagens, privacidade da resposta, limites e cancelamento. Os testes de concorrência usam PostgreSQL separado `belin_product_e2e_*`; nenhuma reserva de teste entra no banco da loja. A geração ao vivo e sua qualidade permanecem não verificadas por falta da chave e da autorização de gasto. Um teste real futuro deve ter orçamento e imagens autorizados previamente; não é disparado por qualquer script de teste desta entrega.
