"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof DateInput> = {
  title: "UI Base/DateInput",
  component: DateInput,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DateInput>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date>(new Date());
    return (
      <div className="flex flex-col gap-2">
        <Label>Select a date</Label>
        <DateInput value={date} onChange={setDate} />
        <p className="text-sm text-muted-foreground">
          Selected: {date.toLocaleDateString()}
        </p>
      </div>
    );
  },
};
