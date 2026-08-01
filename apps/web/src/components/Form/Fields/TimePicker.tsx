"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input as InputUI } from "@/components/ui/input";

import { FormControl } from "./_shared/FormControl";
import { useFormContextSafe } from "./_shared/useFormContextSafe";

export type TimePickerProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  validation?: { custom?: (value: unknown) => boolean | string };
  // ✅ Novos props opcionais para modo standalone (fora de <Form>)
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
};

export const TimePicker = memo(function TimePicker({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione o horário",
  className,
  disabled,
  validation,
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange: controlledOnValueChange,
}: TimePickerProps) {
  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string>(
    // Normaliza p/ HH:MM — valores TIME do banco chegam como "HH:MM:SS"
    controlledValue !== undefined ? controlledValue.slice(0, 5) : "",
  );
  const [isOpen, setIsOpen] = useState(false);

  // Sincroniza com value externo (normalizado p/ HH:MM) SEM effect: ajusta o
  // estado durante o render quando a prop muda (padrão oficial do React,
  // "you might not need an effect"). Guarda a prop anterior p/ reagir só à
  // mudança real de `controlledValue`, sem cascading render.
  const [prevControlled, setPrevControlled] = useState(controlledValue);
  if (controlledValue !== undefined && controlledValue !== prevControlled) {
    setPrevControlled(controlledValue);
    setLocalValue(controlledValue.slice(0, 5));
  }

  const { isControlled } = useFormContextSafe();

  // Memoiza hours/minutes (sempre chamado, antes de condicionais)
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i * 5),
    [],
  );

  // Se props explícitos foram passados, respeita modo standalone mesmo dentro de <Form>
  const hasExplicitControl =
    controlledValue !== undefined ||
    controlledOnChange !== undefined ||
    controlledOnValueChange !== undefined;
  const useControlledPath = isControlled && !hasExplicitControl;

  if (useControlledPath) {
    return <TimePickerControlled
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      validation={validation}
      hours={hours}
      minutes={minutes}
    />;
  }

  // ⚠️ NOVO: Modo standalone (fora de <Form>)
  // Este código NUNCA executa para campos dentro de Form

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    const [hStr = "00", mStr = "00"] = localValue.split(":");
    let h = parseInt(hStr) || 0;
    let m = parseInt(mStr) || 0;
    if (type === "hour") h = parseInt(value) || 0;
    if (type === "minute") m = parseInt(value) || 0;
    const newTime = `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
    setLocalValue(newTime);
    controlledOnChange?.(newTime);
    controlledOnValueChange?.(newTime);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length > 4) raw = raw.slice(0, 4);
    const formatted =
      raw.length >= 3 ? `${raw.slice(0, 2)}:${raw.slice(2)}` : raw;
    setLocalValue(formatted);
    controlledOnChange?.(formatted);
    controlledOnValueChange?.(formatted);
  };

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="text"
      hasError={false}
      errors={{}}
    >
      <Popover open={isOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <InputUI
              type="text"
              inputMode="numeric"
              pattern="[0-9:]*"
              maxLength={5}
              className={cn(
                "w-full pl-10 pr-3 h-10_ py-2_",
                !localValue && "text-muted-foreground",
                className,
              )}
              placeholder={placeholder}
              value={localValue}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              disabled={disabled}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-background text-foreground"
          style={{ zIndex: 999 }}
          align="start"
          onPointerDownOutside={() => setIsOpen(false)}
          onEscapeKeyDown={() => setIsOpen(false)}
        >
          <TimePickerPopoverBody
            current={localValue}
            hours={hours}
            minutes={minutes}
            onTimeChange={handleTimeChange}
          />
        </PopoverContent>
      </Popover>
    </FormControl>
  );
});

// ---------------------------------------------------------------------------
// Subcomponente interno: modo controlado (dentro de <Form>)
// ---------------------------------------------------------------------------

interface TimePickerControlledProps {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  validation?: { custom?: (value: unknown) => boolean | string };
  hours: number[];
  minutes: number[];
}

function TimePickerControlled({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder,
  className,
  disabled,
  validation,
  hours,
  minutes,
}: TimePickerControlledProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);

  const hasErrors = !!errors[name];

  const rules: Record<string, unknown> = {};
  if (required) {
    rules.required = "Campo obrigatório";
  }
  if (validation) {
    Object.assign(rules, validation);
  }

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="text"
      hasError={hasErrors}
      errors={errors}
    >
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => {
          // Normaliza p/ HH:MM — valores TIME do banco chegam como "HH:MM:SS"
          const current = (
            typeof field.value === "string" ? field.value : ""
          ).slice(0, 5);

          const handleTimeChange = (type: "hour" | "minute", value: string) => {
            const [hStr = "00", mStr = "00"] = current.split(":");
            let h = parseInt(hStr) || 0;
            let m = parseInt(mStr) || 0;
            if (type === "hour") h = parseInt(value) || 0;
            if (type === "minute") m = parseInt(value) || 0;
            const newTime = `${h.toString().padStart(2, "0")}:${m
              .toString()
              .padStart(2, "0")}`;
            field.onChange(newTime);
          };

          const handleInputChange = (
            e: React.ChangeEvent<HTMLInputElement>,
          ) => {
            let raw = e.target.value.replace(/[^0-9]/g, "");
            if (raw.length > 4) raw = raw.slice(0, 4);
            const formatted =
              raw.length >= 3 ? `${raw.slice(0, 2)}:${raw.slice(2)}` : raw;
            field.onChange(formatted);
          };

          return (
            <Popover open={isOpen}>
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <InputUI
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9:]*"
                    maxLength={5}
                    className={cn(
                      "w-full pl-10 pr-3 h-10_ py-2_",
                      !current && "text-muted-foreground",
                      hasErrors &&
                        "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                      className,
                    )}
                    placeholder={placeholder}
                    value={current}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                    disabled={disabled || isSubmitting}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-background text-foreground"
                style={{ zIndex: 999 }}
                align="start"
                onPointerDownOutside={() => setIsOpen(false)}
                onEscapeKeyDown={() => setIsOpen(false)}
              >
                <TimePickerPopoverBody
                  current={current}
                  hours={hours}
                  minutes={minutes}
                  onTimeChange={handleTimeChange}
                />
              </PopoverContent>
            </Popover>
          );
        }}
      />
    </FormControl>
  );
}

// ---------------------------------------------------------------------------
// Subcomponente interno: corpo do popover (reutilizado nos dois modos)
// ---------------------------------------------------------------------------

interface TimePickerPopoverBodyProps {
  current: string;
  hours: number[];
  minutes: number[];
  onTimeChange: (type: "hour" | "minute", value: string) => void;
}

function TimePickerPopoverBody({
  current,
  hours,
  minutes,
  onTimeChange,
}: TimePickerPopoverBodyProps) {
  return (
    <div className="flex flex-col gap-0 border border-border">
      <div className="flex items-center justify-center py-2 font-semibold text-base border-b border-border">
        Hora/Minuto
      </div>
      <div className="flex divide-x" style={{ height: "200px" }}>
        <ScrollArea className="w-32 sm:w-auto" style={{ height: "100%" }}>
          <div className="flex flex-col p-2">
            {hours.map((hour) => (
              <button
                type="button"
                key={hour}
                className={cn(
                  "sm:w-full shrink-0 aspect-square p-2",
                  current.startsWith(hour.toString().padStart(2, "0"))
                    ? "bg-primary text-primary-foreground rounded-lg"
                    : "",
                )}
                onClick={() => onTimeChange("hour", hour.toString())}
              >
                {hour.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="sm:hidden" />
        </ScrollArea>
        <ScrollArea className="w-32 sm:w-auto" style={{ height: "100%" }}>
          <div className="flex flex-col p-2">
            {minutes.map((minute) => (
              <button
                type="button"
                key={minute}
                className={cn(
                  "sm:w-full shrink-0 aspect-square p-2",
                  current.endsWith(minute.toString().padStart(2, "0"))
                    ? "bg-primary text-primary-foreground rounded-lg"
                    : "",
                )}
                onClick={() => onTimeChange("minute", minute.toString())}
              >
                {minute.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="sm:hidden" />
        </ScrollArea>
      </div>
    </div>
  );
}
