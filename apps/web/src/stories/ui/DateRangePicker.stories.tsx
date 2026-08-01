"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { DateRangePicker } from "@/components/ui/date-range-picker";

const meta: Meta<typeof DateRangePicker> = {
  title: "UI Base/DateRangePicker",
  component: DateRangePicker,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => (
    <DateRangePicker
      initialDateFrom={new Date(new Date().setDate(new Date().getDate() - 7))}
      initialDateTo={new Date()}
      onUpdate={(values) => {
        console.log("Date range updated:", values);
      }}
      showCompare={false}
    />
  ),
};

export const WithCompare: Story = {
  render: () => (
    <DateRangePicker
      initialDateFrom={new Date(new Date().setDate(new Date().getDate() - 30))}
      initialDateTo={new Date()}
      onUpdate={(values) => {
        console.log("Date range updated:", values);
      }}
      showCompare={true}
    />
  ),
};

export const ShortFormat: Story = {
  render: () => (
    <DateRangePicker
      initialDateFrom={new Date(new Date().setDate(new Date().getDate() - 7))}
      initialDateTo={new Date()}
      dateFormat="short"
      showCompare={false}
    />
  ),
};

export const WithMaxRange: Story = {
  render: () => (
    <DateRangePicker
      initialDateFrom={new Date(new Date().setDate(new Date().getDate() - 7))}
      initialDateTo={new Date()}
      maxRangeDays={31}
      showCompare={false}
    />
  ),
};
