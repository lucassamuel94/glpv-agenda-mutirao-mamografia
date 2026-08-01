/**
 * usePreference — hook React orientado a `useState`.
 *
 * Casa naturalmente com componentes existentes:
 *
 *   const [filters, setFilters] = usePreference(
 *     "filters.dateRange",
 *     DEFAULT_DATE_RANGE,
 *   );
 *
 * Características:
 *   - Lê do storage no mount (sem flicker em hidratação SSR: usa o
 *     fallback até primeiro effect).
 *   - Subscreve mudanças via EventTarget — múltiplos consumers do mesmo
 *     path ficam em sync sem props drilling.
 *   - Trocar de userId no Provider acorda todos os consumers (re-lê).
 *
 * @module lib/preferences/use-preference
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPreference,
  setPreference,
  subscribePreference,
  usePreferenceUserId,
} from "./preferences";
import type { PathValue } from "./schema";

/**
 * Sobrecargas para tipagem:
 *  - Path tipado no schema → tipo do valor inferido automaticamente.
 *  - Path arbitrário (string) → caller passa o tipo via generic.
 */
export function usePreference<P extends string>(
  path: P,
  fallback: PathValue<P>,
): [PathValue<P>, (next: PathValue<P>) => void];

export function usePreference<T>(
  path: string,
  fallback: T,
): [T, (next: T) => void];

export function usePreference<T>(
  path: string,
  fallback: T,
): [T, (next: T) => void] {
  const userId = usePreferenceUserId();

  // Lazy initial state — lê do storage NO PRIMEIRO RENDER (não num
  // useEffect posterior). Crítico: sem isso, o primeiro paint mostra
  // sempre o fallback (ex.: { from: null, to: null }), e só após o useEffect o estado
  // hidrata — provoca "painel vazio por uma fração de segundo" e bugs
  // onde o caller deriva visibilidade do estado (renderiza empty state
  // antes de hidratar).
  const [value, setValue] = useState<T>(() =>
    getPreference<T>(path, fallback),
  );

  // Store EXTERNO (preferences em storage) com subscribe/unsubscribe: ler o
  // valor atual e assinar mudanças é sincronização com sistema externo, o uso
  // legítimo do efeito. O ideal moderno seria `useSyncExternalStore`; migrar
  // para ele é refactor próprio, não um ajuste de regra de lint.
  useEffect(() => {
    // Re-hidrata quando o `path` ou `userId` mudam (troca de login).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getPreference<T>(path, fallback));
    const onChange = () => setValue(getPreference<T>(path, fallback));
    const unsubPath = subscribePreference(path, onChange);
    const unsubUser = subscribePreference("*", onChange);
    return () => {
      unsubPath();
      unsubUser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, userId]);

  const set = useCallback(
    (next: T) => {
      setValue(next); // otimista — UI responde imediatamente
      setPreference(path, next); // grava + notifica outros consumers
    },
    [path],
  );

  return [value, set];
}
