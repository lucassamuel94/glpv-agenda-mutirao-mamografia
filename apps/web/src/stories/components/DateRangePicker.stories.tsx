import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";

const meta: Meta<typeof DateRangePicker> = {
  title: "Components/DateRangePicker",
  component: DateRangePicker,
  tags: ["autodocs"],
  argTypes: {
    maxRangeDays: {
      control: "number",
      description: "Bloqueio visual do range máximo. Default 31.",
    },
    align: { control: "radio", options: ["start", "center", "end"] },
  },
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => {
    const [range, setRange] = useState<{
      start_date?: string;
      end_date?: string;
    }>({});
    return (
      <div className="p-4">
        {/* ephemeral: não persiste em usePreference (sem ruído entre stories). */}
        <DateRangePicker value={range} onValueChange={setRange} ephemeral />
        <p className="mt-3 text-xs text-muted-foreground">
          {range.start_date
            ? `${range.start_date} → ${range.end_date}`
            : "Nenhum range aplicado ainda."}
        </p>
      </div>
    );
  },
};
