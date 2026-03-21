# hooks

Hooks customizados do React que encapsulam lógica reutilizável e estado compartilhado entre componentes.

## Hooks atuais:
- `use-mobile.ts`: Detecta se o usuário está em um dispositivo móvel para adaptar a UI
- `use-toast.ts`: Gerencia notificações toast (mensagens temporárias de feedback) em toda a aplicação

Custom hooks seguem a convenção de começar com "use-" e são projetados para serem puros e testáveis isoladamente, promovendo reutilização de lógica de negócio entre componentes.