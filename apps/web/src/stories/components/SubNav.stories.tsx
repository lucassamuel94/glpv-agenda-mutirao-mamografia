import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubNav } from "@/components/SubNav";

const meta: Meta<typeof SubNav> = {
  title: "Components/SubNav",
  component: SubNav,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SubNav>;

export const Default: Story = {
  name: "Navegação secundária",
  render: () => (
    <SubNav
      items={[
        { label: "Dashboard", href: "/pbx" },
        { label: "Departamentos", href: "/pbx/departments" },
        { label: "Ramais", href: "/pbx/extensions" },
        { label: "Rel. Analítico", href: "/pbx/reports/analytic" },
        { label: "Rel. Sintético", href: "/pbx/reports/synthetic" },
      ]}
    />
  ),
};
