import type { Meta, StoryObj } from "@storybook/nextjs";
import AppBrand, { AppBrandMark } from "@/components/AppBrand";

const meta: Meta<typeof AppBrand> = {
  title: "Components/AppBrand",
  component: AppBrand,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AppBrand>;

/** Logo completo whitelabel: mark de 28px + wordmark. Uso: Sidebar expandida. */
export const Default: Story = {};

/** Variante `tile`, no tamanho padrão de 28px (`h-7`). */
export const MarkTile: Story = {
  render: () => <AppBrandMark variant="tile" className="h-7" />,
};

/** Variante `plain`, ampliada para 36px (`h-9`) sem trocar o ativo da marca. */
export const MarkPlain: Story = {
  render: () => (
    <div className="text-foreground">
      <AppBrandMark variant="plain" className="h-9" />
    </div>
  ),
};

/** Escala compacta: padrão `h-7` e alternativa `h-9`. */
export const Tamanhos: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <AppBrandMark variant="tile" className="h-7" />
      <AppBrandMark variant="tile" className="h-9" />
      <AppBrandMark variant="plain" className="h-7" />
      <AppBrand />
    </div>
  ),
};
