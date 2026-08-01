"use client";

import React, { memo, useState, useRef, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { MaskedInput } from "./MaskedInput";
import { getCardBrand, CARD_BRAND_LABEL } from "./MaskedInput";
import type { MaskType } from "./MaskedInput";

/**
 * SecureMaskedInput — MaskedInput com máscara visual de segurança
 *
 * Quando o campo perde o foco e está completo, exibe asteriscos
 * mostrando apenas os últimos dígitos (ex.: **** **** **** 1234).
 * O valor real continua no form para submissão.
 *
 * Para `type="credit-card"`, exibe automaticamente a bandeira detectada
 * (Visa, Mastercard, etc.) à direita do campo.
 *
 * @example
 * ```tsx
 * <SecureMaskedInput
 *   name="cardNumber"
 *   label="Número do cartão"
 *   type="credit-card"
 *   required
 *   brandFieldName="brand"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // CPF mascarado mostrando últimos 3 dígitos
 * <SecureMaskedInput
 *   name="cpf"
 *   label="CPF"
 *   type="cpf"
 *   required
 *   visibleDigits={3}
 *   minDigits={11}
 * />
 * ```
 */

export interface SecureMaskedInputProps extends React.ComponentProps<
  typeof MaskedInput
> {
  /** Quantos dígitos exibir no final (padrão: 4) */
  visibleDigits?: number;
  /** Mínimo de dígitos para considerar completo. Se omitido, usa padrões por tipo. */
  minDigits?: number;
  /** Nome do campo oculto no form para gravar a bandeira detectada (ex.: "brand"). */
  brandFieldName?: string;
}

/** Dígitos mínimos padrão por tipo de máscara */
const DEFAULT_MIN_DIGITS: Partial<Record<MaskType, number>> = {
  "credit-card": 15,
  cpf: 11,
  cnpj: 14,
  "cpf-cnpj": 11,
  phone: 10,
  "phone-9digits": 11,
  zipcode: 8,
};

export const SecureMaskedInput = memo(function SecureMaskedInput({
  visibleDigits = 4,
  minDigits,
  brandFieldName,
  name,
  label,
  required,
  type = "number",
  onBlur,
  ...rest
}: SecureMaskedInputProps) {
  const { watch, setValue } = useFormContext();
  const [isMasked, setIsMasked] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fieldValue = watch(name);
  const digits = fieldValue?.toString().replace(/\D/g, "") ?? "";
  const threshold = minDigits ?? DEFAULT_MIN_DIGITS[type] ?? 4;
  const isComplete = digits.length >= threshold;

  // Detecção da bandeira do cartão
  const cardBrand = type === "credit-card" ? getCardBrand(digits) : null;
  const brandLabel = cardBrand ? CARD_BRAND_LABEL[cardBrand] : null;

  // Preenche campo oculto do form com a bandeira detectada
  useEffect(() => {
    if (brandFieldName) {
      setValue(brandFieldName, cardBrand ?? "", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [brandFieldName, cardBrand, setValue]);

  // Monta a exibição mascarada: **** ... **** 1234
  const maskedDisplay = isComplete
    ? digits
        .slice(0, -visibleDigits)
        .replace(/./g, "*")
        .replace(/(.{4})/g, "$1 ")
        .trimEnd() +
      " " +
      digits.slice(-visibleDigits)
    : "";

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (isComplete) setIsMasked(true);
      onBlur?.(e);
    },
    [isComplete, onBlur],
  );

  const handleReveal = useCallback(() => {
    setIsMasked(false);
    requestAnimationFrame(() => {
      const input = wrapperRef.current?.querySelector(
        `input[name="${name}"]`,
      ) as HTMLInputElement | null;
      input?.focus();
    });
  }, [name]);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Campo real — fica acessível mas invisível quando mascarado */}
      <div className={isMasked ? "sr-only" : undefined}>
        <MaskedInput
          {...rest}
          name={name}
          label={label}
          required={required}
          type={type}
          onBlur={handleBlur}
        />
      </div>

      {/* Exibição mascarada com asteriscos */}
      {isMasked && (
        <div>
          {label && (
            <label className="text-sm font-medium leading-none">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          <div className="relative">
            <div
              role="button"
              tabIndex={0}
              className="mt-2 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm tracking-widest text-foreground cursor-text pr-24"
              onClick={handleReveal}
              onFocus={handleReveal}
            >
              {maskedDisplay}
            </div>
            {brandLabel && (
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                aria-hidden
              >
                {brandLabel}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
