/**
 * Storage backend para preferências de usuário.
 *
 * A interface `PreferenceStorage` abstrai a persistência. Hoje só temos
 * `localStorageBackend`, mas a interface permite trocar por API backend
 * ou IndexedDB sem mexer em consumidor.
 *
 * Cada chave física no localStorage tem o formato:
 *   pref.<userId>.<path>
 *
 * Valores serializados como JSON. Falha silenciosa (try/catch) em ambientes
 * onde localStorage está bloqueado (SSR, modo privado, quota cheia).
 *
 * @module lib/preferences/storage
 */

"use client";

export interface PreferenceStorage {
  /** Lê o valor cru (JSON-parseado) ou `undefined` se não existir. */
  read(userId: string, path: string): unknown;
  /** Escreve o valor (JSON-serializado). */
  write(userId: string, path: string, value: unknown): void;
  /** Remove uma chave. */
  remove(userId: string, path: string): void;
}

function keyOf(userId: string, path: string): string {
  // Sanitiza userId — evita injeção via login com '.' no id futuro.
  const safeUser = String(userId).replace(/[^A-Za-z0-9_-]/g, "_");
  return `pref.${safeUser}.${path}`;
}

export const localStorageBackend: PreferenceStorage = {
  read(userId, path) {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = window.localStorage.getItem(keyOf(userId, path));
      if (raw == null) return undefined;
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  },
  write(userId, path, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(keyOf(userId, path), JSON.stringify(value));
    } catch {
      // quota cheia, modo privado, etc. — perda silenciosa de preferência
      // não deve quebrar a UI.
    }
  },
  remove(userId, path) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(keyOf(userId, path));
    } catch {
      /* idem */
    }
  },
};
