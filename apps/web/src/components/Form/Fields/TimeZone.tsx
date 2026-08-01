"use client";

import { useMemo } from "react";
import { Combobox } from "./Combobox";

// Lista básica de fusos horários (pode ser expandida ou carregada de um arquivo JSON)
const timezones = [
  { label: "America/Sao_Paulo", tzCode: "America/Sao_Paulo" },
  { label: "America/New_York", tzCode: "America/New_York" },
  { label: "America/Los_Angeles", tzCode: "America/Los_Angeles" },
  { label: "Europe/London", tzCode: "Europe/London" },
  { label: "Europe/Paris", tzCode: "Europe/Paris" },
  { label: "Asia/Tokyo", tzCode: "Asia/Tokyo" },
  { label: "Asia/Shanghai", tzCode: "Asia/Shanghai" },
  { label: "Australia/Sydney", tzCode: "Australia/Sydney" },
  // Adicione mais conforme necessário
];

interface TimeZoneProps {
  label?: string;
  name?: string;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: { custom?: (value: unknown) => boolean | string };
  disabled?: boolean;
  required?: boolean;
}

export function TimeZone({
  label = "Fuso Horário",
  name = "timeZone",
  helpTip,
  infoText,
  validation,
  disabled,
  required,
  ...props
}: TimeZoneProps) {
  const timeZones = useMemo(() => {
    return timezones
      .map((objeto) => {
        const { label, tzCode } = objeto;
        return {
          label: label.replace(/_/g, " "),
          value: tzCode,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  return (
    <Combobox
      options={timeZones}
      name={name}
      label={label}
      placeholder="Selecione..."
      searchPlaceholder="Buscar fuso..."
      emptyText="Nenhum fuso encontrado."
      helpTip={helpTip}
      infoText={infoText}
      validation={validation}
      disabled={disabled}
      required={required}
      {...props}
    />
  );
}
