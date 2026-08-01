import type { Meta, StoryObj } from "@storybook/nextjs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Label> = {
  title: "UI Base/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Label text",
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="Enter username" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="agree" />
      <Label htmlFor="agree">I agree to the terms and conditions</Label>
    </div>
  ),
};
