# ADR 0005 — Seleção de variante validada nos destinos

## Status

Aceita.

## Contexto

A página de detalhes precisa manter cor e tamanho consistentes, inclusive quando disponibilidade muda depois de a página carregar. Dados alterados no navegador ou em parâmetros de URL não podem produzir mensagens com variantes inexistentes. A etapa atual prepara somente a navegação ao provador.

## Decisão

- A UI mantém o identificador de uma variante disponível como seleção, em vez de estados independentes de cor e tamanho. As opções são derivadas do cadastro; tamanhos inexistentes e combinações esgotadas permanecem desabilitados. Ao trocar a cor, o tamanho é preservado somente quando compatível e disponível.
- O provador recebe apenas `productId` e `variantId`. Sua página valida os identificadores com Zod e consulta novamente produto publicado e variante disponível. Nenhuma fotografia é solicitada ou chamada de IA iniciada nesse fluxo.
- O link de interesse passa por `GET /api/products/[id]/interest?variantId=...`. O servidor consulta os dados atuais, confirma que a variante pertence à peça e está disponível e só então monta o WhatsApp com nome, referência, cor, tamanho e código da variante.
- Identificadores inválidos são recusados; seleções desatualizadas retornam à peça para nova escolha. Número e URL de destino vêm da configuração da loja, e nomes/opções vêm do banco.
- `STORE_SHOW_PRICES=false` oculta preços nos detalhes e cards. O padrão preserva a exibição anterior. Não exige mudança no schema.

## Consequências

O WhatsApp exige uma consulta antes do redirecionamento, garantindo que parâmetros do cliente não sejam usados como verdade do catálogo. A seleção não constitui reserva de estoque. O provador permanece uma página de confirmação da escolha, sem integração com IA nesta etapa.
