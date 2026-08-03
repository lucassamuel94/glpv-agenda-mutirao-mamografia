# Animação dos estados vazios

## Objetivo

Dar feedback visual de entrada às telas que não possuem itens cadastrados,
mantendo a linguagem visual do produto discreta e consistente.

## Escopo

- Aplicar uma animação única de entrada ao componente compartilhado
  `apps/web/src/modules/common/empty-state.tsx`.
- Identificar e aplicar o mesmo comportamento aos estados vazios renderizados
  diretamente em telas e módulos, incluindo agenda, pacientes, lista de espera,
  clínicas, relatórios, auditoria, equipe, organizações e vínculos do perfil.
- Animar somente o estado vazio de conteúdo; estados de carregamento, erro e
  ausência de resultados causada por busca/filtros permanecem sem essa animação.

## Comportamento visual

- Entrada única ao montar o estado: fade-in com deslocamento vertical curto.
- Duração curta e suave, sem repetição e sem `animate-pulse` contínuo.
- O conteúdo permanece estável depois da entrada.
- Em `prefers-reduced-motion: reduce`, a entrada não terá deslocamento nem
  transição perceptível.

## Implementação

- Criar um keyframe utilitário no sistema global de estilos e uma classe
  reutilizável para a entrada do estado vazio.
- Usar a classe no `EmptyState` compartilhado.
- Adicionar a classe somente aos vazios diretos que representam ausência real
  de itens cadastrados, preservando o layout e a hierarquia existentes.
- Não alterar textos, contratos de dados, ações ou navegação das telas.

## Validação

- Teste focado do componente/classe para garantir a presença da animação no
  estado vazio.
- ESLint nos arquivos alterados.
- `git diff --check`.
- Build ou teste da aplicação web conforme o custo e os scripts disponíveis.
- Conferência visual limitada ao código e aos estados renderizados disponíveis;
  screenshots de navegador só serão considerados se o ambiente permitir.

## Critérios de aceite

1. Todo estado vazio de cadastro contemplado entra uma única vez.
2. Nenhum loading, erro ou resultado filtrado recebe a animação por engano.
3. A animação não fica em loop.
4. Usuários com redução de movimento não recebem deslocamento/transição.
5. Nenhum texto, ação ou fluxo funcional é alterado.
