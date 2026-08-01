/**
 * FUNÇÕES DE NORMALIZAÇÃO DE CHAMADAS
 *
 * Funções para normalizar valores de chamadas vindos do banco
 * ou de processadores para valores padronizados
 *
 * IMPORTANTE:
 * - normalizeStatus(): Normaliza para agregação em dashboards/relatórios
 * - getStatusLabel(): Retorna label do valor ORIGINAL (para análise detalhada)
 */

import {
  CallCategory,
  CallStatusCode,
  CALL_TYPE_CATEGORY_MAP,
  CALL_STATUS_CONFIG,
} from '../enums/call.enums';

/**
 * Normaliza um call_type para uma categoria
 * @param rawType - Valor bruto de call_type
 * @returns Categoria normalizada ou OTHER se não mapeado
 */
export function normalizeCallType(rawType: string | null | undefined): CallCategory {
  if (!rawType) return CallCategory.OTHER;

  const upper = rawType.toUpperCase().trim();

  // Primeiro tenta mapeamento direto
  if (CALL_TYPE_CATEGORY_MAP[upper]) {
    return CALL_TYPE_CATEGORY_MAP[upper];
  }

  // Se não encontrar, tenta prefixos
  if (upper.startsWith('DIRECT_INBOUND')) return CallCategory.DIRECT_INBOUND;
  if (upper.startsWith('QUEUE_INBOUND')) return CallCategory.QUEUE_INBOUND;
  if (upper.startsWith('OUTBOUND')) return CallCategory.OUTBOUND;
  if (upper.startsWith('INTERNAL')) return CallCategory.EXTENSION_TO_EXTENSION;
  if (upper.startsWith('TRANSFERRED')) return CallCategory.TRANSFERRED;

  // Se não mapear, retorna OTHER
  return CallCategory.OTHER;
}

/**
 * Normaliza um status de chamada baseado no DialStatus do Asterisk
 *
 * Mapeamento DialStatus → Disposition (baseado na documentação do Asterisk):
 * - ANSWER → ANSWERED
 * - NOANSWER → NO_ANSWER
 * - BUSY → BUSY
 * - CANCEL → CANCELLED
 * - CONGESTION → FAILED
 * - CHANUNAVAIL → FAILED
 *
 * @param rawStatus - Valor bruto de disposition ou dial_status
 * @returns Status normalizado ou UNKNOWN se não mapeado
 */
export function normalizeStatus(rawStatus: string | null | undefined): CallStatusCode {
  if (!rawStatus) return CallStatusCode.UNKNOWN;

  const upper = rawStatus.toUpperCase().trim();

  // Mapeia variações do DialStatus do Asterisk
  if (upper === 'NOANSWER' || upper === 'NO ANSWER' || upper === 'MISSED_DIRECT') {
    return CallStatusCode.NO_ANSWER;
  }
  if (upper === 'CANCEL' || upper === 'CANCELED') {
    return CallStatusCode.CANCELLED;
  }
  if (upper === 'CONGESTION' || upper === 'CHANUNAVAIL') {
    return CallStatusCode.FAILED;
  }
  if (upper === 'COMPLETE' || upper === 'COMPLETED') {
    return CallStatusCode.ENDED;
  }
  if (upper === 'ACTIVE' || upper === 'PENDING') {
    return CallStatusCode.UNKNOWN;
  }

  // Verifica se é um valor válido do enum
  const validStatus = Object.values(CallStatusCode).find((status) => status === upper);

  return validStatus || CallStatusCode.UNKNOWN;
}

/**
 * Mapeamento de labels para valores ORIGINAIS de disposition (não normalizados)
 * Usado para exibir o status real da chamada na análise detalhada
 */
const CALL_STATUS_ORIGINAL_LABELS: Record<string, string> = {
  // Valores padronizados (já no enum)
  ANSWERED: 'Atendida',
  NO_ANSWER: 'Não atendida',
  ABANDONED: 'Abandonada',
  BUSY: 'Ocupado',
  FAILED: 'Com erro',
  CANCELLED: 'Cancelada',
  UNKNOWN: 'Desconhecido',
  TIMEOUT: 'Timeout',
  NO_EXTENSIONS: 'Sem ramais disponíveis',
  CONTINUED: 'Continuada',
  ENDED: 'Finalizada',
  SUCCESS: 'Sucesso',
  AUTHENTICATION_FAILED: 'Falha de autenticação',

  // Valores originais específicos (não normalizados no banco)
  MISSED_DIRECT: 'Chamada direta perdida',
  NOANSWER: 'Não atendeu',
  CONGESTION: 'Congestionamento',
  CHANUNAVAIL: 'Canal indisponível',
  COMPLETE: 'Completa',
  COMPLETED: 'Completada',
  ACTIVE: 'Ativa',
  PENDING: 'Pendente',
};

/**
 * Retorna o label do status ORIGINAL (não normalizado)
 * Usado para exibir o status real da chamada na análise detalhada
 * @param rawStatus - Valor bruto de disposition do banco
 * @returns Label descritivo do status original
 */
export function getStatusLabel(rawStatus: string | null | undefined): string {
  if (!rawStatus) return CALL_STATUS_ORIGINAL_LABELS.UNKNOWN || 'Desconhecido';

  const upper = rawStatus.toUpperCase().trim();

  // Retorna label do valor original se existir
  if (CALL_STATUS_ORIGINAL_LABELS[upper]) {
    return CALL_STATUS_ORIGINAL_LABELS[upper];
  }

  // Se não encontrar, tenta normalizar e pegar o label normalizado
  const normalized = normalizeStatus(rawStatus);
  return CALL_STATUS_CONFIG[normalized]?.label || 'Desconhecido';
}

/**
 * Normaliza uma direção de chamada
 * @param rawDirection - Valor bruto de call_direction
 * @returns Direção normalizada ou UNKNOWN se não mapeado
 */
export function normalizeCallDirection(
  rawDirection: string | null | undefined
): 'INBOUND' | 'OUTBOUND' | 'INTERNAL' | 'UNKNOWN' {
  if (!rawDirection) return 'UNKNOWN';

  const upper = rawDirection.toUpperCase().trim();

  if (upper === 'INBOUND' || upper === 'OUTBOUND' || upper === 'INTERNAL') {
    return upper;
  }

  return 'UNKNOWN';
}
