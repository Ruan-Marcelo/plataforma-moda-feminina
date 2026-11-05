# Publicacao

A aplicacao deve ser publicada com ambientes separados, PostgreSQL sem acesso publico direto, HTTPS, armazenamento de imagens isolado e segredos em variaveis de ambiente ou gerenciador de segredos.

Antes da publicacao ainda faltam configurar hospedagem, dominio, CDN/WAF, OAuth, provedor de IA, observabilidade, backups testados e alertas. prisma migrate deploy e o procedimento previsto para migrations de producao.
