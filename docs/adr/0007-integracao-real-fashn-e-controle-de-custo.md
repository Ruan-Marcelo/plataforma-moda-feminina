# ADR 0007 — FASHN real, resultado privado e reserva de créditos

## Status

Aceita para implementação técnica. Ativação e validação com serviço pago bloqueadas por ausência de credenciais e autorização de gasto. Complementa a ADR 0006.

## Análise prévia

Arquitetura, upload, storage, autenticação, integrações, ambiente, documentação oficial, custos e limites foram analisados antes da implementação em `docs/ai-integration-review.md`. O provedor já era FASHN; não houve seleção automática de outro fornecedor ou contratação.

## Decisão

- Preservar o adaptador FASHN e o perfil explícito Try-On Max / balanced / 1k / uma saída JPEG. Não aceitar custo, modelo, quantidade, resolução ou prompt escolhidos pelo navegador.
- Corrigir o contrato oficial para `num_images`. Solicitar entrada e saída base64. Ler a peça pelo storage autorizado, usando chave vinculada ao produto; não fazer fetch de URLs arbitrárias, privadas ou fornecidas pelo cliente.
- Decodificar ambas as imagens com Sharp no servidor, limitar tamanho/pixels/dimensões, corrigir orientação e remover metadados da cópia de processamento. O original do catálogo não é modificado.
- Retornar imagem inline privada na mesma resposta HTTP que a solicitou, com `private, no-store` e `Vary: Cookie`. Não expor URL de CDN, ID bruto do fornecedor ou endpoint público para recuperar resultados por identificador.
- O provador permanece público; Auth.js continua protegendo o painel. Uma sessão opaca HttpOnly/SameSite Strict vincula a tentativa a um hash HMAC. Isso não é uma conta autenticada nem uma garantia de um limite por pessoa. Sessões diferentes não reutilizam resultados de outras solicitações.
- Reservar dois créditos de forma atômica em transação PostgreSQL Serializable antes do único POST pago. As reservas são conservadoras, inclusive para falhas. Limites persistentes: créditos por dia UTC, tentativas por sessão e operações não conciliadas concorrentes.
- Criar somente metadados de operação: identificadores, versão do consentimento, estado, reserva, consumo efetivamente informado e prazo de expiração. Não armazenar imagens, base64, nomes de arquivo, URLs ou IPs na tabela.
- Nunca repetir automaticamente o POST de criação. Consultas GET de status têm até duas repetições com espera e deadline total. O requestId permanece estável ao tentar novamente a mesma fotografia/seleção, impedindo novo faturamento por falha de rede.
- Erro ambíguo, timeout e cancelamento após início não liberam automaticamente concorrência ou reserva. O fornecedor pode continuar o trabalho; é necessária conciliação operacional. Nenhum cancelamento/exclusão remota é simulado.

## Controles de ativação

O processamento exige chave real, AUTH_SECRET, banco migrado, `VIRTUAL_FITTING_ENABLED=true`, `FASHN_SPENDING_APPROVED=true` e limite diário de pelo menos dois créditos. Os padrões são aprovação falsa e orçamento zero. Ativar configurações descartáveis de teste no ambiente da loja é proibido.

## Retenção e limites

Fotos e resultados ficam apenas no fluxo de memória/resposta da aplicação. Metadados locais expiram em 30 dias e devem ser removidos por `npm run db:purge-fitting-operations` em rotina operacional diária. Antes da remoção, operações incertas precisam ser conciliadas, e pedidos de titulares devem seguir o procedimento documentado. Não existe exclusão de registros do fornecedor por API na documentação consultada.

A proteção de gasto usa reservas por data de criação UTC; não é uma promessa de teto exato de fatura do fornecedor, cuja cobrança e preços são externos. Revisão de privacidade, mecanismos de transferência internacional, DPA/suboperadores, carteira/prepago e auto top-up continuam sob decisão da loja. Os limites não substituem WAF/anti-bot e não impedem que um atacante tente esgotar a cota pública. A ativação depende dessa revisão operacional.
