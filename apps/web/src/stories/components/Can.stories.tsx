import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Can } from "@/components/Can";
import { Button } from "@/components/Button";
import { AuthContext } from "@/hooks/use-auth";

/**
 * Provider mockado: entrega só o que Can/RequirePermission consomem.
 * O cast é deliberado — stories não exercitam o resto do contrato.
 */
const mockAuth = (perms: string[]) =>
  ({
    hasPermission: (required: string[]) => required.some((p) => perms.includes(p)),
    isHydrated: true,
    isLoading: false,
  }) as unknown as React.ContextType<typeof AuthContext>;

const withAuth = (perms: string[]) => {
  const AuthDecorator = (Story: React.ComponentType) => (
    <AuthContext.Provider value={mockAuth(perms)}>
      <Story />
    </AuthContext.Provider>
  );
  return AuthDecorator;
};

const meta: Meta<typeof Can> = {
  title: "Components/Can",
  component: Can,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Can>;

export const Permitido: Story = {
  decorators: [withAuth(["reports"])],
  render: () => (
    <Can perm="reports">
      <Button>Exportar relatório</Button>
    </Can>
  ),
};

export const NegadoSemFallback: Story = {
  decorators: [withAuth([])],
  render: () => (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        Gate fechado sem fallback: o botão abaixo não renderiza.
      </p>
      <Can perm="reports">
        <Button>Exportar relatório</Button>
      </Can>
    </div>
  ),
};

export const NegadoComFallback: Story = {
  decorators: [withAuth([])],
  render: () => (
    <Can perm="admin" fallback={<Button disabled>Sem permissão</Button>}>
      <Button>Configurações avançadas</Button>
    </Can>
  ),
};

export const AnyOf: Story = {
  decorators: [withAuth(["users"])],
  render: () => (
    <Can anyOf={["admin", "users"]}>
      <Button>Gerenciar usuários</Button>
    </Can>
  ),
};
