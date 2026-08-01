import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { RequirePermission } from "@/components/RequirePermission";
import { AuthContext } from "@/hooks/use-auth";

const mockAuth = (perms: string[], opts?: { loading?: boolean }) =>
  ({
    hasPermission: (required: string[]) => required.some((p) => perms.includes(p)),
    isHydrated: !opts?.loading,
    isLoading: !!opts?.loading,
  }) as unknown as React.ContextType<typeof AuthContext>;

const withAuth = (perms: string[], opts?: { loading?: boolean }) => {
  const AuthDecorator = (Story: React.ComponentType) => (
    <AuthContext.Provider value={mockAuth(perms, opts)}>
      <Story />
    </AuthContext.Provider>
  );
  return AuthDecorator;
};

const Conteudo = () => (
  <div className="rounded-lg border p-6">Conteúdo protegido da página</div>
);

const meta: Meta<typeof RequirePermission> = {
  title: "Components/RequirePermission",
  component: RequirePermission,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof RequirePermission>;

export const Permitido: Story = {
  decorators: [withAuth(["settings"])],
  render: () => (
    <RequirePermission perm="settings">
      <Conteudo />
    </RequirePermission>
  ),
};

export const SemAcesso: Story = {
  decorators: [withAuth([])],
  render: () => (
    <RequirePermission perm="settings">
      <Conteudo />
    </RequirePermission>
  ),
};

export const Hidratando: Story = {
  decorators: [withAuth([], { loading: true })],
  render: () => (
    <RequirePermission perm="settings">
      <Conteudo />
    </RequirePermission>
  ),
};
