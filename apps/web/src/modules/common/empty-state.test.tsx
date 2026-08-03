import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

function getEmptyStateRoot() {
  return screen.getByRole("heading", { name: "Nenhum item" }).parentElement;
}

describe("EmptyState — entrada animada", () => {
  it("anima o estado vazio por padrão", () => {
    render(<EmptyState title="Nenhum item" />);

    expect(getEmptyStateRoot()).toHaveClass("animate-empty-state-enter");
  });

  it("permite desativar a animação para resultados filtrados", () => {
    render(<EmptyState title="Nenhum item" animate={false} />);

    expect(getEmptyStateRoot()).not.toHaveClass("animate-empty-state-enter");
  });

  it("renderiza ilustração, contexto e ação para uma busca sem resultado", () => {
    const onClear = vi.fn();

    render(
      <EmptyState
        kind="patients"
        mode="no-results"
        query="Maria"
        title="Nenhum paciente encontrado"
        description="Tente ajustar a busca."
        action={{ label: "Limpar busca", onClick: onClear }}
      />,
    );

    expect(screen.getByTestId("empty-state-illustration")).toHaveAttribute(
      "data-empty-state-kind",
      "patients",
    );
    expect(screen.getByTestId("empty-state-illustration")).toHaveAttribute(
      "data-empty-state-mode",
      "no-results",
    );
    expect(screen.getByRole("heading", { name: "Nenhum paciente encontrado" })).toBeInTheDocument();
    expect(screen.getByText("Tente ajustar a busca.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar busca" })).toBeInTheDocument();
  });
});
