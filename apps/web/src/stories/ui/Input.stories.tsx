import type { Meta, StoryObj } from "@storybook/nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Input> = {
  title: "UI Base/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
    type: "text",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="john@example.com" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
    </div>
  ),
};
