import type { Meta, StoryObj } from "@storybook/nextjs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof RadioGroup> = {
  title: "UI Base/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-three" id="option-three" />
        <Label htmlFor="option-three">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="gap-4">
      <div className="flex items-start gap-3">
        <RadioGroupItem value="default" id="r-default" className="mt-0.5" />
        <div>
          <Label htmlFor="r-default">Default</Label>
          <p className="text-sm text-muted-foreground">4px padding on all sides.</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="comfortable" id="r-comfortable" className="mt-0.5" />
        <div>
          <Label htmlFor="r-comfortable">Comfortable</Label>
          <p className="text-sm text-muted-foreground">8px padding on all sides.</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <RadioGroupItem value="compact" id="r-compact" className="mt-0.5" />
        <div>
          <Label htmlFor="r-compact">Compact</Label>
          <p className="text-sm text-muted-foreground">2px padding on all sides.</p>
        </div>
      </div>
    </RadioGroup>
  ),
};
