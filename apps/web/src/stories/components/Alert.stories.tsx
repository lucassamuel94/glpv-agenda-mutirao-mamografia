import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["info", "success", "warning", "error"],
    },
    title: { control: "text" },
    message: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const InfoAlert: Story = {
  args: {
    title: "teste 123"
  },

  name: "Info",

  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Abrir Alert</Button>
        <Alert open={open} onClose={() => setOpen(false)} title="Informação" message="Este é um alerta informativo." type="info" />
      </>
    );
  }
};

export const SuccessAlert: Story = {
  name: "Success",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Abrir Alert</Button>
        <Alert open={open} onClose={() => setOpen(false)} title="Sucesso" message="Operação realizada com sucesso!" type="success" />
      </>
    );
  },
};

export const WarningAlert: Story = {
  name: "Warning",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Abrir Alert</Button>
        <Alert open={open} onClose={() => setOpen(false)} title="Atenção" message="Cuidado com esta ação." type="warning" />
      </>
    );
  },
};

export const ErrorAlert: Story = {
  name: "Error",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">Abrir Alert</Button>
        <Alert open={open} onClose={() => setOpen(false)} title="Erro" message="Ocorreu um erro ao processar a solicitação." type="error" />
      </>
    );
  },
};
