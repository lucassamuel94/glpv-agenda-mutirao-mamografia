import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("rola somente o conteúdo e mantém o footer fora da área rolável", () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn()}
        title="Novo contato"
        footer={<button type="button">Salvar</button>}
      >
        <div>Conteúdo extenso</div>
      </Dialog>,
    );

    const contentArea = screen.getByText("Conteúdo extenso").parentElement;
    const footer = screen.getByRole("button", { name: "Salvar" }).parentElement;

    expect(contentArea).toHaveClass("overflow-y-auto");
    expect(contentArea).not.toContainElement(footer);
  });
});
