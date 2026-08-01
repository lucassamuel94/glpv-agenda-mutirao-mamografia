import { useMemo } from "react";
import { useFormContextSafe } from "../Fields/_shared/useFormContextSafe";
import { useSchema } from "./useSchema";

/**
 * useFieldValidation - Hook consolidado para validação de campos
 *
 * Consolida a lógica de validação que estava duplicada em todos os campos (Input, Select, TextArea, etc.)
 * Agora suporta modo híbrido: controlado (dentro de Form) e não controlado (standalone)
 *
 * @example
 * ```tsx
 * // Modo controlado (dentro de Form)
 * <Form onSubmit={handleSubmit}>
 *   <Input name="email" required />
 * </Form>
 *
 * // Modo não controlado (standalone)
 * <Input
 *   name="search"
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 * />
 * ```
 *
 * @param name - Nome do campo (obrigatório)
 * @param required - Se true, adiciona validação de obrigatório
 * @param validation - Regras de validação customizadas
 */
export function useFieldValidation({
  name,
  required,
  validation,
}: {
  name: string;
  required?: boolean;
  validation?: Record<string, unknown>;
}) {
  // Verifica se está dentro de um Form (contexto react-hook-form)
  const { isControlled, context, control, errors, isSubmitting } =
    useFormContextSafe();

  // 🔹 TODOS os hooks devem estar no topo, antes de qualquer condicional
  const schema = useSchema();

  // Cria as rules do Zod manualmente
  const rules = useMemo(() => {
    // ✅ Se NÃO está dentro de Form, retorna vazio
    if (!isControlled) {
      return {};
    }

    const validationRules = getValidationRules(validation);

    // Adiciona regra de required se necessário
    if (required) {
      validationRules.required = "Campo obrigatório";
    }

    // Adiciona validação do Zod nas rules se houver schema
    // IMPORTANTE: Só valida com Zod se o campo tiver valor
    // Isso evita que mensagens de Zod apareçam em campos vazios
    if (schema) {
      const fieldSchema = (schema as any).shape?.[name];
      if (fieldSchema) {
        validationRules.validate = async (value: any) => {
          // Se o campo está vazio, não valida com Zod
          // (deixa o "required" do react-hook-form lidar com isso)
          if (value === "" || value === null || value === undefined) {
            return true;
          }

          try {
            // Valida apenas este campo com Zod
            await fieldSchema.parseAsync(value);
            return true;
          } catch (err: any) {
            // Retorna a mensagem de erro do Zod
            return (
              err.issues?.[0]?.message ||
              err.errors?.[0]?.message ||
              "Valor inválido"
            );
          }
        };
      }
    }

    return validationRules;
  }, [name, required, validation, schema, isControlled]);

  // Se NÃO está dentro de Form, retorna valores default
  if (!isControlled) {
    return {
      isControlled: false,
      control: null,
      hasError: false,
      rules: {},
      errors: {},
      isSubmitting: false,
    };
  }

  // 🔹 A partir daqui: GARANTIA de estar em Form
  // Verifica se há erros de validação
  const hasError = !!errors[name];

  return {
    isControlled: true,
    control,
    hasError,
    rules,
    errors,
    isSubmitting,
  };
}

/**
 * Converte as regras de validação customizadas do formato simples
 * para o formato do react-hook-form
 */
function getValidationRules(
  validation?: Record<string, unknown>,
): Record<string, unknown> {
  const rules: Record<string, unknown> = {};

  if (!validation) {
    return rules;
  }

  // Pattern
  if (validation.pattern && validation.pattern instanceof RegExp) {
    rules.pattern = {
      value: validation.pattern,
      message: "Formato inválido",
    };
  }

  // Min (para number)
  if (typeof validation.min === "number") {
    rules.min = {
      value: validation.min,
      message: `Mínimo ${validation.min}`,
    };
  }

  // Max (para number)
  if (typeof validation.max === "number") {
    rules.max = {
      value: validation.max,
      message: `Máximo ${validation.max}`,
    };
  }

  // MinLength (para string)
  if (typeof validation.minLength === "number") {
    rules.minLength = {
      value: validation.minLength,
      message: `Mínimo ${validation.minLength} caracteres`,
    };
  }

  // MaxLength (para string)
  if (typeof validation.maxLength === "number") {
    rules.maxLength = {
      value: validation.maxLength,
      message: `Máximo ${validation.maxLength} caracteres`,
    };
  }

  // Custom
  if (typeof validation.custom === "function") {
    rules.validate = validation.custom;
  }

  return rules;
}
