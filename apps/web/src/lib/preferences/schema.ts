/**
 * Schema de preferências de UI do usuário.
 *
 * Fonte canônica do que é armazenado por usuário. Cada feature que precisa
 * persistir preferência tipada por path pode declarar seu shape aqui — assim
 * TS pega erros de digitação no path e o autocomplete funciona via
 * dot-notation.
 *
 * Estrutura hierárquica:
 *   pref.<userId>.<module>.<panel>.<key>
 *
 * ⚠️ PONTO DE CUSTOMIZAÇÃO POR PROJETO: vazio no template — cada projeto-filho
 * adiciona aqui os namespaces do seu domínio (ex.: `contacts.filters`).
 * Consumidores com paths arbitrários (ex.: `DateRangePicker` usa
 * "filters.dateRange") não dependem deste schema: usam a sobrecarga genérica
 * de `usePreference<T>(path, fallback)`.
 *
 * Storage atual: localStorage. A interface `PreferenceStorage` permite trocar
 * por backend (sync entre máquinas) sem mexer em consumidor.
 *
 * @module lib/preferences/schema
 */

export interface PreferenceSchema {
  // adicione aqui os namespaces tipados do seu domínio.
}

/**
 * Defaults usados quando o usuário ainda não tem preferência salva para um
 * path tipado do schema acima. Vazio até o schema ganhar namespaces.
 */
export const PREFERENCE_DEFAULTS: PreferenceSchema = {};

/**
 * Tipo utilitário que extrai o tipo do valor para um path no schema.
 *
 * Ex.: `PathValue<"filters.dateRange">` → `DateRangeFilter`.
 *
 * Limitação: apenas paths de até 4 níveis (suficiente para o schema atual).
 * Adicionar mais se o schema crescer.
 */
export type PathValue<P extends string> =
  P extends `${infer A}.${infer B}.${infer C}.${infer D}`
    ? A extends keyof PreferenceSchema
      ? B extends keyof PreferenceSchema[A]
        ? C extends keyof PreferenceSchema[A][B]
          ? D extends keyof PreferenceSchema[A][B][C]
            ? PreferenceSchema[A][B][C][D]
            : never
          : never
        : never
      : never
    : P extends `${infer A}.${infer B}.${infer C}`
      ? A extends keyof PreferenceSchema
        ? B extends keyof PreferenceSchema[A]
          ? C extends keyof PreferenceSchema[A][B]
            ? PreferenceSchema[A][B][C]
            : never
          : never
        : never
      : never;
