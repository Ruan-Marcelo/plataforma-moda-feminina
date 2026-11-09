# Favoritos

Rota `/favoritos`, acessível pelo menu e sem login. Adicionar/remover funciona nos cards do catálogo e na página da peça. A indicação visual usa botão com aria-pressed e área mínima de toque de 48 px.

Somente IDs são salvos no localStorage deste navegador, versão 1, limite de 100 e sem duplicatas. A persistência independe de cookies opcionais: é ativada pela ação explícita de favoritar e não alimenta analytics. Não há sincronização entre dispositivos, conta obrigatória ou gravação no banco. Pode-se remover individualmente ou limpar toda a lista. Armazenamento bloqueado/cheio é informado sem travar a navegação.

POST `/api/favorites` aceita uma lista validada de IDs com corpo limitado a 10 KB e devolve apenas dados públicos atuais, preço conforme configuração e IDs que saíram do catálogo. Não retorna dados de rascunhos. Peças esgotadas são exibidas como indisponíveis. Produtos ausentes podem ser removidos manualmente; falhas temporárias preservam a lista e permitem nova tentativa.

Decisão e retenção em `docs/adr/0008-favoritos-locais-e-contato.md`. Testes cobrem contratos, duplicidades, persistência, ausência do catálogo, indisponibilidade, armazenamento bloqueado, abas e navegação mobile/desktop.
