# Análise inicial — integração real do provador

Data da consulta: 2026-11-05. Esta análise foi concluída antes das alterações de integração. Nenhum crédito foi adquirido e nenhuma geração paga foi chamada.

## Arquitetura e ambiente encontrado

| Área | Situação encontrada |
| --- | --- |
| Backend | Next.js App Router; serviços de domínio e repositórios separados; Prisma/PostgreSQL |
| Upload pessoal | Multipart, autorização explícita, assinatura MIME e 8 MiB; parser ainda dependia de Content-Length para limitar o corpo |
| Catálogo | Imagens em disco local neste computador; adaptador S3 existente para produção; exemplos são SVGs demonstrativos |
| Autenticação | Auth.js protege administração por papel; provador público sem uma conta obrigatória para cliente |
| Integração | FASHN já definido, modelo tryon-max; POST de criação e polling de status existentes |
| Credenciais | FASHN_API_KEY ausente; S3 não configurado; VIRTUAL_FITTING_ENABLED falso |
| Abuso/custos | Limites em memória; sem orçamento global persistente ou reserva atômica de créditos |
| Resultado | URL do CDN enviada ao navegador; inadequada para isolamento estrito de imagens pessoais |
| Retenção | Sem imagens pessoais persistidas localmente, mas sem política operacional do fornecedor formalizada |

Como o fornecedor já está definido, não houve contratação, troca de provedor ou necessidade de escolher automaticamente outro serviço. Qualidade com fotos da loja ainda não foi avaliada: os testes anteriores eram contratos, não gerações reais. O modelo de dados liga imagens à peça, sem vínculo específico com cor/variante; não foi inventada essa associação. Um piloto exige fotografia que represente corretamente a variação escolhida. Uma associação automática por variante seria outra tarefa.

## API oficial e compatibilidade

Try-On Max usa criação em `/v1/run` e consulta por ID em `/v1/status/{id}`. O parâmetro de quantidade é `num_images`, não `num_samples`. As duas imagens aceitam data URI. O perfil desta implementação é explícito: balanced, 1k, uma imagem JPEG, com `return_base64=true`. O modelo está em Preview; alterações de comportamento precisam de revisão. [Try-On Max](https://docs.fashn.ai/api-reference/tryon-max), [ciclo de vida](https://docs.fashn.ai/api-overview/model-lifecycle).

Os limites publicados são 100 criações/minuto, 50 consultas/10 segundos e concorrência padrão de seis. Estados oficiais incluem starting, in_queue, processing, completed e failed. A implementação usa limites internos menores e não repete automaticamente uma criação ambígua; apenas consultas idempotentes têm retry limitado. [Fundamentos](https://docs.fashn.ai/api-overview/api-fundamentals), [erros](https://docs.fashn.ai/api-overview/error-handling).

## Custo e latência

O crédito on-demand publicado custa US$ 0,075, com compra mínima de 100 créditos (US$ 7,50). O perfil balanced/1k consome dois créditos por saída bem-sucedida: estimativa de US$ 0,15 por imagem ou US$ 15 por 100 imagens, sem impostos/câmbio. Fast/1k custa um crédito e quality/1k, três; nenhuma mudança de perfil é automática. Latência é variável e não constitui SLA nem qualidade validada pela BÉLIN. Orçamento local começa em zero; carteira, auto top-up e autorização de gasto precisam ser definidos pelo titular da conta. [Preços oficiais](https://help.fashn.ai/plans-and-pricing/api-pricing), [perfil técnico](https://docs.fashn.ai/api-reference/tryon-max).

Como referências do fornecedor, fast/1k leva cerca de 10 s, balanced/2k cerca de 25 s e quality/4k cerca de 55 s. Esses números não são medições da BÉLIN nem uma previsão garantida para balanced/1k.

## Privacidade e limites da revisão

Segundo a documentação do fornecedor, entradas base64 têm cópia temporária removida ao fim do trabalho, com limpeza de segurança em até um dia; saída base64 fica consultável por 60 minutos, em vez da janela padrão de três dias do CDN. Registros técnicos não expiram automaticamente, e não há endpoint de exclusão desses registros: o procedimento passa pelo canal jurídico do fornecedor. Por isso a aplicação não entrega URLs do CDN nem promete exclusão remota instantânea. [Retenção](https://docs.fashn.ai/api-overview/data-retention-privacy).

A loja ainda precisa revisar finalidade, base legal, avisos, retenção, direitos dos titulares, operadores/suboperadores e mecanismo de transferência internacional aplicável. O checkbox não substitui essa análise nem demonstra conformidade legal. Não foram assinados contratos ou aprovadas condições nesta tarefa. [DPA do FASHN](https://fashn.ai/legal/dpa), [orientação da ANPD sobre transferência internacional](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados).

## Implementação possível sem credenciais

Corrigir o adaptador conforme a API oficial; validar e normalizar fotos no servidor; ler a peça pelo storage autorizado, sem buscar URLs arbitrárias; retornar resultado privado na própria resposta; persistir somente metadados de operação e reservas de crédito; testar contratos e falhas sem chamadas pagas. A validação operacional com FASHN permanece bloqueada por ausência da chave, aprovação de gasto e condições de privacidade.
