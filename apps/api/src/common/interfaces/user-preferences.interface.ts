/**
 * INTERFACES DE PREFERÊNCIAS DO USUÁRIO
 *
 * Define os tipos e interfaces para preferências do usuário
 */

/**
 * Presets de range de datas disponíveis
 * Exclui "custom" (selecionar) pois não é um preset válido
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last14'
  | 'last30'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth';

/**
 * Preferências de tema
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Interface de preferências do usuário
 */
export interface UserPreferences {
  /**
   * Range padrão de datas para consultas
   * null = usar padrão do sistema (últimos 30 dias no frontend)
   */
  defaultDateRange: DateRangePreset | null;

  /**
   * Tema preferido pelo usuário
   * system = seguir preferência do sistema operacional
   */
  theme: ThemePreference;

  /**
   * Cor primária escolhida pelo usuário (hex), sobrepõe o branding da
   * organização. null = usar a cor da organização/instância.
   */
  primaryColor?: string | null;
}

/**
 * Valores padrão das preferências
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultDateRange: null,
  theme: 'system',
  primaryColor: null,
};
