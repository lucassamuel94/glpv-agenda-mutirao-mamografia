/**
 * Sistema de preferências de UI por usuário.
 *
 * Uso típico em componente:
 *
 *   import { usePreference } from "@/lib/preferences";
 *
 *   const [range, setRange] = usePreference(
 *     "filters.dateRange",
 *     { from: "", to: "" },
 *   );
 *
 * Setup no root layout (já feito):
 *
 *   <PreferenceProvider userId={user?.id}>{children}</PreferenceProvider>
 *
 * Schema canônico em ./schema.ts — adicione novos paths lá.
 *
 * @module lib/preferences
 */

export { usePreference } from "./use-preference";
export {
  PreferenceProvider,
  getPreference,
  setPreference,
  removePreference,
  subscribePreference,
  usePreferenceUserId,
} from "./preferences";
export type { PreferenceStorage } from "./storage";
export type { PreferenceSchema, PathValue } from "./schema";
export { PREFERENCE_DEFAULTS } from "./schema";
