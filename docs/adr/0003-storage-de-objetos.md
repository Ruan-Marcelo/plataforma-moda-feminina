# ADR 0003 — Armazenamento de imagens em serviço compatível com S3

## Status

Aceita.

## Contexto

Imagens de catálogo precisam sobreviver ao ciclo de publicação da aplicação e não devem ser gravadas no filesystem local do servidor. As credenciais de armazenamento também não podem chegar ao navegador. O provador virtual não deve reutilizar este fluxo para guardar fotografias pessoais.

## Decisão

Usar um adaptador server-side baseado em S3 compatível. O backend cria chaves não previsíveis, valida o conteúdo do arquivo antes do envio, grava `storageKey` junto ao registro `ProductImage` e remove o objeto antes de apagar o registro quando houver chave armazenada. O bucket e as credenciais são configurados somente por variáveis de ambiente.

O adaptador aceita endpoint customizado para serviços compatíveis, mas não depende de um fornecedor específico. Sem configuração completa, o endpoint retorna indisponibilidade e não cria URLs ou imagens fictícias.

## Consequências

- O catálogo requer política de leitura adequada no bucket ou uma camada futura de URLs assinadas.
- A aplicação precisa de permissões mínimas para escrita e exclusão de objetos.
- Uploads continuam sujeitos a limites de tamanho, tipo e assinatura real.
- Configuração, retenção, backup e observabilidade do bucket são responsabilidades do ambiente de publicação.
