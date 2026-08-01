// components/MaskedInput.tsx
"use client";

import React, { memo, useState, useEffect, InputHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import { useMaskito } from "@maskito/react";
import type { MaskitoOptions } from "@maskito/core";
import { Input as InputUI } from "@/components/ui/input";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { validateStandaloneField } from "./_shared/validateStandaloneField";
import { cn } from "@/lib/utils";

// Tipos de máscara disponíveis
export type MaskType =
  | "year"
  | "zipcode"
  | "cpf"
  | "cnpj"
  | "cpf-cnpj"
  | "license-plate"
  | "license-plate-brazil"
  | "license-plate-mercosul"
  | "date-dd-mm-yyyy"
  | "date-dd-mm-yy"
  | "weight-kg"
  | "phone"
  | "phone-9digits"
  | "monetary"
  | "time"
  | "rntrc"
  | "cnh_number"
  | "number"
  | "credit-card";

interface MaskedInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  type?: MaskType;
  options?: MaskitoOptions;
  name: string; // Campo obrigatório para integração com React Hook Form
  required?: boolean;
  label?: string;
  placeholder?: string;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
  };
  // Novas opções de customização
  showMask?: boolean; // Se deve mostrar a máscara visual
  maskChar?: string; // Caractere para preencher a máscara visual
  // Opções para campos monetários
  prefix?: string; // Prefixo para campos monetários (ex: "R$ ")
  suffix?: string; // Sufixo para campos monetários (ex: " BRL")
  icon?: React.ReactNode; // Ícone para o input
  iconPosition?: "start" | "end"; // Posição do ícone (padrão: "start")
  // ✅ Props opcionais para modo standalone (não controlado)
  value?: string | number; // Se fornecido fora de Form, usa modo standalone
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

// Função auxiliar para criar configuração monetária
const createMonetaryConfig = (
  prefix: string = "",
  suffix: string = "",
): MaskitoOptions => ({
  mask: (elementState) => {
    const currentValue = elementState.value;

    // Se já tem formatação, conta os dígitos para manter a máscara
    if (currentValue.includes(",")) {
      const totalDigits = currentValue.replace(/[^\d]/g, "").length;
      const integerDigits = totalDigits - 2;

      const mask: (RegExp | string)[] = [];

      // Adiciona prefixo
      if (prefix) {
        for (const char of prefix) {
          mask.push(char);
        }
      }

      // Constrói máscara para parte inteira
      for (let i = 0; i < integerDigits; i++) {
        mask.push(/\d/);
        // Adiciona pontos de separação
        const remainingDigits = integerDigits - i - 1;
        if (remainingDigits > 0 && remainingDigits % 3 === 0) {
          mask.push(".");
        }
      }

      mask.push(",", /\d/, /\d/);

      // Adiciona sufixo
      if (suffix) {
        for (const char of suffix) {
          mask.push(char);
        }
      }

      return mask;
    }

    // Para entrada inicial (apenas dígitos), usa máscara simples
    const simpleMask: (RegExp | string)[] = [];

    // Adiciona prefixo
    if (prefix) {
      for (const char of prefix) {
        simpleMask.push(char);
      }
    }

    // Adiciona dígitos
    for (let i = 0; i < 15; i++) {
      simpleMask.push(/\d/);
    }

    // Adiciona sufixo
    if (suffix) {
      for (const char of suffix) {
        simpleMask.push(char);
      }
    }

    return simpleMask;
  },
  preprocessors: [
    ({ data, elementState }) => {
      // Se o valor já está formatado, preserva
      if (elementState.value.includes(",") && data.includes(",")) {
        return { data, elementState };
      }

      // Remove prefixo e sufixo para obter apenas dígitos
      let cleanData = data;
      if (prefix) {
        cleanData = cleanData.replace(prefix, "");
      }
      if (suffix) {
        cleanData = cleanData.replace(suffix, "");
      }

      // Para novos dígitos, apenas remove não-numéricos
      return {
        data: cleanData.replace(/[^\d]/g, "").slice(0, 15),
        elementState,
      };
    },
  ],
  postprocessors: [
    ({ value, selection }) => {
      const digitsOnly = value.replace(/[^\d]/g, "");

      if (digitsOnly.length === 0) return { value: "", selection };

      // Preenche com zeros à esquerda para ter pelo menos 3 dígitos
      const paddedValue = digitsOnly.padStart(3, "0");

      // Separa parte inteira dos centavos
      const integerPart = paddedValue.slice(0, -2);
      const centsPart = paddedValue.slice(-2);

      // Remove zeros à esquerda da parte inteira (exceto se for zero)
      const cleanInteger = integerPart.replace(/^0+/, "") || "0";

      // Adiciona separadores de milhar
      const formattedInteger = cleanInteger.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ".",
      );

      const newValue = `${prefix}${formattedInteger},${centsPart}${suffix}`;

      return {
        value: newValue,
        selection: [newValue.length, newValue.length],
      };
    },
  ],
});

