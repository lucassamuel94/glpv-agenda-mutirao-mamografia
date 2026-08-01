---
name: create-component
description: Use when the user asks to 'criar componente', 'novo componente', 'create component', 'add component to design system', or describes a UI piece missing from src/components/. Creates component + story + design-system.config entry + refreshes MCP data.
---

# create-component — componente do design system

Componente novo SEMPRE nasce em trio: código + story + catálogo MCP atualizado.

## Passo 0 — Contexto local

1. Leia `CLAUDE.md` §1-§3 do projeto atual (regras de componentes/stories/MCP podem ter sido customizadas no clone).
2. Verifique duplicação ANTES de criar: procure o nome (e sinônimos) em `src/components/`, `src/components/ui/`, `src/components/Form/Fields/` e no barrel `src/components/index.ts`. Se algo parecido existe, ofereça estender em vez de criar.
3. Leia 1-2 componentes da mesma categoria para extrair as convenções vivas (forwardRef?, `cn(...)`, tipagem de props, `cva` para variants).

## Passo 1 — Perguntas (AskUserQuestion, uma por vez)

1. Categoria: `components/` (wrapper de app), `Form/Fields/` (campo de form) ou outra.
2. Nome (PascalCase).
3. Props principais (até 4).
4. Variants visuais? (se sim, usar `class-variance-authority` como os pares).

## Passo 2 — Criar o trio

1. `src/components/<Nome>.tsx` (ou `Form/Fields/<Nome>.tsx`) — seguindo as convenções extraídas no Passo 0.3.
2. `src/stories/components/<Nome>.stories.tsx` (ou `src/stories/form/`) — título `Components/<Nome>` (ou `Form Fields/<Nome>`), story `Default` + uma por variant. Import de `@storybook/nextjs`.
3. Export no barrel `src/components/index.ts` (se a categoria for exportada lá).

## Passo 3 — Catálogo e validação (na ordem)

1. `design-system.config.json`: a camada certa já cobre o path? (Components é flat e pega tudo; só ajustar `ignore` se o componente NÃO deve ser catalogado.)
2. `npm run check:stories` — o componente novo aparece coberto.
3. `npm run build:mcp-data` — catálogo MCP atualizado (~2s).
4. `npx tsc --noEmit` — zero erros novos.
5. Lembrar o usuário: screenshot via `npm run build:mcp-screenshots` quando quiser (~minutos, não bloqueia).

## Regras inegociáveis

- NUNCA criar/editar arquivos em `src/components/ui/` (shadcn é read-only; o hook warn-ui-edits avisa).
- Componente sem story não existe: `check:stories` é o gate.
- Consumidores importam pelo barrel `@/components`, não pelo path individual.

## Esqueleto de referência (story)

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import { MeuComponente } from "@/components/MeuComponente";

const meta: Meta<typeof MeuComponente> = {
  title: "Components/MeuComponente",
  component: MeuComponente,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
  },
};

export default meta;
type Story = StoryObj<typeof MeuComponente>;

export const Default: Story = {
  args: { children: "Texto de exemplo" },
};
```

Uma story por variant além de `Default` (ex: `ComVariante`, `Desabilitado`) segue o mesmo formato, trocando `args` ou usando `render`.

## Próximo passo a sugerir

- Revisão → agent `design-system-reviewer`.
