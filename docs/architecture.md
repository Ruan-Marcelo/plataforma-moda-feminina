# Arquitetura

O projeto começa como um monólito modular Next.js App Router. Componentes de servidor são o padrão; serviços de domínio e repositórios isolam regras e persistência. PostgreSQL é acessado por Prisma. Integrações de autenticação, armazenamento, analytics e provador serão adaptadores configuráveis.

## Fluxo

Navegador -> páginas/rotas Next -> validação Zod -> serviço de domínio -> repositório Prisma -> PostgreSQL. Integrações externas nunca recebem segredos no cliente.
