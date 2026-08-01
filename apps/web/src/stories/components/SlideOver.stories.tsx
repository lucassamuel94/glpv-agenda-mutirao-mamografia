import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import SlideOver from "@/components/SlideOver";
import { Button } from "@/components/Button";

const meta: Meta<typeof SlideOver> = {
  title: "Components/SlideOver",
  component: SlideOver,
  tags: ["autodocs"],
  argTypes: {
    width: {
      control: "select",
      options: ["md", "lg", "xl", "xxl"],
    },
    preventDismiss: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof SlideOver>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Abrir painel
        </Button>
        <SlideOver
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Detalhes do cliente"
          subtitle="Informações completas do cadastro"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conteúdo do painel lateral aqui.
            </p>
            <div className="rounded-md border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Nome: João Silva</p>
              <p className="text-sm font-medium">Email: joao@exemplo.com</p>
              <p className="text-sm font-medium">Telefone: (11) 99999-0000</p>
            </div>
          </div>
        </SlideOver>
      </>
    );
  },
};

export const WithoutSubtitle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir painel (sem subtítulo)
        </Button>
        <SlideOver
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Nova tarefa"
        >
          <p className="text-sm text-muted-foreground">
            Formulário de criação de tarefa aqui.
          </p>
        </SlideOver>
      </>
    );
  },
};

export const Wide: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Abrir painel largo (xxl)
        </Button>
        <SlideOver
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Relatório detalhado"
          subtitle="Visualização expandida com mais espaço"
          width="xxl"
        >
          <p className="text-sm text-muted-foreground">
            Este painel usa a largura máxima (xxl) para exibir conteúdo mais complexo.
          </p>
        </SlideOver>
      </>
    );
  },
};

export const PreventDismiss: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Abrir painel (bloqueado)
        </Button>
        <SlideOver
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Confirmação pendente"
          subtitle="Clique no X para fechar — ESC e clique fora estão bloqueados"
          preventDismiss
        >
          <p className="text-sm text-muted-foreground">
            Este painel só pode ser fechado pelo botão X no cabeçalho.
          </p>
        </SlideOver>
      </>
    );
  },
};
