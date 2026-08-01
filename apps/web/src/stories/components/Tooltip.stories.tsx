import type { Meta, StoryObj } from "@storybook/nextjs";
import { Tooltip } from "@/components/Tooltip";
import { Button } from "@/components/Button";
import { Info } from "lucide-react";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Texto do tooltip">
      <Button variant="secondary">Hover aqui</Button>
    </Tooltip>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip content="Informação adicional sobre este campo">
      <Info size={16} className="text-muted-foreground cursor-help" />
    </Tooltip>
  ),
};
