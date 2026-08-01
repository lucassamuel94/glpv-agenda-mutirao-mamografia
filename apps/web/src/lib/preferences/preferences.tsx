/**
 * Núcleo do sistema de preferências.
 *
 * Expõe Provider + funções de acesso. Mantém um pub/sub interno via
 * EventTarget para que múltiplos consumers da mesma chave fiquem em sync
 * sem precisar de context com mil entries.
 *
 * Por que não Context com Map<path, value>?
 *   - Re-renderizaria TODO consumidor a cada mudança em qualquer chave.
 *   - EventTarget é nativo, custo zero, escala bem com muitas chaves.
 *
 * Ciclo de vida:
 *   1. Provider recebe userId e armazena na ref do módulo.
 *   2. `usePreference(path, fallback)` lê via `getPreference` no mount,
 *      retorna `[value, setValue]`. Subscreve a mudanças no path.
 *   3. `setValue(v)` chama `setPreference(path, v)` — escreve no storage
 *      e dispara evento `change:<path>`. Outros consumers re-renderizam.
 *
 * @module lib/preferences/preferences
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { localStorageBackend, type PreferenceStorage } from "./storage";

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

interface PreferenceConfig {
  userId: string;
  storage: PreferenceStorage;
}

let config: PreferenceConfig = {
  userId: "anonymous",
  storage: localStorageBackend,
};

const bus = new EventTarget();

function eventName(path: string): string {
  return `change:${path}`;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export function getPreference<T>(path: string, fallback: T): T {
  const v = config.storage.read(config.userId, path);
  return v === undefined ? fallback : (v as T);
}

export function setPreference(path: string, value: unknown): void {
  config.storage.write(config.userId, path, value);
  bus.dispatchEvent(new Event(eventName(path)));
}

export function removePreference(path: string): void {
  config.storage.remove(config.userId, path);
  bus.dispatchEvent(new Event(eventName(path)));
}

export function subscribePreference(
  path: string,
  handler: () => void,
): () => void {
  const name = eventName(path);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}

export function getCurrentUserId(): string {
  return config.userId;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PreferenceContextValue {
  userId: string;
}

const PreferenceContext = createContext<PreferenceContextValue | null>(null);

/**
 * Envolve a árvore React e configura o sistema de preferências com o
 * userId corrente. Trocar de usuário dispara re-leitura em todos os
 * consumers (efeito de hidratação).
 *
 * `storage` é opcional — útil em testes (injetar in-memory).
 */
export function PreferenceProvider({
  userId,
  storage,
  children,
}: {
  userId: string | null | undefined;
  storage?: PreferenceStorage;
  children: ReactNode;
}) {
  const effectiveUserId = userId || "anonymous";
  const prevUserIdRef = useRef(effectiveUserId);

  // Atualiza o singleton — outras chamadas de get/setPreference passam a usar
  // o novo userId/storage. Em produção, isso roda uma vez por login.
  useMemo(() => {
    config = {
      userId: effectiveUserId,
      storage: storage ?? localStorageBackend,
    };
  }, [effectiveUserId, storage]);

  // Quando user muda (logout/login), notifica todos os consumers para
  // re-ler do novo namespace. Wildcard event — qualquer subscriber é
  // acordado com `*` (handlers individuais filtram pelo seu path).
  useEffect(() => {
    if (prevUserIdRef.current === effectiveUserId) return;
    prevUserIdRef.current = effectiveUserId;
    bus.dispatchEvent(new Event("change:*"));
  }, [effectiveUserId]);

  const value = useMemo<PreferenceContextValue>(
    () => ({ userId: effectiveUserId }),
    [effectiveUserId],
  );

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

/**
 * Hook informativo: retorna o userId corrente do provider. Raro de usar
 * direto — a maior parte do código consome via `usePreference`.
 */
export function usePreferenceUserId(): string {
  const ctx = useContext(PreferenceContext);
  return ctx?.userId ?? "anonymous";
}
