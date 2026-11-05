# Administração

O painel `/admin` exige uma sessão Auth.js com papel `ADMIN` ou `EDITOR`. O papel nunca é aceito do navegador.

Os endpoints protegidos são:

- `GET /api/admin/products?limit=100` para listar o catálogo.
- `POST /api/admin/products` para criar produtos.
- `PUT /api/admin/products/:id` para atualizar produto e suas variações.
- `DELETE /api/admin/products/:id` com corpo `{ "confirm": true }` para excluir.

Todos validam o payload com Zod, verificam a sessão no servidor e registram uma ação em `AuditLog`. Sem sessão respondem 401; com papel `CLIENTE`, 403; payload inválido, 400; e produto inexistente, 404.

A tela administrativa permite criar, editar campos principais, associar categoria/coleção, gerenciar variações de tamanho/cor, publicar ou arquivar, excluir produtos com confirmação e gerenciar imagens por produto. Também permite cadastrar e excluir categorias e coleções; a exclusão apenas desvincula produtos por causa da regra `SetNull`. O upload exige storage S3 compatível configurado no servidor, valida tipo/conteúdo/tamanho e registra ações de auditoria. O dashboard atual exibe agregações registradas para 7, 30 ou 90 dias, e o endpoint de exportação gera CSV agregado. Ainda pendentes antes da publicação: intervalo personalizado, séries temporais avançadas e edição de taxonomias já cadastradas.