// Bandeira do cartão (detecção por BIN)
export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "elo"
  | "hipercard"
  | null;

// Prefixos BIN comuns da Elo (principais faixas)
const ELO_PREFIXES = [
  "636368",
  "438935",
  "504175",
  "50904",
  "50905",
  "50906",
  "50907",
  "5062",
  "65048",
  "65049",
  "6505",
  "6506",
  "6507",
  "6508",
  "6509",
  "65165",
  "65500",
  "65501",
  "65502",
  "65503",
  "65504",
  "65505",
  "401178",
  "401179",
  "431274",
  "451416",
  "457393",
  "457631",
  "457632",
  "457633",
  "457634",
  "457635",
  "457636",
  "457637",
  "457638",
  "50473",
  "50497",
  "50623",
  "50624",
  "50625",
  "50626",
  "50627",
  "50670",
  "50671",
  "50672",
  "50673",
  "50674",
  "50675",
  "50676",
  "50900",
  "50999",
];

/** Detecta a bandeira do cartão pelos primeiros dígitos (BIN). */
export function getCardBrand(digits: string): CardBrand {
  const d = digits.replace(/\D/g, "");
  if (d.length < 2) return null;
  if (/^4/.test(d)) return "visa";
  if (/^3[47]/.test(d)) return "amex";
  if (
    /^5[1-5]/.test(d) ||
    /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(d)
  )
    return "mastercard";
  if (ELO_PREFIXES.some((prefix) => d.startsWith(prefix))) return "elo";
  if ((d.startsWith("38") || d.startsWith("60")) && d.length >= 6)
    return "hipercard";
  return null;
}

export const CARD_BRAND_LABEL: Record<NonNullable<CardBrand>, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  elo: "Elo",
  hipercard: "Hipercard",
};

/**
 * Máscara dd/mm/aaaa — FONTE ÚNICA.
 * Reutilizada por `maskConfigs["date-dd-mm-yyyy"]` (abaixo) E pelo modo editável
 * do `DatePicker`, que importa esta const em vez de redeclarar o array.
 */
