import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Dialog, Confirm, InputDialog } from "@/components/Dialog";
import { Button, CancelButton, SaveButton } from "@/components/Button";

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {
    maxWidth: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "2xl", "3xl"],
    },
    subtitle: {
      control: "text",
      description:
        "Texto informativo secundário, exibido abaixo do título em fonte menor e cor muted. Use para complemento não-crítico (ex.: contexto do registro sendo editado).",
    },
    closeOnOutsideClick: {
      control: "boolean",
      description:
        "Quando false, clicar fora (no backdrop) NÃO fecha o modal — evita fechamento acidental em fluxos que precisam ser concluídos (ex.: cadastro do cliente). ESC e o X/Cancelar continuam fechando. Default true.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir Dialog</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Título do Dialog" footer={<><CancelButton onClick={() => setOpen(false)} /><SaveButton onClick={() => setOpen(false)} /></>}>
          <p className="text-sm text-muted-foreground">Conteúdo do dialog.</p>
        </Dialog>
      </>
    );
  },
};

export const WithSubtitle: Story = {
  name: "Com subtítulo",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Dialog com subtítulo</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Editar cliente"
          subtitle="Ana Silva · Cliente #1042"
          footer={<><CancelButton onClick={() => setOpen(false)} /><SaveButton onClick={() => setOpen(false)} /></>}
        >
          <p className="text-sm text-muted-foreground">
            O subtítulo aparece abaixo do título em fonte menor e cor muted —
            informativo secundário, sem competir com o título.
          </p>
        </Dialog>
      </>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Dialog Pequeno</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Dialog Pequeno" maxWidth="sm" footer={<Button onClick={() => setOpen(false)}>Fechar</Button>}>
          <p className="text-sm text-muted-foreground">Um dialog compacto.</p>
        </Dialog>
      </>
    );
  },
};

export const Large: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Dialog Grande</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Dialog Grande" maxWidth="2xl" footer={<Button onClick={() => setOpen(false)}>Fechar</Button>}>
          <p className="text-sm text-muted-foreground">Um dialog amplo para conteúdo extenso.</p>
        </Dialog>
      </>
    );
  },
};

export const NoOutsideClickClose: Story = {
  name: "Sem fechar ao clicar fora",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">
          Dialog (não fecha no backdrop)
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Conclua antes de sair"
          closeOnOutsideClick={false}
          footer={<Button onClick={() => setOpen(false)}>Fechar</Button>}
        >
          <p className="text-sm text-muted-foreground">
            Clicar fora (no backdrop) não fecha este modal — use o X, Cancelar
            ou ESC. Útil para fluxos que o usuário precisa concluir (ex.: o
            cadastro do cliente).
          </p>
        </Dialog>
      </>
    );
  },
};

export const ConfirmDefault: Story = {
  name: "Confirm (Default)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Abrir Confirm</Button>
        <Confirm open={open} onClose={() => setOpen(false)} onConfirm={() => alert("Confirmado!")} title="Confirmar Ação" message="Deseja realmente prosseguir com esta ação?" />
      </>
    );
  },
};

export const ConfirmDanger: Story = {
  name: "Confirm (Danger)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="destructive">Excluir Item</Button>
        <Confirm open={open} onClose={() => setOpen(false)} onConfirm={() => alert("Excluído!")} title="Excluir Cliente" message="Deseja realmente excluir este cliente? Esta ação não pode ser desfeita." variant="danger" confirmText="Sim, excluir" />
      </>
    );
  },
};

export const InputDialogDefault: Story = {
  name: "InputDialog",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Renomear</Button>
        <InputDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={(value) => alert(`Valor: ${value}`)}
          title="Renomear Item"
          message="Digite o novo nome para este item."
          placeholder="Novo nome..."
        />
      </>
    );
  },
};

export const InputDialogRequired: Story = {
  name: "InputDialog (Required)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Adicionar Nota</Button>
        <InputDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={(value) => alert(`Nota: ${value}`)}
          title="Adicionar Nota"
          placeholder="Escreva sua nota..."
          required
          confirmText="Salvar"
        />
      </>
    );
  },
};
