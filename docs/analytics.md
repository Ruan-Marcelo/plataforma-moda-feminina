# Analytics

O contrato de eventos fica em src/features/analytics/events.ts e o endpoint server-side em /api/analytics. Os eventos aceitos sao page_view, product_view, collection_view, search, filter_applied, virtual_try_on_started, virtual_try_on_completed e whatsapp_click.

O endpoint exige analyticsConsent=true, valida payloads com Zod, limita o corpo a 32 KiB e aplica limite temporario de 60 eventos por identificador em 60 segundos. Ele grava somente identificador pseudonimo, nome, produto opcional e metadata minima.

Se o banco estiver indisponivel, responde 503 e nao inventa metricas. O rate limit em memoria e apenas uma camada inicial; producao precisa de limite distribuido na borda ou em armazenamento compartilhado.

O painel administrativo usa `src/features/analytics/admin-repository.ts` para agregar eventos dos últimos 7, 30 ou 90 dias: total de eventos, page views, visitantes distintos estimados, visualizações de produtos, cliques no WhatsApp e início/conclusão do provador. Quando a consulta falha, o painel exibe indisponibilidade em vez de preencher números fictícios. O endpoint protegido `/api/admin/analytics/export` exporta apenas contagens agregadas em CSV, sem identificadores ou metadata pessoal. Intervalo personalizado ainda não foi implementado.