export const DATE_DD_MM_YYYY_MASK: (RegExp | string)[] = [
  /\d/,
  /\d/,
  "/",
  /\d/,
  /\d/,
  "/",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

// Configurações de máscara para cada tipo
const maskConfigs: Record<MaskType, MaskitoOptions> = {
  year: {
    mask: /^\d{0,4}$/,
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/\D/g, "").slice(0, 4),
        elementState,
      }),
    ],
  },
  zipcode: {
    mask: [/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/],
  },
  cpf: {
    mask: [
      /\d/,
      /\d/,
      /\d/,
      ".",
      /\d/,
      /\d/,
      /\d/,
      ".",
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
    ],
  },
  cnpj: {
    mask: [
      /\d/,
      /\d/,
      ".",
      /\d/,
      /\d/,
      /\d/,
      ".",
      /\d/,
      /\d/,
      /\d/,
      "/",
      /\d/,
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
    ],
  },
  "cpf-cnpj": {
    // Máscara dinâmica que se adapta ao tamanho do input
    mask: (elementState) => {
      const digits = elementState.value.replace(/\D/g, "");
      if (digits.length <= 11) {
        return [
          /\d/,
          /\d/,
          /\d/,
          ".",
          /\d/,
          /\d/,
          /\d/,
          ".",
          /\d/,
          /\d/,
          /\d/,
          "-",
          /\d/,
          /\d/,
        ];
      }
      return [
        /\d/,
        /\d/,
        ".",
        /\d/,
        /\d/,
        /\d/,
        ".",
        /\d/,
        /\d/,
        /\d/,
        "/",
        /\d/,
        /\d/,
        /\d/,
        /\d/,
        "-",
        /\d/,
        /\d/,
      ];
    },
  },
  "license-plate": {
    mask: (elementState) => {
      const value = elementState.value
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();

      // Detecta no 5º dígito (posição 4)
      if (value.length >= 5) {
        const fifthChar = value[4];

        // Se o 5º dígito é número (0-9) = padrão brasileiro
        if (/[0-9]/.test(fifthChar)) {
          return [
            /[A-Za-z]/,
            /[A-Za-z]/,
            /[A-Za-z]/,
            "-",
            /\d/,
            /\d/,
            /\d/,
            /\d/,
          ];
        }
        // Se o 5º dígito é letra (A-Z) = padrão Mercosul
        else if (/[A-Z]/.test(fifthChar)) {
          return [
            /[A-Za-z]/,
            /[A-Za-z]/,
            /[A-Za-z]/,
            /\d/,
            /[A-Za-z]/,
            /\d/,
            /\d/,
          ];
        }
      }

      // Padrão padrão brasileiro (enquanto digita)
      return [/[A-Za-z]/, /[A-Za-z]/, /[A-Za-z]/, "-", /\d/, /\d/, /\d/, /\d/];
    },
    preprocessors: [
      ({ data, elementState }) => ({
        // Converte para maiúsculas e mantém apenas letras e números
        data: data.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
        elementState,
      }),
    ],
  },
  "license-plate-brazil": {
    mask: [/[A-Za-z]/, /[A-Za-z]/, /[A-Za-z]/, "-", /\d/, /\d/, /\d/, /\d/],
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
        elementState,
      }),
    ],
  },
  "license-plate-mercosul": {
    mask: [/[A-Za-z]/, /[A-Za-z]/, /[A-Za-z]/, /\d/, /[A-Za-z]/, /\d/, /\d/],
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
        elementState,
      }),
    ],
  },
  "date-dd-mm-yyyy": {
    mask: DATE_DD_MM_YYYY_MASK,
  },
  "date-dd-mm-yy": {
    mask: [/\d/, /\d/, "/", /\d/, /\d/, "/", /\d/, /\d/],
  },
  "weight-kg": {
    mask: [/\d/, /\d/, /\d/, /\d/, ",", /\d/, /\d/, " ", "k", "g"],
  },
  phone: {
    mask: (elementState) => {
      const value = elementState.value.replace(/[^\d]/g, "");

      // Se tem 10 dígitos = formato antigo (11) 9999-9999
      if (value.length <= 10) {
        return [
          "(",
          /\d/,
          /\d/,
          ")",
          " ",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          "-",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
        ];
      }
      // Se tem 11 dígitos = formato novo (11) 99999-9999
      else {
        return [
          "(",
          /\d/,
          /\d/,
          ")",
          " ",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          "-",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
        ];
      }
    },
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/[^\d]/g, ""),
        elementState,
      }),
    ],
  },
  "phone-9digits": {
    mask: [
      "(",
      /\d/,
      /\d/,
      ")",
      " ",
      /\d/,
      /\d/,
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
      /\d/,
      /\d/,
    ],
  },
  "credit-card": (() => {
    const maxDigitsDefault = 16;
    const maxDigitsAmex = 15;
    const formatWithSpaces = (digits: string, isAmex: boolean): string => {
      if (isAmex) {
        // Amex: 0000 000000 00000
        const g1 = digits.slice(0, 4);
        const g2 = digits.slice(4, 10);
        const g3 = digits.slice(10, 15);
        return [g1, g2, g3].filter(Boolean).join(" ");
      }
      // Demais: 0000 0000 0000 0000
      const parts: string[] = [];
      for (let i = 0; i < digits.length; i += 4) {
        parts.push(digits.slice(i, i + 4));
      }
      return parts.join(" ");
    };
    return {
      mask: (elementState: { value: string }) => {
        const value = elementState.value.replace(/\D/g, "");
        const isAmex = value.startsWith("34") || value.startsWith("37");
        if (isAmex) {
          return [
            /\d/,
            /\d/,
            /\d/,
            /\d/,
            " ",
            /\d/,
            /\d/,
            /\d/,
            /\d/,
            /\d/,
            /\d/,
            " ",
            /\d/,
            /\d/,
            /\d/,
            /\d/,
            /\d/,
          ];
        }
        return [
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          " ",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          " ",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
          " ",
          /\d/,
          /\d/,
          /\d/,
          /\d/,
        ];
      },
      preprocessors: [
        ({ data, elementState }) => {
          const digits = data.replace(/\D/g, "");
          const current = elementState.value.replace(/\D/g, "");
          const isAmex = current.startsWith("34") || current.startsWith("37");
          const maxLen = isAmex ? maxDigitsAmex : maxDigitsDefault;
          const allowed = digits.slice(0, Math.max(0, maxLen - current.length));
          return { data: allowed, elementState };
        },
      ],
      postprocessors: [
        ({ value, selection }) => {
          const digits = value.replace(/\D/g, "");
          if (digits.length === 0)
            return { value: "", selection: [0, 0] as [number, number] };
          const isAmex = digits.startsWith("34") || digits.startsWith("37");
          const maxLen = isAmex ? maxDigitsAmex : maxDigitsDefault;
          const truncated = digits.slice(0, maxLen);
          const formatted = formatWithSpaces(truncated, isAmex);
          // Só altera quando precisar truncar; senão preserva selection para não pular o cursor
          if (formatted !== value) {
            const sel = Math.min(selection[1], formatted.length);
            return {
              value: formatted,
              selection: [sel, sel] as [number, number],
            };
          }
          return { value, selection };
        },
      ],
    };
  })(),
  monetary: createMonetaryConfig(), // Versão padrão sem prefixo/sufixo
  time: {
    mask: [/\d/, /\d/, ":", /\d/, /\d/],
  },
  rntrc: {
    mask: [/\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/],
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/\D/g, "").slice(0, 8),
        elementState,
      }),
    ],
  },
  cnh_number: {
    mask: [/\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/],
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/\D/g, "").slice(0, 11),
        elementState,
      }),
    ],
  },
  number: {
    mask: /^\d+(,\d*)?$/,
    preprocessors: [
      ({ data, elementState }) => ({
        data: data.replace(/[^\d,]/g, ""),
        elementState,
      }),
    ],
  },
};

