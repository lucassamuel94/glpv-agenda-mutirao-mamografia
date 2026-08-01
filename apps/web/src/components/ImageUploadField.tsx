"use client";

import React, { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { useForm } from "@/components/Form";

interface ImageUploadFieldProps {
  name: string;
  label: string;
  helper?: string;
}

/** Upload simples de imagem persistida como data URL até existir storage próprio. */
export function ImageUploadField({
  name,
  label,
  helper = "PNG, JPG ou SVG",
}: ImageUploadFieldProps) {
  const { watch, setValue } = useForm<Record<string, unknown>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const watchedValue = watch(name);
  const value = typeof watchedValue === "string" ? watchedValue : "";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setValue(name, reader.result, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-auto w-full items-center gap-3 rounded-lg border border-dashed border-input bg-card px-3 py-3 text-left transition-colors hover:border-primary hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted bg-cover bg-center"
          style={value ? { backgroundImage: `url(${value})` } : undefined}
        >
          {!value && <ImagePlus size={18} className="text-muted-foreground" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {value ? "Imagem selecionada" : "Selecionar imagem"}
          </span>
          <span className="block text-xs text-muted-foreground">{helper}</span>
        </span>
      </button>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={label}
        onChange={handleChange}
      />
    </div>
  );
}
