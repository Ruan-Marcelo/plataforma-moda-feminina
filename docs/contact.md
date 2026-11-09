# Contato com a loja

`StoreContact` é o componente reutilizado no catálogo, detalhes, resultado do provador, rodapé e página `/contato`. A rota de interesse consulta apenas peças publicadas e revalida uma variante quando informada. Sem seleção, a mensagem contém somente a peça e a referência; não escolhe cor/tamanho automaticamente. Variantes removidas ou indisponíveis retornam aos detalhes para nova seleção.

Somente `STORE_WHATSAPP_NUMBER`, configurado no servidor com código do país e dígitos, define o destino. Não há número comercial padrão. Na ausência da configuração, o contato fica explicitamente indisponível. Os números de testes são fixtures, nunca configurações da loja.

O texto passa por encodeURIComponent, inclui nome, referência, link e as opções selecionadas. A rota ignora imagens e resultados enviados como parâmetros. Abrir WhatsApp prepara uma conversa; a cliente decide enviar. Nenhum pedido, checkout ou pagamento é criado.

Instagram usa a configuração existente `https://instagram.com/usebelin`. URLs configuradas devem usar HTTPS e domínio Instagram. O texto opcional `STORE_SERVICE_INFORMATION` exibe somente informações reais cadastradas; nenhum horário, endereço ou prazo é inventado. O texto institucional existente foi preservado e a política de privacidade está vinculada à página de contato.

Validação: testes de mensagens, codificação, destino, seleção, ausência de configuração, erro de banco e ausência de fotografias nos links; navegação mobile/desktop coberta no navegador.