// Placeholders padrão para cada tipo
const defaultPlaceholders: Record<MaskType, string> = {
  year: "2024",
  zipcode: "00000-000",
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  "cpf-cnpj": "CPF ou CNPJ",
  "license-plate": "ABC-1234",
  "license-plate-brazil": "ABC-1234",
  "license-plate-mercosul": "ABC1D23",
  "date-dd-mm-yyyy": "DD/MM/AAAA",
  "date-dd-mm-yy": "DD/MM/AA",
  "weight-kg": "0,00 kg",
  phone: "(11) 9999-9999",
  "phone-9digits": "(11) 99999-9999",
  monetary: "0,00",
  time: "HH:MM",
  rntrc: "00000000",
  cnh_number: "12345678901",
  number: "0,00",
  "credit-card": "0000 0000 0000 0000",
};

// Função para criar máscaras visuais customizadas
const createVisualMask = (
  maskType: MaskType,
  maskChar: string = "_",
): string => {
  const visualMasks: Record<MaskType, string> = {
    year: "____",
    zipcode: `${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}${maskChar}`,
    cpf: `${maskChar}${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}`,
    cnpj: `${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}/${maskChar}${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}`,
    "cpf-cnpj": `${maskChar}${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}.${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}`,
    "license-plate": `${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}${maskChar}${maskChar}`,
    "license-plate-brazil": `${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}${maskChar}${maskChar}`,
    "license-plate-mercosul": `${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}`,
    "date-dd-mm-yyyy": `${maskChar}${maskChar}/${maskChar}${maskChar}/${maskChar}${maskChar}${maskChar}${maskChar}`,
    "date-dd-mm-yy": `${maskChar}${maskChar}/${maskChar}${maskChar}/${maskChar}${maskChar}`,
    "weight-kg": `${maskChar}${maskChar}${maskChar}${maskChar},${maskChar}${maskChar} kg`,
    phone: `(${maskChar}${maskChar}) ${maskChar}${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}${maskChar}${maskChar}`,
    "phone-9digits": `(${maskChar}${maskChar}) ${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}-${maskChar}${maskChar}${maskChar}${maskChar}`,
    monetary: `${maskChar}${maskChar},${maskChar}${maskChar}`,
    time: `${maskChar}${maskChar}:${maskChar}${maskChar}`,
    rntrc: `${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}`,
    cnh_number: `${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}`,
    number: `${maskChar}${maskChar},${maskChar}${maskChar}`,
    "credit-card": `${maskChar}${maskChar}${maskChar}${maskChar} ${maskChar}${maskChar}${maskChar}${maskChar} ${maskChar}${maskChar}${maskChar}${maskChar} ${maskChar}${maskChar}${maskChar}${maskChar}`,
  };

  return visualMasks[maskType];
};

/**
 * MaskedInput - Componente de input com máscara que integra com React Hook Form
 *
 * Exemplo de uso:
 * ```tsx
 * <Form onSubmit={handleSubmit}>
 *   <MaskedInput
 *     type="cpf"
 *     name="documento"
 *     label="CPF"
 *     required
 *     showMask={true}
 *     maskChar="_"
 *   />
 *
 *   <MaskedInput
 *     type="phone"
 *     name="telefone"
 *     label="Telefone"
 *     required
 *   />
 * </Form>
 * ```
 */
