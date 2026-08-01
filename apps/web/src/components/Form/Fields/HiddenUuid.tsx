"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

// Função simples para gerar UUID v4
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface HiddenUuidProps {
  name: string;
}

export function HiddenUuid({ name }: HiddenUuidProps) {
  const { register, setValue, getValues } = useFormContext();

  useEffect(() => {
    if (!getValues(name)) {
      setValue(name, uuidv4(), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [name, getValues, setValue]);

  return <input type="hidden" {...register(name)} />;
}
