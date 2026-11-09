# ADR 0008 — Favoritos locais e contato contextual

Status: aceita.

Favoritos não exigem autenticação. A ação explícita de salvar guarda somente IDs de até 100 peças no localStorage versionado `belin:favorites:v1`; sem imagens, resultados de provador, dados pessoais ou sincronização com conta. Não há uso analítico/marketing dessa lista. Os dados permanecem até remoção pela cliente, limpeza do navegador ou descarte pelo dispositivo. A lista pode ser limpa na página de favoritos; indisponibilidade do storage é informada e mantém estado apenas em memória.

Uma consulta POST limitada e validada por Zod obtém somente peças publicadas. A resposta remove preços quando a loja os desabilita e não persiste a lista no banco. Ausências retornam apenas os IDs solicitados, sem distinguir exclusão de despublicação. Peças esgotadas permanecem visíveis com disponibilidade atual. Falhas de rede não apagam favoritos. Alterações entre abas são acompanhadas por storage events.

Contato é separado em componente de UI, geração/validação da mensagem e leitura do catálogo no servidor. O destino é somente o número configurado. Cor/tamanho são incluídos apenas para uma variante atual disponível; sem variante, o contato contém só a peça. Fotografias e resultados nunca compõem mensagens. Não há criação de pedidos ou pagamentos.