export const MaskedInput = memo(function MaskedInput({
  type = "number",
  options,
  name,
  required,
  validation,
  label,
  placeholder,
  showMask = false,
  maskChar = "_",
  className,
  prefix = "",
  suffix = "",
  helpTip,
  infoText,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur: controlledOnBlur,
  ...rest
}: MaskedInputProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string | number>(
    controlledValue !== undefined ? controlledValue : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // Usa a máscara do tipo ou a opção customizada
  // Para campo monetário, aplica prefixo e sufixo
  const maskOptions =
    options ||
    (type === "monetary"
      ? createMonetaryConfig(prefix, suffix)
      : maskConfigs[type]);
  const inputRef = useMaskito({ options: maskOptions });

  // Define o placeholder baseado nas configurações
  let finalPlaceholder = placeholder || defaultPlaceholders[type];

  // Para campo monetário, inclui prefixo e sufixo no placeholder
  if (type === "monetary" && !placeholder) {
    finalPlaceholder = `${prefix}0,00${suffix}`;
  }

  // Se showMask estiver ativado, usa a máscara visual
  if (showMask && type !== "number" && type !== "year") {
    if (type === "monetary") {
      finalPlaceholder = `${prefix}${maskChar}${maskChar},${maskChar}${maskChar}${suffix}`;
    } else {
      finalPlaceholder = createVisualMask(type, maskChar);
    }
  }

  // Classe CSS customizada para cor da máscara
  const customClassName = showMask
    ? `${className || ""} [&::placeholder]:text-gray-400`.trim()
    : className;

  // ✅ Modo standalone (sem Form/react-hook-form)
  if (!isControlled) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      setLocalError(validateStandaloneField(newValue, { required, validation }));
      controlledOnChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      controlledOnBlur?.(e);
    };

    const displayValue =
      typeof localValue === "number" || typeof localValue === "string"
        ? localValue
        : "";
    const digits = String(displayValue).replace(/\D/g, "");
    const cardBrand = type === "credit-card" ? getCardBrand(digits) : null;

    const standaloneInput = (
      <InputUI
        {...rest}
        name={name}
        placeholder={finalPlaceholder}
        className={cn(
          "w-full",
          type === "credit-card" && cardBrand && "pr-24",
          localError &&
            "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
          customClassName,
        )}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={rest.disabled}
        ref={inputRef}
      />
    );

    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="text"
        hasError={!!localError}
        errors={
          localError
            ? ({ [name]: { message: localError } } as any)
            : ({} as any)
        }
      >
        {type === "credit-card" ? (
          <div className="relative flex w-full items-center">
            {standaloneInput}
            {cardBrand && (
              <span
                className="pointer-events-none absolute right-3 text-sm font-medium text-muted-foreground"
                aria-hidden
              >
                {CARD_BRAND_LABEL[cardBrand]}
              </span>
            )}
          </div>
        ) : (
          standaloneInput
        )}
      </FormControl>
    );
  }

  // ✅ Modo controlado (dentro de Form/react-hook-form)
  return (
    <Controller
      name={name}
      control={control!}
      rules={rules}
      render={({ field: { onChange, onBlur, value, ref } }) => {
        const displayValue =
          typeof value === "number" || typeof value === "string" ? value : "";
        const digits = String(displayValue).replace(/\D/g, "");
        const cardBrand = type === "credit-card" ? getCardBrand(digits) : null;

        const inputElement = (
          <InputUI
            {...rest}
            name={name}
            placeholder={finalPlaceholder}
            className={cn(
              "w-full h-10_ py-2_",
              type === "credit-card" && cardBrand && "pr-24",
              hasError &&
                "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
              customClassName,
            )}
            value={displayValue}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            onBlur={(e) => {
              onBlur();
              controlledOnBlur?.(e);
            }}
            disabled={isSubmitting || rest.disabled}
            ref={(el) => {
              // Aplica o ref do Maskito
              inputRef(el);
              // Aplica o ref do Controller
              if (typeof ref === "function") {
                ref(el);
              } else if (ref && "current" in ref) {
                (
                  ref as React.MutableRefObject<HTMLInputElement | null>
                ).current = el;
              }
            }}
          />
        );

        return (
          <FormControl
            name={name}
            label={label}
            required={required}
            helpTip={helpTip}
            infoText={infoText}
            type="text"
            hasError={hasError}
            errors={errors}
          >
            {type === "credit-card" ? (
              <div className="relative flex w-full items-center">
                {inputElement}
                {cardBrand && (
                  <span
                    className="pointer-events-none absolute right-3 text-sm font-medium text-muted-foreground"
                    aria-hidden
                  >
                    {CARD_BRAND_LABEL[cardBrand]}
                  </span>
                )}
              </div>
            ) : (
              inputElement
            )}
          </FormControl>
        );
      }}
    />
  );
});
