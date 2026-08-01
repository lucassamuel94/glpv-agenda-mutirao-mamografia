"use client";

import React, {
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FormProvider,
  useForm as useFormHook,
  UseFormReturn,
  useFormContext,
  FieldValues,
} from "react-hook-form";

import { z } from "zod";
import { SchemaContext, useSchema } from "./hooks/useSchema";

// Importa do shared para evitar dependência circular com Fields
import {
  RequiredFieldsContext,
  useRegisterRequiredField,
  Label,
} from "./shared";

// Re-export useSchema
export { useSchema };

// Re-export do shared (mantém API pública)
export { RequiredFieldsContext, useRegisterRequiredField, Label };

// Tipo para o retorno da validação
export interface ValidationResult<T = Record<string, unknown>> {
  success: boolean;
  data: T | null;
  errors: Record<string, unknown> | null;
}

// Tipo estendido para o Form ref
export interface FormRef<
  T extends FieldValues = FieldValues,
> extends UseFormReturn<T> {
  validateAndGetData: () => Promise<ValidationResult<T>>;
  isValid: boolean;
  forceValidation: () => Promise<void>;
}

// Utilitário para filtrar props válidas por tag do DOM, evitando repassar props
// customizadas para elementos nativos e eliminando warnings de propriedades desconhecidas
// Removido: utilitário de filtragem de props DOM (somente usado na versão antiga de FormField)

/**
 * Props para o componente Form
 */
interface FormProps {
  children: React.ReactNode;
  ref?: React.RefObject<HTMLFormElement>;
  id?: string; // ID do formulário (útil para botões externos com form attribute)
  omitFields?: string[];
  className?: string;
  // onSave?: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  showDefaultButtons?: boolean;
  isLoading?: boolean;
  defaultValues?: Record<string, unknown>;
  mode?: "onSubmit" | "onChange";
  Buttons?:
    | React.ComponentType<Record<string, unknown>>
    | React.ReactNode
    | null;
  schema?: z.ZodSchema;
  onSubmit: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  onValidationChange?: (
    isValid: boolean,
    errors?: Record<string, unknown>,
  ) => void;
  errors?: {
    message?: string;
    errors?: Record<string, string>;
  };
  /**
   * `true` renderiza um `<div>` no lugar da tag `<form>` nativa — TODO o
   * resto (FormProvider, `watch`, ref imperativo, validação) continua igual,
   * só a tag HTML muda. Uso: `DynamicFieldsForm`, que é sempre um CONSUMIDOR
   * do react-hook-form (via `formRef.current.watch(...)`), nunca dispara
   * `handleSubmit` sozinho (`onSubmit={() => {}}`) e é reaproveitado DENTRO
   * de outro `<Form>` (`ContactForm`/`CompanyForm`, seção "Campos
   * Customizados").
   *
   * Sem isto, `<form>` dentro de `<form>` é HTML INVÁLIDO (a spec não
   * permite `<form>` aninhado) — e concretamente quebra o Enter-para-enviar:
   * pressionar Enter dentro de um campo customizado dispara o `submit` do
   * form INTERNO (o mais próximo na árvore), que roda o `onSubmit={() => {}}`
   * (no-op) e o `handleSubmit` do react-hook-form já chama
   * `preventDefault()` — o Enter nunca chega a acionar o submit do form
   * EXTERNO, que é o que o usuário espera. `DynamicFieldsForm` nunca
   * precisou de uma tag `<form>` própria (não tem botão de submit escopado a
   * ele em lugar nenhum); precisa só do `FormProvider`.
   */
  disableFormElement?: boolean;
}

