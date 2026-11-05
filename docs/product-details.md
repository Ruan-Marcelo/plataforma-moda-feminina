# Detalhes da peça

## Experiência

`/produto/[slug]` consulta somente produtos publicados. A página usa composição vertical no celular e duas colunas a partir de telas grandes, com galeria ampla, referência, preço configurável, seletores, descrição completa e relacionados vindos da categoria/coleção real.

A galeria aceita fotografias cadastradas, oferece controles de pelo menos 44 px, miniaturas identificadas, contador anunciado, setas do teclado, Home/End e gesto horizontal. Deslocamentos predominantemente verticais não mudam a imagem. Há estados explícitos sem imagem e para falha de carregamento. Imagens demonstrativas permanecem identificadas como ilustrações.

As cores e tamanhos vêm das variantes. Combinações inexistentes ou indisponíveis são desabilitadas, e a seleção mantém somente uma variante disponível. Peças sem variantes ou totalmente indisponíveis não habilitam os botões. Ausência de WhatsApp configurado também desabilita o contato, sem inventar um número.

O WhatsApp e o provador validam a seleção novamente no servidor, conforme a ADR 0005. A página do provador apenas mostra a peça, cor e tamanho; não exibe upload nem executa geração de IA.

## Configuração e exemplos

- `STORE_SHOW_PRICES=true` é o padrão; `false` oculta preços na página e nos cards.
- `STORE_WHATSAPP_NUMBER` deve ser o número real, com código de país e somente dígitos.
- A pedido do usuário, `prisma/seed.ts` inclui três produtos explicitamente demonstrativos, com preços de exemplo e ilustrações SVG identificadas. O seed atualiza esses exemplos e é bloqueado em produção. Nenhuma imagem representa uma fotografia comercial real.
- No banco local, veja `/produto/demo-blusa-bordo`, `/produto/demo-saia-midi` e `/produto/demo-peca-indisponivel`.
- O login administrativo mantém o redirecionamento em `/admin` na mesma origem, evitando perder cookies entre localhost e 127.0.0.1.

## Validação

`npm run typecheck`, `npm run lint` e `npm test` cobrem contratos e verificações estáticas. `tests/product-selection.test.ts` verifica resolução de combinações, recusa de IDs inválidos e conteúdo codificado da mensagem de interesse.

`tests/e2e/product-details.spec.ts` exige `E2E_DATABASE_URL` apontando para um banco **local e separado**, com nome `belin_product_e2e_*`. Nunca use `belin_local` nessa suíte. Antes da execução, aplique as migrations nesse banco, inicie o servidor com `DATABASE_URL` apontando para ele e configure `E2E_BASE_URL` para esse servidor. Não execute dois servidores Next compartilhando o mesmo `.next` simultaneamente.

Execute `npx playwright test tests/e2e/product-details.spec.ts`. A suíte cria e remove seus registros próprios. Para testar preços ocultos, inicie o servidor com `STORE_SHOW_PRICES=false`, defina `E2E_SHOW_PRICES=false` no processo dos testes e execute com `--grep preço`. O teste de WhatsApp requer um número de teste somente nesse ambiente isolado e inspeciona o redirecionamento sem abrir o serviço externo.

Os cenários cobrem desktop e emulação móvel, larguras de 320/390/768/1440 px, navegação da galeria por controle/teclado/eventos de toque, rolagem vertical, variantes, disponibilidade alterada no banco, parâmetros adulterados, relacionados, preço oculto e login. Eventos de toque automatizados não substituem uma avaliação física em iOS/Android.
