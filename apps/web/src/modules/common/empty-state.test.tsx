import { describe, expect, it } from "vitest";
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
});
