/**
 * Validação centralizada para campos em modo standalone (sem Form/react-hook-form).
 *
 * Usada por Input e MaskedInput no modo não controlado para manter
 * as mesmas regras de validação manual em um único lugar.
 *
 * @returns mensagem de erro ou null se válido
 */
export type StandaloneValidation = {
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean | string;
};

export function validateStandaloneField(
  value: string,
  options: {
    required?: boolean;
    validation?: StandaloneValidation;
  },
): string | null {
  const { required, validation } = options;

  if (required && !value.trim()) {
    return "Campo obrigatório";
  }

  if (validation?.pattern && !validation.pattern.test(value)) {
    return "Formato inválido";
  }

  if (validation?.minLength && value.length < validation.minLength) {
    return `Mínimo ${validation.minLength} caracteres`;
  }

  if (validation?.maxLength && value.length > validation.maxLength) {
    return `Máximo ${validation.maxLength} caracteres`;
  }

  if (validation?.custom) {
    const result = validation.custom(value);
    if (result !== true) {
      return typeof result === "string" ? result : "Valor inválido";
    }
  }

  return null;
}
