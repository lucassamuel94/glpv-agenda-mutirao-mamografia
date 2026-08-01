import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";
import { PageHeader } from "./PageHeader";
import { LayoutSlotsProvider } from "./LayoutSlots";

describe("PageHeader", () => {
  it("oculta ações durante loading sem remover o título da página", () => {
    render(
      <LayoutSlotsProvider>
        <PageHeader
          title="Equipe"
          description="Gerencie acessos."
          isLoading
          actions={<Button>Novo usuário</Button>}
        />
      </LayoutSlotsProvider>,
    );

    expect(screen.getByRole("heading", { name: "Equipe" })).toBeInTheDocument();
    expect(screen.getByText("Gerencie acessos.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Novo usuário" }),
    ).not.toBeInTheDocument();
  });

  it("mantém título, descrição e ação no fluxo da página sem depender dos slots", () => {
    const onAction = vi.fn();
    render(
      <LayoutSlotsProvider>
        <PageHeader
          title="Contatos"
          description="Gerencie a base comercial."
          actions={<Button onClick={onAction}>Novo contato</Button>}
        />
      </LayoutSlotsProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Contatos", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gerencie a base comercial.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Novo contato" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("mantém título e ações empilhados no tablet e alinha somente no desktop", () => {
    render(
      <LayoutSlotsProvider>
        <PageHeader
          title="Contatos"
          description="Gerencie a base comercial."
          actions={<Button>Novo contato</Button>}
        />
      </LayoutSlotsProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Contatos", level: 1 }).parentElement
        ?.parentElement?.parentElement,
    ).toHaveClass("flex-col", "lg:flex-row");
  });

  it("aplica a hierarquia compacta de título e descrição no fluxo da página", () => {
    render(
      <LayoutSlotsProvider>
        <PageHeader
          title="Relatórios"
          description="Acompanhe os principais indicadores."
        />
      </LayoutSlotsProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Relatórios", level: 1 }),
    ).toHaveClass(
      "text-[22px]",
      "leading-7",
      "tracking-[-0.02em]",
    );
    expect(screen.getByText("Acompanhe os principais indicadores.")).toHaveClass(
      "mt-1",
      "text-sm",
      "leading-5",
    );
  });
});