export const Form = forwardRef<FormRef, FormProps>(
  (
    {
      children,
      className,
      id,
      // onSave,
      onCancel,
      omitFields = [],
      saveText = "Salvar",
      cancelText = "Cancelar",
      showDefaultButtons = true,
      isLoading = false,
      defaultValues,
      schema,
      onSubmit,
      errors,
      mode = "onSubmit",
      onChange,
      onValidationChange,
      Buttons,
      disableFormElement = false,
    },
    ref,
  ) => {
    const methods = useFormHook({
      mode: mode ?? "onChange",
      reValidateMode: "onChange",
      defaultValues:
        omitFields.length > 0
          ? Object.fromEntries(
              Object.entries(defaultValues || {}).filter(
                ([key]) => !omitFields.includes(key),
              ),
            )
          : defaultValues || {},
    });

    const watchedValues = methods.watch();

    // Duas refs, não uma. Antes, os dois efeitos abaixo (validação de
    // obrigatórios e onChange) compartilhavam a mesma ref — o efeito de
    // validação roda primeiro (é declarado primeiro) e já mutava a ref para
    // o valor atual, então o efeito de onChange nunca via divergência e
    // nunca disparava. Cada efeito agora tem sua própria "última foto" do
    // valor, e não pisa na do outro.
    const previousValidationValuesRef = useRef<string | undefined>(undefined);

    const [isFormValid, setIsFormValid] = useState(false);
    const [requiredFields, setRequiredFields] = useState<Set<string>>(
      new Set(),
    );
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const valuesString = useMemo(
      () => JSON.stringify(watchedValues),
      [watchedValues],
    );

    // Inicializada com o valor JÁ ATUAL do primeiro render (não `undefined`),
    // de propósito: o contrato do `onChange` é reportar MUDANÇA a partir de
    // uma interação, não o snapshot do mount. Com `undefined`, o efeito
    // abaixo sempre veria "mudou" na primeira execução e dispararia
    // `onChange` assim que o form montasse, mesmo sem o usuário ter tocado
    // em nada. `useRef` só usa este argumento no primeiro render, então isso
    // não recalcula a cada render.
    const previousChangeValuesRef = useRef<string>(valuesString);

    const registerRequiredField = useCallback((fieldName: string) => {
      setRequiredFields((prev) => new Set(prev).add(fieldName));
    }, []);

    const checkRequiredFieldsFilled = useCallback(() => {
      try {
        const formValues = methods.getValues();

        if (requiredFields.size === 0) {
          setIsFormValid(true);
          if (onValidationChange) {
            onValidationChange(true, {});
          }
          return;
        }

        const allRequiredFilled = Array.from(requiredFields).every(
          (fieldName) => {
            const value = formValues[fieldName];
            return (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              String(value).trim() !== ""
            );
          },
        );

        setIsFormValid(allRequiredFilled);

        if (onValidationChange) {
          onValidationChange(allRequiredFilled, {});
        }
      } catch (error) {
        console.warn("Erro ao verificar campos obrigatórios:", error);
        setIsFormValid(false);
        if (onValidationChange) {
          onValidationChange(false, {});
        }
      }
    }, [methods, onValidationChange, requiredFields]);

    /**
     * Assinatura da validação = valores + QUAIS campos são obrigatórios.
     *
     * Os campos obrigatórios só se registram (`registerRequiredField`) DEPOIS
     * do primeiro render, então `requiredFields` muda sem que nenhum valor
     * mude. Comparando só `valuesString`, a sequência do mount era:
     *
     *   render 1 → guarda passa (ref `undefined`), agenda o timeout com o
     *   conjunto de obrigatórios AINDA VAZIO, e marca a ref;
     *   campos registram → effect re-roda → o cleanup CANCELA aquele timeout, e
     *   a guarda falha (ref já igual a `valuesString`) → nada é reagendado.
     *
     * Com o formulário já preenchido (toda tela de edição) o usuário não digita
     * nada, `valuesString` nunca muda, e a checagem simplesmente nunca rodava —
     * `isValid` ficava preso no `false` inicial. Incluir o conjunto de
     * obrigatórios na assinatura faz o registro dos campos ser, ele próprio, um
     * motivo para revalidar.
     *
     * Ordenado antes de serializar: `Set` preserva ordem de inserção, e a ordem
     * de montagem dos campos não é contrato — sem o `sort`, dois mounts com os
     * mesmos obrigatórios em ordem diferente pareceriam assinaturas distintas.
     */
    const validationSignature = useMemo(
      () => `${valuesString}|${Array.from(requiredFields).sort().join(",")}`,
      [valuesString, requiredFields],
    );

    useEffect(() => {
      if (previousValidationValuesRef.current !== validationSignature) {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        validationTimeoutRef.current = setTimeout(() => {
          checkRequiredFieldsFilled();
        }, 300);

        previousValidationValuesRef.current = validationSignature;
      }

      return () => {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
      };
    }, [validationSignature, checkRequiredFieldsFilled]);

    useEffect(() => {
      if (onChange && typeof onChange === "function") {
        if (previousChangeValuesRef.current !== valuesString) {
          previousChangeValuesRef.current = valuesString;
          onChange(watchedValues);
        }
      }
    }, [valuesString, onChange, watchedValues]);

    useEffect(() => {
      if (errors?.message) {
        alert(errors?.message);
      }
    }, [errors?.message]);

    useImperativeHandle(
      ref,
      () => ({
        ...methods,
        validateAndGetData: async () => {
          const isValid = await methods.trigger();
          if (isValid) {
            return {
              success: true,
              data: methods.getValues(),
              errors: null,
            };
          } else {
            return {
              success: false,
              data: null,
              errors: methods.formState.errors,
            };
          }
        },
        isValid: isFormValid,
        forceValidation: async () => checkRequiredFieldsFilled(),
      }),
      [methods, isFormValid, checkRequiredFieldsFilled],
    );

    const formBody = (
      <>
        <div className="flex-1 space-y-4 pb-4">
          <div className="flex-1 space-y-4">{children}</div>

          {showDefaultButtons && (
            <>
              <Separator />
              <div className="flex items-center justify-end gap-2 mt-auto pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : saveText}
                </Button>
              </div>
            </>
          )}
        </div>
        {Buttons && typeof Buttons === "function" ? (
          <Buttons onSubmit={methods.handleSubmit(onSubmit)} />
        ) : (
          Buttons
        )}
      </>
    );

    return (
      <SchemaContext.Provider value={schema || null}>
        <RequiredFieldsContext.Provider value={registerRequiredField}>
          <FormProvider {...methods}>
            {disableFormElement ? (
              // Sem tag `<form>` — ver docstring de `disableFormElement`.
              // `type="submit"` dos botões acima não tem form nenhum para
              // escopar aqui (não é um problema: quem usa este modo, como
              // `DynamicFieldsForm`, sempre passa `showDefaultButtons={false}`
              // e não usa `Buttons`).
              <div id={id} className={className}>
                {formBody}
              </div>
            ) : (
              <form
                id={id}
                onSubmit={methods.handleSubmit(onSubmit)}
                className={className}
              >
                {formBody}
              </form>
            )}
          </FormProvider>
        </RequiredFieldsContext.Provider>
      </SchemaContext.Provider>
    );
  },
);

