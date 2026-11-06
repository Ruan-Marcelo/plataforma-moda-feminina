# Privacidade e LGPD

Na integração real preparada, fotos de entrada e resultado são transmitidos em base64 sem URLs públicas pessoais; o backend valida conteúdo e remove metadados da cópia de processamento. A aplicação não armazena essas imagens. Metadados técnicos de operação e versão do consentimento usam vínculo HMAC com sessão opaca HttpOnly, expiram em 30 dias e têm comando de limpeza. Isso é pseudonimização, não identificação/autenticação da pessoa nem certificação de anonimato. Política proposta, responsabilidades e bloqueios estão em `docs/ai-integration-operations.md` e a revisão das fontes oficiais em `docs/ai-integration-review.md`.

O sistema ainda nao declara conformidade legal. Antes da publicacao, a loja deve revisar bases legais, politica de privacidade, cookies, retencao, transferencias internacionais e atendimento a solicitacoes de titulares.

O provador exige revisao especifica: definir finalidade, fornecedor, retencao minima, exclusao de imagens e controle de acesso. Nao armazenar fotografias sem necessidade documentada.

A interface agora exige autorização explícita por fotografia/seleção, com versão do texto validada também no servidor. O checkbox inicia desmarcado e é invalidado ao substituir a fotografia ou peça. Não existe persistência de fotografias, previews ou resultados em storage de catálogo, banco, localStorage ou sessionStorage.

`VIRTUAL_FITTING_ENABLED` permanece falso por padrão até a conclusão da configuração e revisão necessárias. A autorização da interface não comprova, isoladamente, adequação jurídica nem substitui a definição de retenção e evidências de consentimento. Cancelar interrompe a espera e limpa as referências locais, sem promessa de cancelamento ou exclusão no fornecedor após o envio. Veja a ADR 0006 e `docs/virtual-fitting.md`.
