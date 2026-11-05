<!-- RUAN MARCELO RAMACIOTI LUZ -->
# Design System BÉLIN

## Identidade

O sistema visual usa a identidade oficial BÉLIN encontrada em `Designer/`. O logotipo utilizado pela interface foi copiado para `public/brand/belin-logo.jpeg` sem redesenho ou distorção.

Tokens principais:

- Bordô: `#8D263B`
- Creme: `#FFF0D0`
- Branco: `#FFFFFF`
- Nude: `#E8D8C4`

Os tokens estão centralizados em `src/styles/design-tokens.css` e expostos ao Tailwind em `tailwind.config.ts`. O nome legado `lilac` continua apontando para o bordô para evitar quebra de componentes existentes; novos componentes devem preferir `wine`, `cream` e `nude`.

## Tipografia e interação

- Títulos usam a família serifada `Georgia`/`Times New Roman` via `font-display`.
- Textos funcionais usam Arial/Helvetica via a família sans-serif global.
- Foco visível é obrigatório e usa contorno bordô escuro.
- Alvos interativos principais têm no mínimo 44px de altura.
- Estados de hover, foco, carregamento e desabilitado são definidos nos componentes compartilhados.
- `prefers-reduced-motion` reduz transições, animações e rolagem suave.

## Componentes compartilhados

- `Button`: variantes primary, secondary, quiet e danger, com `loading` e `aria-busy`.
- `Input`: label, dica, erro associado e `aria-invalid`.
- `Card`: superfície editorial com borda, raio e sombra moderada.
- `SiteHeader`: logo oficial, menu expansível no celular, navegação por teclado e fechamento com Escape.
- `SiteFooter`: links institucionais e canais da marca.

Esses componentes ficam em `src/components/ui/` ou `src/components/` e devem ser reutilizados antes de criar novas variações.

## Responsividade

A base é mobile-first, com catálogo em duas colunas e menu recolhido no celular. As classes `md:` e `lg:` ampliam espaçamento, largura e composição para tablet e desktop. O layout foi estruturado para larguras de 320px a 430px sem depender de hover.

## Acessibilidade

Formulários devem manter labels visíveis, erros associados aos campos e foco perceptível. Imagens de produto precisam de texto alternativo útil; o logotipo decorativo no cabeçalho usa `alt` vazio e o link fornece o nome da página inicial.

Esta etapa não substitui auditoria manual com teclado, leitor de tela e navegadores reais.
