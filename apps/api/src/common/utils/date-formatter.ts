import { parse, format, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Utilitário para formatação de datas
 *
 * @example
 * // Formatação básica usando timezone do .env
 * const isoDate = DateFormatter.formatBrazilianDateToISO("10/10/2029");
 * // Resultado: "2029-10-10"
 *
 * // Formatação com timezone específico
 * const isoDate = DateFormatter.formatBrazilianDateToISOWithTimezone("10/10/2029", "America/New_York");
 *
 * // Validação de data
 * const isValid = DateFormatter.isValidBrazilianDate("10/10/2029");
 * // Resultado: true
 *
 * // Conversão de ISO para brasileiro
 * const brazilianDate = DateFormatter.formatISOToBrazilianDate("2029-10-10");
 * // Resultado: "10/10/2029"
 */
export class DateFormatter {
  /**
   * Converte data do formato brasileiro (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
   * Usa o timezone configurado no arquivo .env
   *
   * @param dateString - Data no formato DD/MM/YYYY (ex: "10/10/2029")
   * @returns Data no formato YYYY-MM-DD ou o valor original se falhar
   */
  static formatBrazilianDateToISO(dateString: string): string {
    if (typeof dateString !== 'string') {
      return dateString;
    }

    try {
      // Aceita formato DD/MM/YYYY e converte para YYYY-MM-DD
      // Usa timezone do arquivo .env para evitar problemas de UTC
      const date = parse(dateString, 'dd/MM/yyyy', new Date());

      if (isValid(date)) {
        // Pega o timezone do arquivo .env (padrão: America/Sao_Paulo)
        const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';
        const zonedDate = toZonedTime(date, timezone);

        return format(zonedDate, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.log(`Erro ao formatar data "${dateString}":`, error);
    }

    // Se falhar, retorna o valor original
    return dateString;
  }

  /**
   * Converte data do formato brasileiro (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
   * Com timezone específico
   *
   * @param dateString - Data no formato DD/MM/YYYY (ex: "10/10/2029")
   * @param timezone - Timezone específico (ex: "America/Sao_Paulo")
   * @returns Data no formato YYYY-MM-DD ou o valor original se falhar
   */
  static formatBrazilianDateToISOWithTimezone(dateString: string, timezone: string): string {
    if (typeof dateString !== 'string') {
      return dateString;
    }

    try {
      const date = parse(dateString, 'dd/MM/yyyy', new Date());

      if (isValid(date)) {
        const zonedDate = toZonedTime(date, timezone);
        return format(zonedDate, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.log(`Erro ao formatar data "${dateString}" com timezone "${timezone}":`, error);
    }

    return dateString;
  }

  /**
   * Converte data do formato ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
   * Usa o timezone configurado no arquivo .env
   *
   * @param isoDateString - Data no formato YYYY-MM-DD (ex: "2029-10-10")
   * @returns Data no formato DD/MM/YYYY ou o valor original se falhar
   */
  static formatISOToBrazilianDate(isoDateString: string): string {
    if (typeof isoDateString !== 'string') {
      return isoDateString;
    }

    try {
      // Converte de ISO para Date
      const date = new Date(isoDateString);

      if (isValid(date)) {
        // Pega o timezone do arquivo .env (padrão: America/Sao_Paulo)
        const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';
        const zonedDate = toZonedTime(date, timezone);

        return format(zonedDate, 'dd/MM/yyyy');
      }
    } catch (error) {
      console.log(`Erro ao formatar data ISO "${isoDateString}":`, error);
    }

    // Se falhar, retorna o valor original
    return isoDateString;
  }

  /**
   * Valida se uma string é uma data válida no formato brasileiro
   *
   * @param dateString - Data no formato DD/MM/YYYY
   * @returns true se for uma data válida, false caso contrário
   */
  static isValidBrazilianDate(dateString: string): boolean {
    if (typeof dateString !== 'string') {
      return false;
    }

    try {
      const date = parse(dateString, 'dd/MM/yyyy', new Date());
      return isValid(date);
    } catch (error) {
      return false;
    }
  }
}
