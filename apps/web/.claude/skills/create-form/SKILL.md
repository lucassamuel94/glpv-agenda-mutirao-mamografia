---
name: create-form
description: Use when the user asks to 'criar form', 'novo formulário', 'create form', 'add form', 'cadastro de X', or needs a create/edit form for an entity. Generates a form using Form + Form/Fields with react-hook-form + zod following frontend/CLAUDE.md conventions.
---

# create-form — formulário com Form + Form/Fields

Forms usam SEMPRE o wrapper `Form` + campos de `Form/Fields` + validação zod.
Nunca `<input>` solto nem componentes de `ui/` diretos.

## Passo 0 — Contexto local

1. Leia `CLAUDE.md` (seção de formulários) do projeto atual.
2. `ls src/components/Form/Fields/` — quais Fields existem NESTE clone (Input, Select, Combobox, DatePicker, MaskedInput, NumberInput, RadioGroup, Switch, TimePicker, MultiSelect...). Só use os que existem.
3. Se o form é de uma entidade em `src/modules/`, leia o `*-validation.ts` e types existentes — ofereça auto-completar os campos a partir deles.
4. Leia 1 form existente (ex: `modules/contacts/contact-form.tsx`) como referência viva.

## Passo 1 — Perguntas (AskUserQuestion, uma por vez)

1. Entidade alvo (se achou em modules/, confirmar auto-preenchimento dos campos).
2. Campos + tipo de input de cada um (mapear para os Fields do Passo 0.2).
3. Modo: `create`, `edit` ou ambos (dialog com os dois).

## Passo 2 — Gerar

1. Schema zod em `<entidade>-validation.ts` (ou estender o existente) — mensagens de erro em PT-BR.
2. `<Entidade>Form.tsx`: `<Form>` + um `Form/Fields` por campo, defaultValues por modo.
3. Submit ligado à action do hook da entidade (`use-<entidade>.ts`) — mutation NUNCA no form/view; erro vira `toast` de `@/lib/toast` no try/catch da view.

## Passo 3 — Validação

1. `npx tsc --noEmit` — zero erros novos.
2. Conferir visualmente os estados: campo obrigatório vazio → mensagem zod; submit ok → toast success.

## Regras inegociáveis

- Campos só de `Form/Fields` (integram com react-hook-form). Nada de `ui/` direto.
- Validação centralizada no schema zod do módulo (`*-validation.ts`), não inline.
- `toast` só de `@/lib/toast`.
- **Campo de texto opcional manda `""`, não `undefined`**, quando o usuário não preenche.
  Se o backend distingue "vazio" de "ausente" (campo com índice único, por exemplo), o
  payload precisa omitir o campo vazio OU o backend precisa normalizar `""` → `null`.
  Fonte de verdade é o DTO: confira antes de assumir. No template, `document` do contato é
  exatamente esse caso — o backend normaliza, e é `""` que o form usa para LIMPAR o campo.
- **Lista dinâmica de sub-itens** (N e-mails, N telefones): em modo `edit`, pré-carregue a
  lista COMPLETA vinda do detalhe. O PUT substitui a lista inteira; submeter só a primeira
  linha apaga o resto sem aviso. Referência: `contact-identity-fields.tsx` +
  `toIdentityRows` em `contact-dialog.tsx`.
- Valor de `type`/enum enviado ao backend precisa estar no catálogo que o DTO valida
  (`@IsIn`) — use a união do `src/types/` correspondente em vez de `string`.

## Esqueleto de referência (schema + campo)

```ts
// entidade-validation.ts
import { z } from "zod";

export const createEntidadeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  segment: z.string().min(1, "Selecione um segmento"),
});

export type CreateEntidadeFormValues = z.infer<typeof createEntidadeSchema>;
```

```tsx
// entidade-form.tsx
import { Form, Input, Select } from "@/components/Form";
import { createEntidadeSchema, CreateEntidadeFormValues } from "./entidade-validation";

<Form schema={createEntidadeSchema} onSubmit={onSubmit} onCancel={onCancel}>
  <Input name="name" label="Nome" required placeholder="Ex: João Silva" />
  <Select name="segment" label="Segmento" options={segmentOptions} />
</Form>;
```

## Próximo passo a sugerir

- Form dentro de dialog de módulo novo → skill `create-module` cobre a estrutura completa.
