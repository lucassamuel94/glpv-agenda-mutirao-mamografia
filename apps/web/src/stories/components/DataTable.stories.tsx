import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

// Mock data
const users = [
  {
    id: 1,
    name: "Ana Costa",
    email: "ana@empresa.com",
    role: "Admin",
    status: "Ativo",
  },
  {
    id: 2,
    name: "Bruno Lima",
    email: "bruno@empresa.com",
    role: "Editor",
    status: "Ativo",
  },
  {
    id: 3,
    name: "Carla Mendes",
    email: "carla@empresa.com",
    role: "Viewer",
    status: "Inativo",
  },
  {
    id: 4,
    name: "Diego Rocha",
    email: "diego@empresa.com",
    role: "Editor",
    status: "Ativo",
  },
  {
    id: 5,
    name: "Elena Souza",
    email: "elena@empresa.com",
    role: "Admin",
    status: "Pendente",
  },
];

// DataTable is a namespace object, not a component — use a wrapper for Meta
function DataTableDemo(props: { children?: React.ReactNode }) {
  return <>{props.children}</>;
}

const meta: Meta<typeof DataTableDemo> = {
  title: "Components/DataTable",
  component: DataTableDemo,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTableDemo>;

export const Default: Story = {
  render: () => (
    <DataTable.Root>
      <DataTable.Header>
        <DataTable.HeaderRow>
          <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
          <DataTable.HeaderCell>Email</DataTable.HeaderCell>
          <DataTable.HeaderCell>Perfil</DataTable.HeaderCell>
          <DataTable.HeaderCell>Status</DataTable.HeaderCell>
        </DataTable.HeaderRow>
      </DataTable.Header>
      <DataTable.Body>
        {users.map((user) => (
          <DataTable.Row key={user.id}>
            <DataTable.Cell>{user.name}</DataTable.Cell>
            <DataTable.Cell>{user.email}</DataTable.Cell>
            <DataTable.Cell>{user.role}</DataTable.Cell>
            <DataTable.Cell>
              <Badge
                variant={
                  user.status === "Ativo"
                    ? "primary"
                    : user.status === "Inativo"
                      ? "destructive"
                      : "secondary"
                }
              >
                {user.status}
              </Badge>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable.Root>
  ),
};

export const WithSorting: Story = {
  render: () => {
    const [sort, setSort] = useState<{
      sortBy: string;
      sortOrder: "ASC" | "DESC";
    }>({
      sortBy: "name",
      sortOrder: "ASC",
    });

    const sorted = [...users].sort((a, b) => {
      const key = sort.sortBy as keyof typeof a;
      const cmp = String(a[key]).localeCompare(String(b[key]));
      return sort.sortOrder === "ASC" ? cmp : -cmp;
    });

    return (
      <DataTable.Root>
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell
              sortable
              sortKey="name"
              currentSort={sort}
              onSort={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
            >
              Nome
            </DataTable.HeaderCell>
            <DataTable.HeaderCell
              sortable
              sortKey="role"
              currentSort={sort}
              onSort={(sortBy, sortOrder) => setSort({ sortBy, sortOrder })}
            >
              Perfil
            </DataTable.HeaderCell>
            <DataTable.HeaderCell>Status</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          {sorted.map((user) => (
            <DataTable.Row key={user.id}>
              <DataTable.Cell>{user.name}</DataTable.Cell>
              <DataTable.Cell>{user.role}</DataTable.Cell>
              <DataTable.Cell>{user.status}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable.Body>
      </DataTable.Root>
    );
  },
};

export const WithSelectedRow: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<number | null>(2);
    return (
      <DataTable.Root>
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
            <DataTable.HeaderCell>Email</DataTable.HeaderCell>
            <DataTable.HeaderCell>Perfil</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          {users.map((user) => (
            <DataTable.Row
              key={user.id}
              selected={selectedId === user.id}
              onClick={() => setSelectedId(user.id)}
              style={{ cursor: "pointer" }}
            >
              <DataTable.Cell>{user.name}</DataTable.Cell>
              <DataTable.Cell>{user.email}</DataTable.Cell>
              <DataTable.Cell>{user.role}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable.Body>
      </DataTable.Root>
    );
  },
};

export const LoadingState: Story = {
  render: () => (
    <DataTable.Root>
      <DataTable.Header>
        <DataTable.HeaderRow>
          <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
          <DataTable.HeaderCell>Email</DataTable.HeaderCell>
          <DataTable.HeaderCell>Perfil</DataTable.HeaderCell>
        </DataTable.HeaderRow>
      </DataTable.Header>
      <DataTable.Body>
        <DataTable.SkeletonRow colSpan={3} />
        <DataTable.SkeletonRow colSpan={3} />
        <DataTable.SkeletonRow colSpan={3} />
      </DataTable.Body>
    </DataTable.Root>
  ),
};

export const ResponsiveStack: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <DataTable.Root responsive="stack">
      <DataTable.Header>
        <DataTable.HeaderRow>
          <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
          <DataTable.HeaderCell>Email</DataTable.HeaderCell>
          <DataTable.HeaderCell>Status</DataTable.HeaderCell>
        </DataTable.HeaderRow>
      </DataTable.Header>
      <DataTable.Body>
        {users.slice(0, 3).map((user) => (
          <DataTable.Row key={user.id}>
            <DataTable.Cell mobileLabel="Nome" mobileSpan="full">
              {user.name}
            </DataTable.Cell>
            <DataTable.Cell mobileLabel="Email">{user.email}</DataTable.Cell>
            <DataTable.Cell mobileLabel="Status">
              <Badge variant={user.status === "Ativo" ? "success" : "neutral"}>
                {user.status}
              </Badge>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable.Root>
  ),
};
