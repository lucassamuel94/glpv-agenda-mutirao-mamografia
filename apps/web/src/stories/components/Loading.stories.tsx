import type { Meta, StoryObj } from "@storybook/nextjs";
import Loading from "@/components/Loading";

const meta: Meta<typeof Loading> = {
  title: "Components/Loading",
  component: Loading,
  tags: ["autodocs"],
  argTypes: {
    fullScreen: { control: "boolean" },
    message: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {
  args: {
    message: "Carregando...",
    fullScreen: false,
  },
};

export const CustomMessage: Story = {
  args: {
    message: "Buscando dados...",
    fullScreen: false,
  },
};

export const FullScreen: Story = {
  args: {
    message: "Carregando...",
    fullScreen: true,
  },
  decorators: [
    (Story) => (
      <div style={{ height: "400px", border: "1px dashed #ccc" }}>
        <Story />
      </div>
    ),
  ],
};
