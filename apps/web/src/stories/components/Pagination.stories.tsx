import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import Pagination from "@/components/Pagination";
import type { PaginationState } from "@/hooks/use-pagination";

/** Helper para montar um `PaginationState` a partir de total/limit/page */
function buildPagination(
  total: number,
  limit: number,
  page: number,
): PaginationState {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    limit,
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description:
        "Classes extras mescladas (Tailwind-safe via `cn`) na div raiz — ex.: ajustar margem/borda quando embutido em modal/footer.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <Pagination
        pagination={buildPagination(120, 10, page)}
        onPageChange={setPage}
      />
    );
  },
};

export const FewPages: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <Pagination
        pagination={buildPagination(35, 10, page)}
        onPageChange={setPage}
      />
    );
  },
};

export const ManyPages: Story = {
  render: () => {
    const [page, setPage] = useState(5);
    return (
      <Pagination
        pagination={buildPagination(500, 10, page)}
        onPageChange={setPage}
      />
    );
  },
};

export const LastPage: Story = {
  render: () => {
    const [page, setPage] = useState(12);
    return (
      <Pagination
        pagination={buildPagination(120, 10, page)}
        onPageChange={setPage}
      />
    );
  },
};

export const LargeItemsPerPage: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <Pagination
        pagination={buildPagination(250, 25, page)}
        onPageChange={setPage}
      />
    );
  },
};

export const SinglePageDemo: Story = {
  render: () => (
    <Pagination
      pagination={buildPagination(8, 10, 1)}
      alwaysVisible
      onPageChange={() => {}}
    />
  ),
};

/** `className` extra mesclado na div raiz (cn) — ex.: sem margem-topo + borda. */
export const CustomClassName: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return (
      <Pagination
        pagination={buildPagination(120, 10, page)}
        onPageChange={setPage}
        className="mt-0 border-dashed border-primary"
      />
    );
  },
};
