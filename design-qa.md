# Design QA — shell inspirado no Linear

Data: 2026-07-29

## Referências

- Verdade visual: screenshots do Linear fornecidas pelo usuário em 2026-07-29
  (sessão anterior) e reenviadas em 2026-07-30 (dark: `Agent` em novo chat;
  light: `Preferences`; dark: sidebar colapsada em janela com frame recuado
  arredondado).
- Caminho da fonte: ainda indisponível como arquivo/URL. Resolvido nesta
  sessão via inspeção visual direta multimodal (as imagens do anexo foram
  lidas e comparadas lado a lado com as evidências renderizadas, sem depender
  de arquivo em disco).
- Dimensões e densidade da fonte: não fornecidas com precisão de pixel; app
  Linear real, não um design file. Comparação tratada como estrutural/
  qualitativa, não pixel-perfect.
- Implementação: aplicação local autenticada no Chrome conectado.
- Evidências renderizadas:
  `.superpowers/sdd/2026-07-29-linear-inspired-shell/task-6-evidence/`.

## Normalização e comparação

- Capturas da implementação: `devicePixelRatio: 1`; pixels da imagem iguais ao
  viewport CSS.
- Desktop: 1440×900 e 2056×1082.
- Mobile: 390×844.
- Tablet: 768×1024. Neste breakpoint exato, `md` já está ativo e a sidebar é
  desktop expandida/recolhida; o drawer é usado abaixo de 768px, conforme a
  especificação aprovada.
- Comparação full-view normalizada: **concluída** (2026-07-30) via inspeção
  visual direta das quatro imagens de referência do Linear contra
  `desktop-1440-dark-expanded-postfix.png`, `desktop-1440-light-expanded.png`,
  `desktop-1440-dark-collapsed.png` e `desktop-1440-dark-user-menu.png`.
- Comparação focada (sidebar, topbar, item ativo e menu): **concluída**.
  Padrão estrutural confere: marca no topo, grupos rotulados, item ativo com
  fundo neutro (sem barra indigo), elemento fixo ancorado no rodapé da
  sidebar separado por borda, sidebar colapsada como trilho de ícones, frame
  desktop recuado com cantos arredondados.
- Delta identificado (P3): no tema light, a sidebar do Linear usa fundo
  cinza-claro visivelmente distinto do conteúdo branco; na implementação a
  sidebar light é branca, igual ao conteúdo, separada só por borda de 1px.
  Não bloqueante — tokens neutros já revisados e aprovados nas rodadas
  anteriores (Task 2).

## Viewports e estados

| Viewport | Tema | Estado | Evidência | Resultado isolado |
| --- | --- | --- | --- | --- |
| 1440×900 | dark | sidebar expandida | `desktop-1440-dark-expanded-postfix.png` | frame sem overflow; sidebar 236px |
| 1440×900 | dark | sidebar recolhida | `desktop-1440-dark-collapsed.png` | sidebar 64px; frame reposicionado |
| 1440×900 | dark | menu do usuário | `desktop-1440-dark-user-menu.png` | menu visível e acionador semântico |
| 1440×900 | light | sidebar expandida | `desktop-1440-light-expanded.png` | frame sem overflow; seleção neutra |
| 1440×900 | light | sidebar recolhida | `desktop-1440-light-collapsed.png` | sidebar 64px |
| 1440×900 | light | menu do usuário | `desktop-1440-light-user-menu.png` | menu visível |
| 1440×900 | light | modo Zen | `desktop-1440-light-zen.png` | shell removido e saída disponível |
| 2056×1082 | dark | sidebar expandida | `desktop-2056-dark-expanded.png` | sidebar 236px; topbar 48px |
| 2056×1082 | light | sidebar expandida | `desktop-2056-light-expanded.png` | frame 8px e conteúdo limitado |
| 390×844 | light | drawer fechado | `mobile-390-light-drawer-closed.png` | sem bloqueio ou overflow horizontal |
| 390×844 | light | drawer aberto | `mobile-390-light-drawer-open.png` | drawer 236px e backdrop |
| 390×844 | dark | drawer fechado | `mobile-390-dark-drawer-closed.png` | sem bloqueio ou overflow horizontal |
| 390×844 | dark | drawer aberto | `mobile-390-dark-drawer-open.png` | drawer 236px e backdrop |
| 768×1024 | dark | sidebar recolhida | `tablet-768-dark-collapsed.png` | sidebar 64px; sem overflow |
| 768×1024 | dark | sidebar expandida após correção | `tablet-768-dark-expanded-postfix.png` | header em pilha; sem esmagamento |
| 768×1024 | light | sidebar recolhida | `tablet-768-light-collapsed.png` | sem overflow |
| 768×1024 | light | sidebar expandida | `tablet-768-light-expanded.png` | header em pilha |

