# Setup UX/UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar o `/setup` com progresso claro, validação no momento correto e layout compacto e responsivo.

**Architecture:** Manter o estado e o formulário em `Setup.tsx`, substituindo a navegação visual por abas por um progresso semântico não interativo. Proteger o comportamento com testes de interação no componente real e validar o resultado renderizado no navegador.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 3, React Hook Form, Vitest e Testing Library.

## Global Constraints

- Não alterar `apps/web/src/components/ui/`.
- Não alterar schema, payload, API, autenticação ou redirecionamento final.
- Não adicionar dependências ou assets.
- Preservar os componentes catalogados `Button`, `Form`, `Input` e `MaskedInput`.
- Usar indigo somente no progresso, foco e ação principal.
- Validar desktop e mobile no Browser.
- O snapshot atual não possui `.git`; não declarar nem tentar criar commits.

---

### Task 1: Proteger o progresso e a entrada na segunda etapa

**Files:**
- Modify: `apps/web/src/views/Setup.test.tsx`
- Modify: `apps/web/src/views/Setup.tsx`

**Interfaces:**
- Consumes: `FormRef.trigger`, `FormRef.clearErrors` e o estado `step`.
- Produces: progresso acessível e transição para a etapa `admin` sem erros prematuros.

- [ ] **Step 1: Escrever o teste de regressão**

Adicionar um caso que renderiza a tela, preenche os campos obrigatórios da
organização, aciona `Continuar` e verifica:

```tsx
expect(screen.getByRole("progressbar", {
  name: "Progresso da configuração",
})).toHaveAttribute("aria-valuenow", "1");

await user.click(screen.getByRole("button", { name: "Continuar" }));

expect(screen.getByRole("heading", {
  name: "Administrador da Plataforma",
})).toBeInTheDocument();
expect(screen.queryByText("Campo obrigatório")).not.toBeInTheDocument();
expect(screen.getByRole("progressbar", {
  name: "Progresso da configuração",
})).toHaveAttribute("aria-valuenow", "2");
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/views/Setup.test.tsx
```

Expected: FAIL porque o progresso atual é um `tablist`, não um
`progressbar`, e a etapa de administrador abre com erros obrigatórios.

- [ ] **Step 3: Implementar o progresso e limpar erros futuros**

Em `Setup.tsx`:

```tsx
const ADMIN_STEP_FIELDS: (keyof RequestAccessFormValues)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

const progressValue = step === "org" ? 1 : 2;
const progressTitle = step === "org" ? "Organização" : "Administrador";
```

Antes de mudar para `admin`, executar:

```tsx
formRef.current?.clearErrors(ADMIN_STEP_FIELDS);
setStep("admin");
```

Substituir o `Tabs.List` por um bloco com:

```tsx
<div
  role="progressbar"
  aria-label="Progresso da configuração"
  aria-valuemin={1}
  aria-valuemax={2}
  aria-valuenow={progressValue}
/>
```

Renderizar somente a seção correspondente ao valor atual de `step`.

- [ ] **Step 4: Executar o teste e confirmar que passa**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/views/Setup.test.tsx
```

Expected: todos os casos de `Setup.test.tsx` passam.

---

### Task 2: Aplicar o layout compacto e responsivo

**Files:**
- Modify: `apps/web/src/views/Setup.tsx`

**Interfaces:**
- Consumes: tokens semânticos e componentes pai já existentes.
- Produces: card contínuo de até 560px, cabeçalho neutro, formulário responsivo e ações adaptáveis.

- [ ] **Step 1: Reestruturar o container e o cabeçalho**

Usar `main` com fundo neutro e container `max-w-[560px]`. Substituir o bloco
roxo por cabeçalho branco com o ícone em `bg-primary/10 text-primary`, borda
inferior e sombra discreta no container.

- [ ] **Step 2: Compactar formulário e ações**

Usar paddings `px-6` no mobile e `sm:px-8` no desktop. Manter espaçamento de
16px entre campos e colocar as ações da segunda etapa em
`flex-col-reverse sm:flex-row`, com botões de largura total apenas no mobile.

- [ ] **Step 3: Rodar teste focado, lint e build**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/views/Setup.test.tsx
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web build
```

Expected: comandos encerram com código 0.

---

### Task 3: Validar o fluxo renderizado

**Files:**
- Verify: `apps/web/src/views/Setup.tsx`

**Interfaces:**
- Consumes: aplicação local em `http://localhost:3000/setup`.
- Produces: evidência visual e comportamental desktop/mobile.

- [ ] **Step 1: Validar desktop**

No viewport `780x906`, recarregar `/setup`, confirmar identidade da página,
ausência de overlay/erros de console, preencher organização, avançar e
verificar que a segunda etapa inicia limpa.

- [ ] **Step 2: Validar mobile**

No viewport `390x844`, verificar ausência de clipping e rolagem horizontal,
hierarquia do cabeçalho, progresso, campos e ações.

- [ ] **Step 3: Capturar e inspecionar screenshots**

Salvar screenshots finais fora dos arquivos de produção, inspecionar as
imagens e comparar pelo menos: hierarquia, progresso, paleta, tipografia,
espaçamento, responsividade e estado de validação.

- [ ] **Step 4: Executar a verificação final**

Run:

```bash
pnpm --filter @ez-starter-kit/web test
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web build
```

Expected: zero falhas, zero erros de lint e build concluído.
