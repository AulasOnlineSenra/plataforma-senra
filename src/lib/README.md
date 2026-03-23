# lib

Biblioteca de funções utilitárias e serviços compartilhados utilizados em toda a aplicação.

## Arquivos principais:
- `data.ts`: Funções para manipulação e transformação de dados
- `gcp-background-tasks.ts`: Integração com Google Cloud Platform para tarefas em background
- `mailer.ts`: Configuração e funções para envio de emails (provavelmente usando SendGrid ou similar)
- `navigation.ts`: Utilitários para navegação entre páginas e rotas
- `placeholder-images.ts/json`: Imagens placeholders para uso em desenvolvimento e testes
- `prisma.ts`: Configuração e instância do cliente Prisma ORM
- `types.ts`: Tipos TypeScript compartilhados entre diferentes módulos
- `utils.ts`: Funções utilitárias gerais (formatação, validação, etc.)

Este módulo contém código que é importado e utilizado por múltiplas partes da aplicação, promovendo reutilização e consistência.