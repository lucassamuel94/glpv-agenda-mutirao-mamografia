import type { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta = {
  title: "Design Tokens/Typography",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Headings: Story = {
  render: () => (
    <div className="space-y-4 max-w-xl">
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h1 — font-semibold, tracking: -0.022em, line-height: 1.3</p>
        <h1 className="text-4xl">Heading 1</h1>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h2</p>
        <h2 className="text-3xl">Heading 2</h2>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h3</p>
        <h3 className="text-2xl">Heading 3</h3>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h4</p>
        <h4 className="text-xl">Heading 4</h4>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h5</p>
        <h5 className="text-lg">Heading 5</h5>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">h6</p>
        <h6 className="text-base">Heading 6</h6>
      </div>
    </div>
  ),
};

export const BodyText: Story = {
  render: () => (
    <div className="space-y-4 max-w-xl">
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">text-sm — body default, tracking: -0.011em, line-height: 1.6</p>
        <p className="text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">text-xs — small text</p>
        <p className="text-xs">Texto auxiliar menor, usado em help tips e labels secundários.</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">text-base — larger body</p>
        <p className="text-base">Texto maior para parágrafos de destaque e leitura confortável.</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1 font-mono">text-muted-foreground — muted text</p>
        <p className="text-sm text-muted-foreground">Texto com cor reduzida para informações secundárias.</p>
      </div>
    </div>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <div className="space-y-3 max-w-xl">
      <p className="text-base font-light">Font Light (300)</p>
      <p className="text-base font-normal">Font Normal (400)</p>
      <p className="text-base font-medium">Font Medium (500)</p>
      <p className="text-base font-semibold">Font Semibold (600)</p>
      <p className="text-base font-bold">Font Bold (700)</p>
      <p className="text-base font-extrabold">Font Extrabold (800)</p>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="space-y-3 max-w-xl">
      {[
        { name: "--spacing-xs", value: "0.5rem (8px)" },
        { name: "--spacing-sm", value: "0.75rem (12px)" },
        { name: "--spacing-md", value: "1rem (16px)" },
        { name: "--spacing-lg", value: "1.5rem (24px)" },
        { name: "--spacing-xl", value: "2rem (32px)" },
        { name: "--spacing-2xl", value: "3rem (48px)" },
      ].map((token) => (
        <div key={token.name} className="flex items-center gap-3">
          <div
            className="bg-primary/20 rounded"
            style={{ width: `var(${token.name})`, height: "24px" }}
          />
          <div>
            <p className="text-sm font-medium font-mono">{token.name}</p>
            <p className="text-xs text-muted-foreground">{token.value}</p>
          </div>
        </div>
      ))}
    </div>
  ),
};
