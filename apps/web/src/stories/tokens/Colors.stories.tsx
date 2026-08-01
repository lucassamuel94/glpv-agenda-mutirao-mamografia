import type { Meta, StoryObj } from "@storybook/nextjs";

const ColorSwatch = ({ name, cssVar, className }: { name: string; cssVar: string; className?: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-12 h-12 rounded-lg border border-border ${className || ""}`}
      style={{ backgroundColor: `hsl(var(${cssVar}))` }}
    />
    <div>
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
    </div>
  </div>
);

const meta: Meta = {
  title: "Design Tokens/Colors",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const CoreColors: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-xl">
      <ColorSwatch name="Primary" cssVar="--primary" />
      <ColorSwatch name="Primary Foreground" cssVar="--primary-foreground" />
      <ColorSwatch name="Secondary" cssVar="--secondary" />
      <ColorSwatch name="Secondary Foreground" cssVar="--secondary-foreground" />
      <ColorSwatch name="Destructive" cssVar="--destructive" />
      <ColorSwatch name="Destructive Foreground" cssVar="--destructive-foreground" />
      <ColorSwatch name="Muted" cssVar="--muted" />
      <ColorSwatch name="Muted Foreground" cssVar="--muted-foreground" />
      <ColorSwatch name="Accent" cssVar="--accent" />
      <ColorSwatch name="Accent Foreground" cssVar="--accent-foreground" />
    </div>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-xl">
      <ColorSwatch name="Background" cssVar="--background" />
      <ColorSwatch name="Foreground" cssVar="--foreground" />
      <ColorSwatch name="Card" cssVar="--card" />
      <ColorSwatch name="Card Foreground" cssVar="--card-foreground" />
      <ColorSwatch name="Popover" cssVar="--popover" />
      <ColorSwatch name="Popover Foreground" cssVar="--popover-foreground" />
    </div>
  ),
};

export const Borders: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-xl">
      <ColorSwatch name="Border" cssVar="--border" />
      <ColorSwatch name="Input" cssVar="--input" />
      <ColorSwatch name="Ring (Focus)" cssVar="--ring" />
    </div>
  ),
};

export const Sidebar: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-xl">
      <ColorSwatch name="Sidebar Background" cssVar="--sidebar-bg" />
      <ColorSwatch name="Sidebar Text" cssVar="--sidebar-text" />
      <ColorSwatch name="Sidebar Text Muted" cssVar="--sidebar-text-muted" />
    </div>
  ),
};

export const Shell: Story = {
  render: () => (
    <div className="grid max-w-xl grid-cols-2 gap-6">
      <ColorSwatch name="Shell Background" cssVar="--shell-bg" />
      <ColorSwatch name="Shell Surface" cssVar="--shell-surface" />
      <ColorSwatch name="Shell Border" cssVar="--shell-border" />
      <ColorSwatch name="Sidebar Hover" cssVar="--sidebar-hover" />
      <ColorSwatch name="Sidebar Active" cssVar="--sidebar-active" />
    </div>
  ),
};
