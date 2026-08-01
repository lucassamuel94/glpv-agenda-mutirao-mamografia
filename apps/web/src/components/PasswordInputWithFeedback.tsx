"use client";

import React, { useState } from "react";
import { Check, Circle, Eye, EyeOff, Keyboard } from "lucide-react";
import { Input } from "@/components/Form";
import { useForm } from "@/components/Form";

interface PasswordInputWithFeedbackProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  showRequirements?: boolean;
}

const REQUIREMENTS = [
  {
    id: "length",
    label: "Pelo menos 8 caracteres",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Uma letra maiúscula",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Uma letra minúscula",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Um número",
    test: (value: string) => /\d/.test(value),
  },
] as const;

export function PasswordInputWithFeedback({
  name,
  label,
  required,
  placeholder,
  showRequirements = true,
}: PasswordInputWithFeedbackProps) {
  const { watch } = useForm<Record<string, unknown>>();
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const watchedValue = watch(name);
  const password = typeof watchedValue === "string" ? watchedValue : "";

  const updateCapsLockState = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "CapsLock") {
      setCapsLockOn((current) => !current);
      return;
    }
    setCapsLockOn(
      typeof event.getModifierState === "function" &&
        event.getModifierState("CapsLock"),
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          name={name}
          label={label}
          type={showPassword ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          className="pr-10"
          onFocus={() => setCapsLockOn(false)}
          onKeyDown={updateCapsLockState}
          onKeyUp={updateCapsLockState}
          onBlur={() => setCapsLockOn(false)}
        />
        <button
          type="button"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-2 top-8 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showPassword ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Eye size={16} aria-hidden="true" />
          )}
        </button>
      </div>

      {showRequirements && (
        <div
          aria-label="Requisitos da senha"
          className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            A senha precisa conter:
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {REQUIREMENTS.map((requirement) => {
              const met = requirement.test(password);
              return (
                <div
                  key={requirement.id}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    met
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {met ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Circle size={10} aria-hidden="true" />
                  )}
                  <span>{requirement.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {capsLockOn && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <Keyboard size={14} aria-hidden="true" />
          Caps Lock está ativado
        </div>
      )}
    </div>
  );
}
