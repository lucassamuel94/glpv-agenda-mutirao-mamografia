# Setup UX/UI — especificação de design

Data: 2026-07-30

## Objetivo

Corrigir a hierarquia, o progresso, os estados de validação e a responsividade
do fluxo `/setup`, sem alterar API, schema, payload, autenticação ou o
redirecionamento após a configuração.

## Direção aprovada

O setup seguirá a linguagem compacta e neutra do shell atual:

- superfície branca contínua, com borda e sombra discretas;
- marca pequena no cabeçalho, sem grande bloco roxo;
- indigo restrito ao progresso, foco e ação principal;
- espaçamento confortável no desktop e econômico no mobile;
- nenhuma aparência de abas para um fluxo que só avança após validação.

## Estrutura

1. Cabeçalho compacto com ícone, nome do produto, rótulo
   “Configuração inicial” e uma descrição curta.
2. Indicador de progresso não interativo com “Etapa 1 de 2” ou
   “Etapa 2 de 2”, nome da etapa atual e barra segmentada.
3. Uma única seção de formulário visível por vez.
4. Ações próximas ao conteúdo: `Continuar` na primeira etapa; `Voltar` e
   `Concluir configuração` na segunda.

## Comportamento

- `Continuar` valida apenas nome da organização, CNPJ e endereço.
- A etapa de administrador abre sem erros antes de qualquer interação.
- `Voltar` preserva os valores já digitados.
- O progresso expõe valor atual, mínimo e máximo para tecnologias assistivas.
- O envio final e a navegação de página inteira permanecem inalterados.

## Responsividade

- O container usa margem externa de 16px no mobile e 24px ou mais no desktop.
- O card ocupa toda a largura disponível, limitado a aproximadamente 560px.
- Paddings internos reduzem de 32px para 24px no mobile.
- Na segunda etapa, as ações empilham no mobile e ficam opostas no desktop.
- Não pode haver rolagem horizontal, clipping ou conteúdo abaixo da área
  clicável.

## Acessibilidade

- `main`, título principal e títulos de seção mantêm ordem semântica.
- O progresso usa `role="progressbar"` e valores `aria-valuenow`,
  `aria-valuemin` e `aria-valuemax`.
- Campos continuam usando os componentes catalogados do Form.
- Foco, erros e estados disabled continuam sob responsabilidade dos
  componentes existentes.

## Fora do escopo

- Alterar componentes em `src/components/ui/`.
- Alterar schema, payload, endpoints ou permissões.
- Adicionar dependências, assets ou novas rotas.
- Redesenhar login, solicitação de acesso ou o shell autenticado.
