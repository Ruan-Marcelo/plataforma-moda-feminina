# ADR 0006 — Interface do provador, consentimento e dados efêmeros

## Status

Aceita. Não representa ativação do serviço de IA nem aprovação jurídica.

## Contexto

O provador precisa oferecer um fluxo completo sem gerar resultados fictícios. O adaptador FASHN já existe, mas credenciais, fotografias públicas das peças e condições de privacidade precisam estar configuradas antes de qualquer processamento real.

## Decisão

- A página de servidor consulta peças publicadas e variantes disponíveis e envia somente dados mínimos à interface.
- Componentes de apresentação, seleção, fotografia, autorização e resultado usam um hook com reducer. Os estados são `idle`, `uploading`, `processing`, `completed`, `failed` e `cancelled`; a etapa visual é um campo separado.
- `File` e a URL de pré-visualização ficam apenas na memória da sessão. URLs de objeto são revogadas na substituição, cancelamento e desmontagem. Não há persistência em localStorage, sessionStorage, catálogo ou analytics.
- O transporte de navegador usa XMLHttpRequest para observar o progresso real de envio. `processing` depende do evento de término do upload; não há timers de progresso ou respostas fabricadas. Apenas uma resposta válida do serviço pode produzir `completed`.
- Um AbortController e uma trava síncrona impedem envios duplicados e descartam respostas tardias. O servidor também recusa IDs de requisição repetidos dentro da janela local, sem armazenar fotografias ou resultados para isso.
- O contrato exige peça, variante, requestId UUID, autorização explícita e versão do texto de consentimento. O backend revalida assinatura/tamanho da foto, disponibilidade e URL compatível da peça antes de encaminhar dados ao adaptador existente.
- `VIRTUAL_FITTING_ENABLED` é falso por padrão. A loja só deve ativá-lo após configuração real e revisão das condições de tratamento de dados. A presença de uma chave, isoladamente, não habilita o processamento.
- O resultado aceita somente o domínio HTTPS do CDN usado pelo adaptador atual. A interface compara original e resultado sem reenviar a foto e não anexa imagens ao WhatsApp.

## Consequências

O ambiente local permite percorrer o fluxo e pré-visualizar uma fotografia, mas não gera simulações enquanto as dependências estiverem pendentes. Peças com ilustrações SVG ou imagens locais não habilitam a geração real.

Cancelar interrompe a espera e tenta abortar o transporte/polling; não garante cancelamento ou exclusão de um job que já chegou ao fornecedor. Essa limitação aparece na interface. A evidência jurídica do consentimento, retenção no fornecedor, transferências, contratos e rate limiting distribuído ainda exigem definição para produção.

Respostas artificiais existem exclusivamente nos testes de contrato identificados como tal. Não há modo de demonstração de IA na aplicação.
