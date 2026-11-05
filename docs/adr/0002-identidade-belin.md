# ADR 0002: Identidade visual BÉLIN

## Status

Aceita

## Contexto

A vitrine precisava de uma identidade oficial para orientar a interface, os metadados e os pontos de contato. A especificação do produto define BÉLIN como marca, com bordô `#8D263B`, creme `#FFF0D0`, branco e nude `#E8D8C4`.

## Decisão

Centralizar o nome da marca e o Instagram em configuração, usar BÉLIN como padrão seguro para desenvolvimento e aplicar a paleta oficial nos tokens do Tailwind e nos estilos globais. O Instagram padrão informado é `@usebelin`; o número de WhatsApp continua sem valor inventado e só aparece quando configurado.

## Consequências

- A home, o provador e a privacidade compartilham a mesma direção visual.
- Classes legadas como `bg-lilac` permanecem como compatibilidade, mas apontam para o bordô para evitar uma mudança quebrada em componentes existentes.
- Fotografias editoriais continuam dependentes de imagens cadastradas; a interface não cria imagens comerciais fictícias.
- A identidade pode ser substituída por variáveis de ambiente sem alterar a arquitetura.
