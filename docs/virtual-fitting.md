# Provador virtual BÉLIN

## Fluxo implementado

`/provador` recebe `productId` e `variantId`, valida a seleção no servidor e carrega até 24 peças disponíveis do catálogo real. Uma peça recebida que não esteja nessa página do catálogo também é incluída, desde que publicada e disponível. O catálogo completo continua acessível por link.

1. Apresentação com funcionamento, envio de fotografia, limites da simulação e botão **Começar agora**.
2. Seleção da peça, identificação, imagem, cor e tamanho; combinações indisponíveis não podem ser selecionadas.
3. Fotografia da galeria ou câmera pelo input de captura, quando suportado pelo aparelho/navegador. Formato, assinatura e limite de 8 MiB são validados. Há pré-visualização local, substituição e remoção.
4. Informações de finalidade/compartilhamento com FASHN, link para privacidade e autorização explícita, desmarcada por padrão. Trocar a peça ou fotografia invalida a autorização anterior.
5. Upload com progresso real quando informado pelo navegador, processamento indeterminado, tratamento de falhas, nova tentativa e cancelamento. Não há progresso inventado.
6. Resultado somente após uma resposta válida: visualização da simulação, original e comparação lado a lado. Há escolha de outra peça, limpeza da sessão e contato com a loja quando configurado.

## Estados e responsabilidades

O reducer mantém `idle`, `uploading`, `processing`, `completed`, `failed` e `cancelled`, independentemente da etapa visual. Componentes não chamam o fornecedor diretamente. O hook controla validação assíncrona, recursos temporários e uma única requisição ativa. Respostas recebidas depois do cancelamento são ignoradas.

O cliente envia somente o contrato abaixo para `POST /api/virtual-fitting`:

| Campo | Regra |
| --- | --- |
| productId / variantId | CUIDs, pertencimento e disponibilidade revalidados no servidor |
| requestId | UUID novo por tentativa; repetição recusada na janela local |
| consent | Literal `true`, sem aceite pré-marcado |
| consentVersion | Versão definida em `contracts.ts` |
| image | JPEG/PNG/WebP real, não vazio, até 8 MiB, com nome neutro no multipart |

O adaptador FASHN preexistente continua isolado no servidor. O endpoint usa o timeout de 70 segundos já previsto e agora propaga o sinal de cancelamento ao adaptador. Respostas usam `Cache-Control: no-store`. Cancelar não garante exclusão ou cancelamento no fornecedor após o envio.

## Dependências pendentes e ativação

O processamento permanece **desabilitado por padrão**. Não foi cadastrada chave de IA nem habilitado o serviço nesta etapa.

- `FASHN_API_KEY` real e acesso operacional ao provedor.
- Fotografia pública HTTPS e compatível da peça. Imagens locais e ilustrações SVG demonstrativas não habilitam a geração.
- Condições de finalidade, retenção, exclusão, transferência, responsabilidades e atendimento aos titulares revisadas pela loja. O checkbox não representa certificação jurídica.
- Somente após concluir essas condições, definir `VIRTUAL_FITTING_ENABLED=true` no servidor.
- Rate limiting distribuído, políticas operacionais e revisão dos contratos antes da publicação.

Sem essas condições, a interface permite a pré-visualização local, mantém o botão de geração desabilitado e informa a pendência. Não há provedor fictício, resultado de demonstração, fallback generativo ou chamada de IA disparada por selecionar um arquivo.

## Privacidade

Fotografias e resultados não são persistidos em banco, storage de catálogo, localStorage, sessionStorage ou eventos analíticos. O resultado e a fotografia não são anexados ao contato por WhatsApp. A URL de pré-visualização é revogada ao substituir, cancelar, limpar ou sair da página. Isso remove referências da aplicação; não apaga a fotografia original da galeria do aparelho nem promete exclusão no fornecedor.

## Arquivos da interface e contratos

| Arquivo | Responsabilidade |
| --- | --- |
| src/app/provador/page.tsx | Consulta e validação da seleção/catálogo, capacidades públicas |
| src/components/virtual-fitting/experience.tsx | Apresentação, etapas, estados e navegação acessível |
| src/components/virtual-fitting/garment-picker.tsx | Seleção real de peça e variante |
| src/components/virtual-try-on-upload.tsx | Galeria/câmera, pré-visualização e orientações |
| src/components/virtual-fitting/consent.tsx | Finalidade, compartilhamento e autorização |
| src/components/virtual-fitting/result.tsx | Resultado, comparação, outra peça e contato |
| src/features/virtual-fitting/contracts.ts | DTOs, schemas, consentimento e erros públicos |
| src/features/virtual-fitting/state.ts | Máquina de estados sem efeitos |
| src/features/virtual-fitting/use-virtual-fitting.ts | Recursos temporários, validação e trava de envio |
| src/features/virtual-fitting/client.ts | Transporte XHR com progresso, abort e validação da resposta |
| src/features/virtual-fitting/validation.ts e types.ts | Contrato atualizado e validação de imagem existente |
| src/app/api/virtual-fitting/route.ts | Gates de ativação/consentimento, variante, duplicidade e cancelamento |
| src/app/privacidade/page.tsx | Informações públicas e limites da operação |
| src/lib/env.ts e .env.example | Ativação explícita, falsa por padrão |

Outros arquivos desta etapa: `docs/adr/0006-interface-do-provador-e-fotografias.md`, `docs/environment.md`, `docs/foundation-status.md`, `docs/privacy.md`, `docs/product-details.md`, `docs/testing.md` e este documento. Testes adicionados: `tests/virtual-fitting-state.test.ts`, `tests/virtual-fitting-client.test.ts`, `tests/virtual-fitting-api.test.ts` e `tests/e2e/virtual-fitting.spec.ts`. A regressão em `tests/e2e/product-details.spec.ts` foi atualizada para a etapa de apresentação e para o tempo de compilação local do login.

## Testes

Nesta etapa passaram `npm run typecheck`, `npm run lint` (dois avisos preexistentes de `<img>`), `npm test` (46 testes) e `npm run build`. Em PostgreSQL temporário separado passaram 26 cenários Playwright, incluindo 12 regressões dos detalhes e 14 cenários do provador nas duas configurações. Os dois casos de serviço desabilitado são ignorados no modo habilitado e executados na configuração seguinte.

Os testes unitários de estado/contrato/transporte e endpoint usam fotografias sintéticas ou assets não pessoais e mocks identificados, sem atingir o fornecedor. Os testes E2E de `virtual-fitting.spec.ts` exigem o mesmo banco temporário protegido `belin_product_e2e_*` descrito em `docs/product-details.md`.

Para testar a interface de um serviço habilitado, os testes usam configuração descartável e interceptam o endpoint/resultados somente dentro do navegador de teste. A imagem usada como retorno é um asset de contrato identificado, sem valor de simulação real. Isso verifica o comportamento da interface, não a qualidade ou o funcionamento do FASHN. Também há execução separada com o serviço desabilitado que comprova ausência de envio.

Não habilite essas configurações descartáveis no ambiente da loja. Não use fotografias pessoais nos testes, screenshots ou traces. A câmera depende de hardware e permissões; o input e o fluxo são automatizados, mas a captura física exige validação em aparelho real.
