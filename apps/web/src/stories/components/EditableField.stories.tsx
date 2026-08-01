import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { EditableField } from "@/components/EditableField";

const meta: Meta<typeof EditableField> = {
  title: "Components/EditableField",
  component: EditableField,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## EditableField

Campo de edição **in-place** reutilizável (padrão extraído do Settings).

Nasce desabilitado mostrando o valor atual com um ícone **lápis** (✏️) sobreposto
no canto direito. Ao clicar, entra em modo edição: o lápis vira **✓** (salvar) e
**✕** (cancelar). Enter = commit, Escape = cancelar.

**Puramente presentacional**: não conhece Settings nem pausas — emite
\`onCommit(value)\` e \`onCancel()\` para o pai decidir.

- \`onCommit\` pode retornar \`Promise<void>\`; se rejeitar, permanece em edição.
- \`displayValue\` permite exibir conteúdo customizado no modo leitura (ex.: valor
  herdado com estilo muted).
- \`isSaving\` desabilita os controles enquanto o pai persiste o valor.
        `,
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "number"] },
    disabled: { control: "boolean" },
    isSaving: { control: "boolean" },
    error: { control: "text" },
    required: { control: "boolean" },
    draftSeed: { control: "text", description: "Valor inicial do draft quando value é null/\"\". Pré-preenche o input ao abrir edição sem gravar nada." },
    inputId: { control: "text", description: "id repassado ao input interno para vincular label htmlFor (a11y)." },
    readStyle: { control: "select", options: ["input", "transparent"], description: "Estilo do modo leitura: 'input' (campo com borda/bg, default) ou 'transparent' (bg/borda transparentes — parece texto; lápis a 50% e 100% no hover)." },
  },
};

export default meta;
type Story = StoryObj<typeof EditableField>;

// Story base controlada — usa wrapper com estado para demonstrar interatividade
function Controlled(props: Partial<React.ComponentProps<typeof EditableField>>) {
  const [value, setValue] = useState<string | number | null>(
    props.value ?? "valor exemplo",
  );
  return (
    <div className="w-72">
      <EditableField
        value={value}
        onCommit={(v) => setValue(v)}
        {...props}
      />
    </div>
  );
}

export const Texto: Story = {
  render: () => <Controlled value="João Silva" />,
};

export const Numero: Story = {
  render: () => <Controlled type="number" value={60} />,
};

// readStyle="transparent": leitura sem cara de campo (bg/borda transparentes) — tabela de pausas
export const Transparente: Story = {
  render: () => <Controlled type="number" value={60} readStyle="transparent" />,
};

export const ComErro: Story = {
  render: () => (
    <div className="w-72">
      <EditableField
        value=""
        error="Campo obrigatório"
        onCommit={() => {}}
      />
    </div>
  ),
};

export const Salvando: Story = {
  render: () => (
    <div className="w-72">
      <EditableField
        value="Carregando..."
        isSaving
        onCommit={() => {}}
      />
    </div>
  ),
};

export const ComDisplayValueHerdado: Story = {
  name: "Com displayValue (herdar padrão)",
  render: () => (
    <Controlled
      type="number"
      value={null}
      displayValue={
        <span className="text-muted-foreground">60 min</span>
      }
    />
  ),
};

export const ComDisplayValueOverride: Story = {
  name: "Com displayValue (override ativo)",
  render: () => (
    <Controlled
      type="number"
      value={45}
      displayValue={
        <span>45 min</span>
      }
    />
  ),
};

export const Desabilitado: Story = {
  render: () => (
    <div className="w-72">
      <EditableField
        value="Somente leitura"
        disabled
        onCommit={() => {}}
      />
    </div>
  ),
};

export const ComDraftSeed: Story = {
  name: "Com draftSeed (pré-preenche default ao abrir)",
  render: () => (
    <div className="space-y-2 w-72">
      <p className="text-xs text-muted-foreground">
        value=null (herdar) + draftSeed=60 → ao clicar no lápis, input abre com 60.
        Cancelar volta a herdar (null). Confirmar grava override.
      </p>
      <Controlled
        type="number"
        value={null}
        displayValue={
          <span className="text-muted-foreground">60 min</span>
        }
        draftSeed={60}
      />
    </div>
  ),
};
