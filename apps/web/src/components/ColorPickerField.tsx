"use client";

import React, { useRef, useState } from "react";
import { Check, Pipette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "@/components/Form";

const COLOR_PALETTE = [
  "#4f46e5",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#334155",
  "#0f172a",
] as const;

interface ColorPickerFieldProps {
  name: string;
  label: string;
  defaultColor?: string;
  helpTip?: string;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToHsv(hex: string): [number, number, number] {
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return [hue, max ? (delta / max) * 100 : 0, max * 100];
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const s = saturation / 100;
  const v = value / 100;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = v - chroma;
  const rgb =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  return `#${rgb
    .map((channel) =>
      Math.round((channel + match) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function ColorPickerField({
  name,
  label,
  defaultColor = "#4f46e5",
  helpTip = "Escolha a cor principal da interface",
}: ColorPickerFieldProps) {
  const { watch, setValue: setFormValue } = useForm<Record<string, unknown>>();
  const [open, setOpen] = useState(false);
  const watchedValue = watch(name);
  const color = isHexColor(watchedValue) ? watchedValue : defaultColor;
  const [hue, setHue] = useState(() => hexToHsv(color)[0]);
  const [saturation, setSaturation] = useState(() => hexToHsv(color)[1]);
  const [brightness, setBrightness] = useState(() => hexToHsv(color)[2]);
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const selectColor = (nextColor: string) => {
    const [nextHue, nextSaturation, nextValue] = hexToHsv(nextColor);
    setHue(nextHue);
    setSaturation(nextSaturation);
    setBrightness(nextValue);
    setFormValue(name, nextColor, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const selectFromSaturation = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextSaturation = Math.min(
      100,
      Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100),
    );
    const nextValue = Math.min(
      100,
      Math.max(0, (1 - (event.clientY - bounds.top) / bounds.height) * 100),
    );
    setSaturation(nextSaturation);
    setBrightness(nextValue);
    selectColor(hsvToHex(hue, nextSaturation, nextValue));
  };

  const selectFromHue = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextHue = Math.min(
      360,
      Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 360),
    );
    setHue(nextHue);
    selectColor(hsvToHex(nextHue, saturation, brightness));
  };

  return (
    <div className="space-y-1">
      <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`${label}: ${color.toUpperCase()}`}
            className="flex h-12 w-full items-center gap-3 rounded-lg border border-input bg-card px-3 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden="true"
              className="size-7 shrink-0 rounded-md border border-black/10 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">
                {color.toUpperCase()}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {helpTip}
              </span>
            </span>
            <Pipette size={16} className="shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-4" align="start">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Cor principal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione uma cor da paleta ou escolha uma personalizada.
            </p>
          </div>

          <div className="grid grid-cols-6 gap-2" aria-label="Paleta de cores">
            {COLOR_PALETTE.map((paletteColor) => {
              const selected =
                color.toLowerCase() === paletteColor.toLowerCase();
              return (
                <button
                  key={paletteColor}
                  type="button"
                  aria-label={`Selecionar cor ${paletteColor}`}
                  aria-pressed={selected}
                  onClick={() => selectColor(paletteColor)}
                  className="relative flex size-8 items-center justify-center rounded-md border border-black/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: paletteColor }}
                >
                  {selected && (
                    <Check size={15} className="text-white drop-shadow" />
                  )}
                </button>
              );
            })}
          </div>

          <div
            ref={saturationRef}
            role="slider"
            tabIndex={0}
            aria-label="Saturação e brilho"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(saturation)}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              selectFromSaturation(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                selectFromSaturation(event);
              }
            }}
            className="relative h-36 cursor-crosshair touch-none overflow-hidden rounded-lg border border-black/10"
            style={{ backgroundColor: `hsl(${hue} 100% 50%)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
              style={{ left: `${saturation}%`, bottom: `${brightness}%` }}
            />
          </div>

          <div
            ref={hueRef}
            role="slider"
            tabIndex={0}
            aria-label="Matiz"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hue)}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              selectFromHue(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                selectFromHue(event);
              }
            }}
            className="relative h-3 cursor-pointer touch-none rounded-full border border-black/10"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
              style={{ left: `${(hue / 360) * 100}%`, backgroundColor: color }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Personalizada
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {color.toUpperCase()}
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
