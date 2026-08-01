import type { Meta, StoryObj } from "@storybook/nextjs";
import { Avatar } from "@/components/Avatar";
import { UserRound } from "lucide-react";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "xxl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=1",
    alt: "Maria Silva",
    size: "md",
  },
};

export const WithInitials: Story = {
  args: {
    alt: "Carlos Andrade",
    size: "md",
  },
};

export const WithIcon: Story = {
  args: {
    size: "md",
    failbackIcon: <UserRound size={20} />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar alt="João Lima" size="sm" />
      <Avatar alt="João Lima" size="md" />
      <Avatar alt="João Lima" size="lg" />
      <Avatar alt="João Lima" size="xl" />
      <Avatar alt="João Lima" size="xxl" />
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="Ana Costa" size="sm" />
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="Ana Costa" size="md" />
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="Ana Costa" size="lg" />
    </div>
  ),
};

export const FallbackInitials: Story = {
  args: {
    alt: "Roberto Mendes",
    size: "lg",
    initialMax: 2,
  },
};
