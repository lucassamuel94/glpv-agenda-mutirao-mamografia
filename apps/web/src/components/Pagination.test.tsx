import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Pagination from "./Pagination";

describe("Pagination", () => {
  it("não ocupa espaço quando existe somente uma página", () => {
    const { container } = render(
      <Pagination
        pagination={{
          page: 1,
          limit: 20,
          total: 8,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("permite manter a paginação visível em demonstrações", () => {
    render(
      <Pagination
        pagination={{
          page: 1,
          limit: 20,
          total: 8,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }}
        alwaysVisible
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
  });

  it("oferece navegação anterior e próxima com nome acessível", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={{
          page: 2,
          limit: 20,
          total: 52,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        }}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });
});
