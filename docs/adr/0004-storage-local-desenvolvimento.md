# ADR 0004 — Imagens em disco no desenvolvimento local

## Status

Aceita para desenvolvimento. Complementa a ADR 0003, que permanece válida para produção.

## Contexto

O projeto precisa funcionar neste computador com PostgreSQL e upload de catálogo, sem conta S3 ou um serviço adicional. Fotografias pessoais do provador não pertencem ao armazenamento de catálogo.

## Decisão

Adicionar `STORAGE_DRIVER=local` como opção explícita de desenvolvimento. A fábrica `getObjectStorage` mantém S3 como padrão e seleciona um adaptador de filesystem somente fora de produção. Os arquivos ficam em `.local-data/catalog-images/`, ignorado pelo Git, com as mesmas chaves geradas pelo servidor e validações/autorização do endpoint de upload existente.

Uma rota Node.js entrega somente imagens de catálogo registradas no banco e com chave validada (produto CUID, nome UUID e extensão JPEG/PNG/WebP). A rota fica desativada em produção. Os caminhos são restritos, o tipo de conteúdo corresponde à extensão validada e arquivos existentes não são sobrescritos. As imagens de catálogo são públicas, como no contrato S3; este fluxo nunca deve receber fotos pessoais do provador.

## Consequências

- `npm run dev` permite cadastrar, visualizar e excluir imagens sem infraestrutura externa de storage.
- Arquivos persistem entre reinicializações, mas dependem do disco desta máquina. Backup do banco deve ser acompanhado da pasta de imagens.
- `npm run start` usa produção e requer S3 para uploads; não habilita o adaptador local.
- URLs locais não são acessíveis ao serviço FASHN. Não há geração de provador offline nem resultado simulado.
