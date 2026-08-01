"use client";

import { ComboboxMultiple } from "./ComboboxMultiple";

const listOptions = [
  { label: "Segunda-feira", value: "Monday" },
  { label: "Terça-feira", value: "Tuesday" },
  { label: "Quarta-feira", value: "Wednesday" },
  { label: "Quinta-feira", value: "Thursday" },
  { label: "Sexta-feira", value: "Friday" },
  { label: "Sábado", value: "Saturday" },
  { label: "Domingo", value: "Sunday" },
];

interface DaysProps {
  name: string;
  label?: string;
  options?: Array<{ label: string; value: string }>;
  className?: string;
  required?: boolean;
  max?: number;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: { custom?: (value: unknown) => boolean | string };
  disabled?: boolean;
}

export function Days({
  name,
  label,
  options = listOptions,
  className = "w-full",
  required = false,
  max,
  helpTip,
  infoText,
  validation,
  disabled,
}: DaysProps) {
  return (
    <ComboboxMultiple
      name={name}
      label={label}
      options={options}
      className={className}
      required={required}
      max={max}
      helpTip={helpTip}
      infoText={infoText}
      validation={validation}
      disabled={disabled}
    />
  );
}

export function DaysSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="pt-1 pb-2">
        <div className="w-12 h-2 rounded-lg bg-neutral/20" />
      </div>
      <div className="h-9 py-2 bg-neutral/5 w-full rounded-lg px-3 flex items-center justify-end select cursor-default" />
    </div>
  );
}