## Verificações

- Shell desktop recuado: medido com `x/y = 8px`, raio de 12px e borda sutil.
- Sidebar expandida/recolhida: 236px/64px medidos em 1440 e 2056.
- Topbar: 48px medidos.
- Item ativo: fundo neutro, `aria-current="page"` e sem barra indigo.
- Light/dark: ambos renderizados e capturados.
- Rolagem horizontal: `documentElement.scrollWidth` igual ao viewport em
  390, 768, 1440 e 2056.
- Drawer: abertura, fechamento por `Escape`, backdrop fora da sidebar,
  navegação e retorno de foco para `Abrir menu` testados em 390×844.
- Menu do usuário: abertura/fechamento e estado `aria-expanded` testados.
- Organização: a sessão autenticada expôs apenas uma organização operacional;
  por isso a ação condicional de troca não ficou disponível para captura.
- Modo Zen: entrada e saída testadas; `Escape` também preservado.
- Console: nenhuma mensagem `error`, `warn` ou `warning` após as interações.

## Superfícies de fidelidade

- Tipografia: Inter carregada; navegação 13px/500, grupos 11px/500, título da
  página 22px/600 e topbar 13px/500. Truncamento e quebra foram conferidos.
- Espaçamento/layout: gap externo 8px; sidebar 236/64px; topbar 48px; frame
  contínuo e PageHeader empilhado no tablet após a correção.
- Cores/tokens: neutros claros/escuros, seleção neutra e indigo restrito a
  ação/foco observados nas capturas.
- Imagens/assets: nenhum asset de produto da referência foi recriado; a marca
  existente e ícones Lucide foram preservados.
- Conteúdo: textos e regras de negócio do EZ Starter Kit foram preservados.
- Acessibilidade: item ativo sem depender só de cor, controles nomeados, menu
  do usuário acionável por teclado, drawer com Escape e retorno de foco.

## Histórico de comparação e correções

1. **P2 — menu do usuário sem semântica de controle**
   - Evidência anterior: o acionador era uma `div` clicável, ausente da árvore
     de botões e da navegação por teclado.
   - Correção: convertido para `button` com `aria-haspopup`, `aria-expanded`,
     `aria-controls` e foco visível; menu recebeu `role="menu"`.
   - Pós-correção: teste de componente e captura
     `desktop-1440-dark-user-menu.png`.
2. **P2 — PageHeader comprimido em 768px com sidebar expandida**
   - Evidência anterior: `tablet-768-dark-expanded.png`; título truncado e
     descrição reduzida a uma coluna estreita ao lado das ações.
   - Correção: alinhamento horizontal adiado de `sm` para `lg`.
   - Pós-correção: `tablet-768-dark-expanded-postfix.png`; título, descrição e
     ações voltaram a uma hierarquia legível.

## Evidência técnica

- `pnpm --filter @ez-starter-kit/web lint`: exit 0.
- `pnpm --filter @ez-starter-kit/web exec tsc --noEmit`: exit 0.
- `pnpm --filter @ez-starter-kit/web test`: 48 arquivos, 348 testes passando.
- `pnpm --filter @ez-starter-kit/web build`: exit 0; 18 páginas geradas.
- `pnpm --filter @ez-starter-kit/web check:stories`: 77/77.
- Nenhum arquivo em `apps/web/src/components/ui/` foi alterado.
- Nenhuma API, schema, rota ou dependência foi alterada nesta tarefa.

## Pendências P3

- Sidebar light sem fundo de destaque próprio (branco igual ao conteúdo,
  contra o cinza-claro do Linear). Ajuste cosmético opcional; não bloqueia
  aprovação.

## Bloqueio

Resolvido em 2026-07-30. Comparação normalizada realizada por inspeção visual
direta (multimodal) entre os quatro anexos de referência do Linear e as
evidências da implementação, já que o anexo fonte não pôde ser materializado
como arquivo/URL nesta sessão nem na anterior. Nenhuma divergência P0, P1 ou
P2 encontrada.

final result: passed