Form.displayName = "Form";

export function useForm<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): UseFormReturn<T> {
  return useFormContext<T>();
}

export function useFormValidation<
  T extends Record<string, unknown> = Record<string, unknown>,
>() {
  const methods = useFormContext<T>();

  const validateAndGetData = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      return {
        success: true as const,
        data: methods.getValues(),
        errors: null,
      };
    } else {
      return {
        success: false as const,
        data: null,
        errors: methods.formState.errors,
      };
    }
  };

  return {
    validateAndGetData,
    ...methods,
  };
}

export interface ValidationProps {
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean | string;
}

export const getValidationRules = (validation: ValidationProps | undefined) => {
  const rules: Record<string, unknown> = {};

  if (validation) {
    if (validation.pattern) {
      rules.pattern = {
        value: validation.pattern,
        message: "Formato inválido",
      };
    }

    if (validation.min !== undefined) {
      rules.min = {
        value: validation.min,
        message: `Valor mínimo: ${validation.min}`,
      };
    }

    if (validation.max !== undefined) {
      rules.max = {
        value: validation.max,
        message: `Valor máximo: ${validation.max}`,
      };
    }

    if (validation.minLength !== undefined) {
      rules.minLength = {
        value: validation.minLength,
        message: `Mínimo ${validation.minLength} caracteres`,
      };
    }

    if (validation.maxLength !== undefined) {
      rules.maxLength = {
        value: validation.maxLength,
        message: `Máximo ${validation.maxLength} caracteres`,
      };
    }

    if (validation.custom) {
      rules.validate = validation.custom;
    }
  }

  return rules;
};

export { Input } from "./Fields/Input";
export { TextArea as Textarea, TextArea } from "./Fields/TextArea";
export { Select } from "./Fields/Select";
export { Checkbox } from "./Fields/Checkbox";
export { Switch } from "./Fields/Switch";
export { DatePicker } from "./Fields/DatePicker";
export { RadioGroup } from "./Fields/RadioGroup";
export { Combobox } from "./Fields/Combobox";
export { TimePicker } from "./Fields/TimePicker";
export { HiddenUuid } from "./Fields/HiddenUuid";
export { TimeZone } from "./Fields/TimeZone";
export { Days } from "./Fields/Days";
export { NumberInput } from "./Fields/NumberInput";
export { ComboboxMultiple } from "./Fields/ComboboxMultiple";
export { MultiSelect, MultiSelectCustom } from "./Fields/MultiSelect";
export { MaskedInput } from "./Fields/MaskedInput";
export { useFieldValidation } from "./hooks/useFieldValidation";
export { useFormContextSafe } from "./Fields/_shared/useFormContextSafe";
export default Form;
