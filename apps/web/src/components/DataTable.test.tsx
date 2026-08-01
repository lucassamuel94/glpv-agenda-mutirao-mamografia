import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";

describe("DataTable", () => {
  it("expõe rótulos e estrutura compacta quando configurada para empilhar", () => {
    render(
      <DataTable.Root responsive="stack" data-testid="table">
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
            <DataTable.HeaderCell>Status</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          <DataTable.Row>
            <DataTable.Cell mobileLabel="Nome" mobileSpan="full">
              Ada Lovelace
            </DataTable.Cell>
            <DataTable.Cell mobileLabel="Status">Ativa</DataTable.Cell>
          </DataTable.Row>
        </DataTable.Body>
      </DataTable.Root>,
    );

    expect(screen.getByTestId("table")).toHaveAttribute(
      "data-responsive",
      "stack",
    );
    expect(screen.getByText("Ada Lovelace").closest("td")).toHaveAttribute(
      "data-mobile-label",
      "Nome",
    );
  });

  it("ordena por botão operável por teclado e publica aria-sort", () => {
    const onSort = vi.fn();
    render(
      <DataTable.Root>
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell
              sortable
              sortKey="name"
              currentSort={{ sortBy: "name", sortOrder: "ASC" }}
              onSort={onSort}
            >
              Nome
            </DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
      </DataTable.Root>,
    );

    const columnHeader = screen.getByRole("columnheader", { name: /Nome/i });
    const sortButton = screen.getByRole("button", {
      name: /Ordenar por Nome/i,
    });

    expect(columnHeader).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(sortButton);
    expect(onSort).toHaveBeenCalledWith("name", "DESC");
  });
});
