"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectGroup,
} from "@/components/ui/multi-select";

const meta: Meta<typeof MultiSelect> = {
  title: "UI Base/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
];

export const Default: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div className="w-full max-w-sm">
        <MultiSelect values={values} onValuesChange={setValues}>
          <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder="Select frameworks..." />
          </MultiSelectTrigger>
          <MultiSelectContent>
            <MultiSelectGroup heading="Frameworks">
              {frameworks.map((fw) => (
                <MultiSelectItem key={fw.value} value={fw.value}>
                  {fw.label}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
        {values.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Selected: {values.join(", ")}
          </p>
        )}
      </div>
    );
  },
};

export const SingleMode: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div className="w-full max-w-sm">
        <MultiSelect values={values} onValuesChange={setValues} single>
          <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder="Select one framework..." />
          </MultiSelectTrigger>
          <MultiSelectContent>
            {frameworks.map((fw) => (
              <MultiSelectItem key={fw.value} value={fw.value}>
                {fw.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    );
  },
};
