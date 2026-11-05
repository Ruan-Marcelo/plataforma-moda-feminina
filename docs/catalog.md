# Catalogo publico

## Fonte dos dados

`src/features/products/repository.ts` consulta somente produtos com status `PUBLISHED`. A pagina e renderizada no servidor e usa paginação para limitar a quantidade de registros carregados. Produtos sem imagem exibem um estado explicito; nenhum produto e criado para preencher a vitrine.

## Consulta e filtros

Os parametros sao validados em `src/features/products/validation.ts`:

- `q`: busca por nome ou descricao;
- `categoryId`: categoria cadastrada no banco;
- `size` e `color`: variacoes disponiveis;
- `availability`: `all`, `available` ou `unavailable`;
- `sort`: `newest`, `price_asc` ou `price_desc`;
- `page` e `pageSize`: paginação no servidor.

O filtro de disponibilidade considera uma peça disponível quando existe ao menos uma variação com `available=true`. A opção indisponível exige que não exista variação disponível. A combinação com tamanho e cor permanece dentro da mesma consulta.

As categorias do filtro são carregadas pela relação `Category` e não por uma lista fixa. A consulta de produtos e categorias é executada em paralelo quando o banco está configurado.

## Interface

`src/app/catalogo/page.tsx` apresenta contador de resultados, formulário GET, estado de erro, estado vazio, cards reutilizáveis, paginação que preserva os filtros e links para `/produto/[slug]`. `src/app/catalogo/loading.tsx` fornece o skeleton usado durante a navegação.

## Banco e índices

O modelo possui índices para status/data, categoria, coleção e variações. A migration `20261105150000_add_variant_availability_catalog_index` adiciona o índice composto para consultas de disponibilidade.

## Validação pendente

Ainda é necessário executar testes E2E em navegador real e validar o comportamento com um PostgreSQL de desenvolvimento populado por dados reais ou de demonstração claramente identificados.
