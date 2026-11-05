# Banco de dados

O schema PostgreSQL esta em prisma/schema.prisma. Migrations devem ser geradas com prisma migrate dev e aplicadas em producao com prisma migrate deploy.

O catalogo publico consulta apenas produtos PUBLISHED, pagina no servidor e combina busca, categoria, tamanho, cor e disponibilidade. As consultas de produto usam os indices de status/data, categoria, colecao e variantes; a migration `20261105150000_add_variant_availability_catalog_index` adiciona o indice composto usado pelo filtro de disponibilidade.

O seed cria uma categoria base e três produtos claramente marcados como demo para desenvolvimento, incluindo combinações indisponíveis e uma peça totalmente esgotada. Dois exemplos têm ilustrações SVG de frente/costas explicitamente demonstrativas. Ele bloqueia NODE_ENV=production e atualiza os próprios exemplos; não deve ser executado contra um catálogo de produção.
