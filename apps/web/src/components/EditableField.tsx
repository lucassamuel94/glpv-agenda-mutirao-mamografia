/**
 * EditableField
 *
 * Campo de edição in-place reutilizável (padrão extraído do Settings).
 * Nasce desabilitado mostrando o valor atual + ícone lápis (✏️) sobreposto
 * no canto direito; ao editar, o lápis vira ✓ (salvar) e ✕ (cancelar).
 * Enter = commit, Escape = cancelar.
 *
 * Puramente presentacional: não conhece Settings nem pausas; emite
 * `onCommit`/`onCancel` para o pai decidir o que fazer com o valor.
 *
 * @module components/EditableField
 */

"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Input, NumberInput } from "@/components/Form/Fields";
import { cn } from "@/lib/utils";

export interface EditableFieldProps {
  /** Tipo do input interno. default "text" */
  type?: "text" | "number";
  /** Valor commitado atual. null = sem override (mostrar displayValue) */
  value: string | number | null;
  /**
   * O que mostrar no modo leitura. Quando omitido, exibe `value`.
   * Útil para pausas: quando `value===null`, exibe o default global formatado
   * com estilo muted.
   */
  displayValue?: React.ReactNode;
  /**
   * Valor inicial do draft ao entrar em edição quando `value` é null/"".
   * Útil para pré-preencher com o default global (ex.: pausa em modo herdar):
   * o input abre com o default visível para o usuário ajustar a partir dele.
   * Importante: entrar em edição NÃO grava nada — só o ✓ (onCommit) persiste.
   * Cancelar (X/Esc) volta ao estado anterior (null).
   */
  draftSeed?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Desabilita interação e mostra estado de salvando */
  isSaving?: boolean;
  /** Borda vermelha + msg opcional */
  error?: string | null;
  maxLength?: number;
  className?: string;
  /**
   * Estilo do modo leitura:
   * - "input" (default): parece um campo (borda/bg) desabilitado — usado no Settings.
   * - "transparent": bg/borda transparentes → parece texto puro (tabela de pausas);
   *   o lápis fica a 50% de opacidade e vai a 100% no hover do campo.
   */
  readStyle?: "input" | "transparent";
  /** aria-label / altText do botão lápis. default "Editar" */
  altTextEdit?: string;
  /**
   * id repassado ao input interno. Necessário para vincular um `<label htmlFor>`
   * externo ao campo (a11y) — ex.: SettingField usa `setting-${id}`.
   */
  inputId?: string;
  /** Chamado ao confirmar (✓ ou Enter) com o valor draft atual */
  onCommit: (value: string) => void | Promise<void>;
  /** Chamado ao cancelar (✕ ou Escape). default: descarta draft e sai da edição */
  onCancel?: () => void;
}

export function EditableField({
  type = "text",
  value,
  displayValue,
  draftSeed,
  placeholder,
  disabled = false,
  required = false,
  isSaving = false,
  error = null,
  maxLength,
  className,
  readStyle = "input",
  altTextEdit = "Editar",
  inputId,
  onCommit,
  onCancel,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  // draft é sempre string internamente (input trabalha com strings)
  const [draft, setDraft] = useState<string>(
    value !== null ? String(value) : "",
  );

  const InputComponent = type === "number" ? NumberInput : Input;

  const startEdit = () => {
    if (disabled || isSaving) return;
    // Ordem de precedência do draft inicial:
    // 1. value commitado (se existir e não for vazio)
    // 2. draftSeed (default global — pré-preenche para o usuário ajustar)
    // 3. string vazia
    let initialDraft: string;
    if (value !== null && value !== "") {
      initialDraft = String(value);
    } else if (draftSeed != null) {
      initialDraft = String(draftSeed);
    } else {
      initialDraft = "";
    }
    setDraft(initialDraft);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft(value !== null ? String(value) : "");
    onCancel?.();
  };

  const handleCommit = () => {
    const result = onCommit(draft);
    if (result instanceof Promise) {
      // Caso assíncrono: só sai da edição se a Promise resolver com sucesso.
      // Se rejeitar (ex.: validação required no Settings, erro de rede),
      // permanece em edição para o usuário corrigir.
      result
        .then(() => setIsEditing(false))
        .catch(() => {
          // permanece em isEditing — o pai (TextLikeField) atualiza `error`
        });
    } else {
      // Caso síncrono simples: sai imediatamente
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  // Valor de exibição no modo leitura
  const readDisplay =
    displayValue !== undefined
      ? displayValue
      : value !== null
        ? String(value)
        : "";

  return (
    <div className={cn("group relative", className)}>
      <InputComponent
        // `key` força remount ao alternar view↔edit → autoFocus dispara no mount
        key={isEditing ? "edit" : "view"}
        id={inputId}
        name="editable-field-internal"
        value={isEditing ? draft : value !== null ? String(value) : ""}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        disabled={!isEditing || isSaving || disabled}
        autoFocus={isEditing}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "pr-20",
          // readStyle="transparent": no modo leitura, sem cara de "campo" — bg/borda
          // transparentes e opacidade cheia (parece texto). Ao editar volta ao input normal.
          readStyle === "transparent" &&
            !isEditing &&
            "!border-transparent !bg-transparent !shadow-none disabled:opacity-100 disabled:cursor-default",
          error && "!border-red-500 focus:!border-red-500",
        )}
        // Quando não está editando, exibe o displayValue se houver
        // O `displayValue` é tratado no overlay abaixo quando !== value
      />

      {/*
       * Overlay de displayValue: só necessário quando não editando E há um
       * displayValue customizado E o valor commitado é null (input mostraria
       * string vazia). Quando value !== null, o input já mostra o valor.
       */}
      {!isEditing && displayValue !== undefined && value === null && (
        <div
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center pr-20 text-sm text-muted-foreground"
          aria-hidden
        >
          {readDisplay}
        </div>
      )}

      <div className="absolute right-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              altText="Salvar"
              disabled={isSaving}
              onClick={handleCommit}
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              altText="Cancelar edição"
              disabled={isSaving}
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            altText={altTextEdit}
            disabled={disabled || isSaving}
            onClick={startEdit}
            className={cn(
              // No modo transparente o lápis fica discreto (50%) e revela no hover do campo
              readStyle === "transparent" &&
                "opacity-30 transition-opacity group-hover:opacity-100",
            )}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
