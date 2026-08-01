# Componentes do Frontend

Este diretório contém toda a UI reutilizável. A organização segue uma **hierarquia de dois níveis**: base (shadcn) e componentes pai (padronizados). O objetivo é **centralizar** estilo e comportamento em um só lugar e **nunca** alterar a base diretamente.

---

## Hierarquia

### 1. Base (somente leitura): `ui/`

- **Caminho:** `src/components/ui/`
- **Conteúdo:** Componentes do **shadcn/ui** (Radix + Tailwind): `button.tsx`, `input.tsx`, `dialog.tsx`, `label.tsx`, `select.tsx`, `card.tsx`, etc.
- **Regra:** **Não alterar.** Não usar esses componentes diretamente em views ou módulos. Eles existem para serem encapsulados pelos componentes pai. Uma alteração aqui propaga para **todos** os componentes pai que a encapsulam — pode quebrar telas fora do escopo da tarefa.
- **Exceção (única):** alterar `ui/` só com **confirmação humana explícita**, registrando o motivo em comentário no arquivo alterado (ver `frontend/CLAUDE.md` §1).

Ver também: `ui/README.md`.

### 2. Componentes pai (usar sempre): nível superior e `Form/`

- **Caminho:** `src/components/*.tsx` e `src/components/Form/` (incluindo `Form/Fields/`)
- **Papel:** Encapsulam os componentes de `ui/`, aplicam o padrão visual e de comportamento do sistema (cores, espaçamento, integração com Form, etc.). **Sempre** usar estes nas views e nos módulos.

---

## Onde importar

**Em código novo, prefira o barrel `@/components`** (`import { Button, Dialog } from "@/components"`) — é o catálogo público (`src/components/index.ts`) e o ponto único de evolução do design system. A coluna "Importar de" abaixo mostra o caminho individual que o barrel re-exporta (também válido).

Se o componente **não existir** na raiz de `components/` — ou existir mas não estiver exportado no `index.ts` — crie-o na raiz e **registre o export no barrel**: todo componente deve ser acessível via `@/components/` (ver `frontend/CLAUDE.md` §2).

| Necessidade                            | Importar de                                                          | Não usar                                                |
| -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Botão                                  | `@/components/Button`                                                | `@/components/ui/button`                                |
| Modal / diálogo                        | `@/components/Dialog`                                                | `@/components/ui/dialog`                                |
| Alerta (info, success, warning, error) | `@/components/Alert`                                                 | —                                                       |
| Modal com input (confirmar ação)       | `@/components/Dialog` (InputDialog)                                  | —                                                       |
| Card                                   | `@/components/Card`                                                  | `@/components/ui/card`                                  |
| Formulário                             | `@/components/Form`                                                  | `@/components/ui/form`                                  |
| Campos de formulário                   | `@/components/Form/Fields` ou `@/components/Form/Fields/Input`, etc. | `@/components/ui/input`, `@/components/ui/select`, etc. |
| Paginação                              | `@/components/Pagination`                                            | —                                                       |
| Tooltip                                | `@/components/Tooltip`                                               | —                                                       |
| Layout / Sidebar                       | `@/components/Layout`, `@/components/Sidebar`                        | —                                                       |

---

## Contratos visuais do produto

- O shell suporta mobile, tablet e desktop. A sidebar vira drawer abaixo de `768px`; nenhuma view pode bloquear uma largura.
- `PageHeader` mantém título, descrição e ações no fluxo da página e publica o título compacto no shell.
- `DataTable.Root responsive="stack"` é o padrão para listagens operacionais no mobile. Use `mobileLabel` em cada célula e `mobileSpan="full"` para a identidade principal.
- `Pagination` não renderiza quando existe somente uma página. `alwaysVisible` é reservado a stories e demonstrações.
- Status usam `Badge` semântico: `neutral`, `info`, `success`, `warning` e `danger`. Indigo fica reservado a ação, seleção e foco.
- `Dialog` limita a altura a `90dvh`; header e footer permanecem visíveis e apenas o conteúdo central rola.
- Superfícies comuns usam borda neutra e raio de `8px`. Sombras ficam restritas a diálogos, menus e popovers.
- Valor ausente é exibido como `—` em texto muted.

---

## Formulários

- Usar o **Form** de `@/components/Form` (wrapper com react-hook-form e validação).
- Usar **apenas** os campos de **`@/components/Form/Fields`**: `Input`, `TextArea`, `Select`, `Checkbox`, `Switch`, `DatePicker`, `TimePicker`, `RadioGroup`, `Combobox`, `ComboboxMultiple`, `NumberInput`, `MaskedInput`, `HiddenUuid`, `TimeZone`, `Days`.
- Esses campos já estão integrados ao Form (nome, label, required, validação, erro). Não usar `<input>` ou componentes de `ui/` soltos em formulários.
- Validação: preferir schemas Zod em arquivos `*-validation.ts` por módulo (ex.: `contact-validation.ts`).

---

## Alertas e modais

- **Mensagem simples (OK):** `Alert` com `type`: `info` | `success` | `warning` | `error`.
- **Modal genérico (título + conteúdo + footer):** `Dialog`.
- **Confirmação com um campo de texto:** `InputDialog` (importar de `@/components/Dialog`).
- **Confirmação Sim/Não (sem input):** `Dialog` com botões no `footer`.
- Não criar novos padrões de modal ou alerta; reutilizar os componentes acima.

---

## Módulos por domínio

- **Caminho:** `src/modules/<nome>/`
- Exemplos: `contacts/` (contact-dialog, contact-form, contact-table, contact-validation), `profile/` (profile-dialog, profile-validation), `auth/`, `common/`, `users/`.
- Cada módulo usa **apenas** os componentes pai (Button, Dialog, Form, Form/Fields, Card, Alert, Pagination, etc.) e segue a mesma estrutura de arquivos e nomenclatura dos demais.

---

## Referência visual

- **Style Guide:** rota `/style-guide` — cores, tipografia, botões, cards, inputs, estados.
- **Form Guide:** rota `/form-guide` — exemplos de Form e de cada Field.

Se um componente ou padrão **não existir** nesses guias, ele deve ser **criado no nível dos componentes pai** (novo arquivo aqui ou em `Form/Fields/`), **nunca** alterando arquivos em `ui/`.

---

## Resumo

- **`ui/`** = base shadcn → não alterar (propaga para todos os consumidores); não usar diretamente em views/módulos. Exceção única: confirmação humana + motivo em comentário.
- **Resto de `components/` e `Form/`** = componentes pai → usar sempre; centralizam padrão e consistência. Importar pelo barrel `@/components`; componente novo entra na raiz **e** no `index.ts`.
- **Formulários:** Form + Form/Fields.
- **Alertas/modais:** Alert, Dialog, InputDialog.
- **Novos módulos:** mesma estrutura, mesmos componentes, mesmas cores e layout; referência em Style Guide e Form Guide.

Para instruções completas para IA e novos módulos, ver **`frontend/AGENTS.md`** e **`.cursor/rules/frontend-components.mdc`** na raiz do repositório.
