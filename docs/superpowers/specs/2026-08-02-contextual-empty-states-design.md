# Estados vazios contextuais para tabelas e buscas

## Objetivo

Padronizar os estados sem informação do sistema com uma ilustração animada,
texto contextual e uma ação adequada para a página ou busca atual.

## Resultado esperado

Cada tabela ou busca sem conteúdo exibirá uma superfície vazia visualmente
intencional, inspirada na referência fornecida: cartões empilhados, cartão
frontal com ícone contextual e elementos decorativos que representam o conteúdo
ausente. A composição não será um card sobre outro card; ela ficará integrada à
superfície da tabela/listagem.

## Componente e API

O componente compartilhado `apps/web/src/modules/common/empty-state.tsx` será a
fonte do padrão e receberá uma API contextual:

```tsx
<EmptyState
  kind="patients"
  mode="no-results"
  query={searchTerm}
  title="Nenhum paciente encontrado"
  description="Tente ajustar a busca ou limpar os filtros."
  action={{ label: "Limpar busca", onClick: clearSearch }}
/>
```

### Modos

- `no-data`: nenhum item foi cadastrado; usa ação de criação quando a tela
  oferecer essa operação.
- `no-results`: busca ou filtros não encontraram correspondências; exibe ação
  para limpar busca/filtros.
- `no-availability`: não há vagas, horários ou sugestões disponíveis; usa ação
  contextual para trocar data/filtros quando houver.

### Contextos visuais

`kind` define ícone, acento visual e ilustração para pacientes, clínicas,
usuários/equipe, agenda, lista de espera, auditoria e busca. A tela continuará
responsável por fornecer título, descrição e ação, evitando textos incorretos
para o domínio atual.

## Movimento

- Entrada única do conjunto com fade e deslocamento vertical curto.
- Cartões decorativos entram em sequência rápida.
- O cartão frontal tem uma pequena respiração apenas durante a entrada.
- Não há loop contínuo, timer React ou animação permanente.
- `prefers-reduced-motion: reduce` desativa entrada, stagger e deslocamento.

## Conteúdo e ações

- Busca sem resultado: ilustração contextual, título com o termo quando
  aplicável, descrição orientando ajuste e botão `Limpar busca` ou
  `Limpar filtros`.
- Tabela sem registros: título específico da entidade, descrição de primeiro
  passo e ação de criação quando existir, como `Cadastrar paciente`,
  `Adicionar clínica` ou `Convidar usuário`.
- Agenda sem disponibilidade: texto sobre data/janela e ação para trocar o
  contexto quando a tela possuir esse controle.
- Loading e erro não usam o estado vazio contextual.

## Acessibilidade e responsividade

- A ilustração será decorativa com `aria-hidden="true"`.
- O título será o conteúdo principal do estado e terá hierarquia semântica.
- Ações terão rótulos específicos, foco visível e comportamento existente.
- O estado será integrado à superfície atual e manterá altura confortável sem
  criar sobreposição de cards.
- A composição será responsiva para tabelas estreitas e telas móveis.

## Escopo de adoção

Aplicar o padrão ao componente compartilhado e aos vazios diretos das telas de
clínicas, pacientes, equipe/usuários, agenda, lista de espera, relatórios,
auditoria, organizações, vínculos do perfil e buscas correspondentes. Manter
fora da migração mensagens de loading, erros e vazios internos de controles que
representam apenas opções filtradas de um combobox/multiselect.

## Validação

- Testes do componente para `kind`, `mode`, conteúdo, ação e movimento.
- Teste de redução de movimento por contrato de classe/estilo.
- Testes existentes das telas devem continuar passando.
- ESLint, suíte web, build e `git diff --check`.
- Inspeção visual dos estados vazios renderizados; limitações de navegador serão
  reportadas separadamente.
