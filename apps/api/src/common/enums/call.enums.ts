/**
 * ENUMS E CONSTANTES DE CHAMADAS
 *
 * Tipos TypeScript e constantes relacionadas a chamadas
 * Usado pelo backend para padronização de tipos e status
 */

/**
 * Status de chamada (disposition)
 * Inclui todos os valores possíveis no banco de dados
 */
export enum CallStatusCode {
  ANSWERED = 'ANSWERED',
  NO_ANSWER = 'NO_ANSWER',
  ABANDONED = 'ABANDONED',
  BUSY = 'BUSY',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
  // Valores adicionais do banco
  TIMEOUT = 'TIMEOUT',
  NO_EXTENSIONS = 'NO_EXTENSIONS',
  CONTINUED = 'CONTINUED',
  ENDED = 'ENDED',
  SUCCESS = 'SUCCESS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
}

/**
 * Tipo de chamada (call_type) - ESTRUTURA SIMPLIFICADA
 *
 * Apenas 4 tipos principais (baseado na documentação do Asterisk):
 * - DIRECT_INBOUND: Entrada direta (sem fila)
 * - QUEUE_INBOUND: Entrada via fila
 * - OUTBOUND: Saída
 * - INTERNAL: Entre ramais
 *
 * O status detalhado (atendida, não atendida, etc.) é determinado
 * separadamente pelo campo `disposition`.
 */
export enum CallType {
  DIRECT_INBOUND = 'DIRECT_INBOUND',
  QUEUE_INBOUND = 'QUEUE_INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Categoria de chamada (normalizada)
 * Categorias finais para agrupamento em dashboards
 */
export enum CallCategory {
  DIRECT_INBOUND = 'DIRECT_INBOUND',
  QUEUE_INBOUND = 'QUEUE_INBOUND',
  OUTBOUND = 'OUTBOUND',
  EXTENSION_TO_EXTENSION = 'EXTENSION_TO_EXTENSION',
  TRANSFERRED = 'TRANSFERRED',
  OTHER = 'OTHER',
}

/**
 * Direção de chamada (call_direction)
 */
export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Dial Status (dial_status)
 * Valores do Asterisk
 */
export enum DialStatus {
  ANSWER = 'ANSWER',
  NOANSWER = 'NOANSWER',
  BUSY = 'BUSY',
  CANCEL = 'CANCEL',
  CONGESTION = 'CONGESTION',
  CHANUNAVAIL = 'CHANUNAVAIL',
  RINGING = 'RINGING',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Tipo de transferência (transfer_type)
 */
export enum TransferType {
  ATTENDED = 'ATTENDED',
  BLIND = 'BLIND',
}

/**
 * Hangup By (hangup_by)
 * Quem desligou a chamada
 */
export enum HangupBy {
  CALLER = 'CALLER',
  EXTENSION = 'EXTENSION',
  SYSTEM = 'SYSTEM',
}

/**
 * Configuração de status (label e cor)
 */
export interface CallStatusConfig {
  label: string;
  color: string;
}

/**
 * Configuração de status padronizada
 * Cores e labels consistentes em todo o sistema
 */
export const CALL_STATUS_CONFIG: Record<CallStatusCode, CallStatusConfig> = {
  ANSWERED: { label: 'Atendidas', color: '#10B981' },
  NO_ANSWER: { label: 'Não atendidas', color: '#F97316' },
  ABANDONED: { label: 'Abandonadas', color: '#F59E0B' },
  BUSY: { label: 'Ocupado', color: '#3B82F6' },
  FAILED: { label: 'Com erro', color: '#EF4444' },
  CANCELLED: { label: 'Canceladas', color: '#6B7280' },
  UNKNOWN: { label: 'Desconhecido', color: '#06B6D4' },
  TIMEOUT: { label: 'Timeout', color: '#F59E0B' },
  NO_EXTENSIONS: { label: 'Sem ramais', color: '#F97316' },
  CONTINUED: { label: 'Continuada', color: '#10B981' },
  ENDED: { label: 'Finalizada', color: '#6B7280' },
  SUCCESS: { label: 'Sucesso', color: '#10B981' },
  AUTHENTICATION_FAILED: { label: 'Falha de autenticação', color: '#EF4444' },
};

/**
 * Mapeamento Call Type → Categoria
 * Mapeia tipos simplificados para categorias normalizadas
 */
export const CALL_TYPE_CATEGORY_MAP: Record<string, CallCategory> = {
  // Tipos simplificados (estrutura atual)
  [CallType.DIRECT_INBOUND]: CallCategory.DIRECT_INBOUND,
  [CallType.QUEUE_INBOUND]: CallCategory.QUEUE_INBOUND,
  [CallType.OUTBOUND]: CallCategory.OUTBOUND,
  [CallType.INTERNAL]: CallCategory.EXTENSION_TO_EXTENSION,
  [CallType.UNKNOWN]: CallCategory.OTHER,
  TRANSFERRED: CallCategory.TRANSFERRED,
};

/**
 * Labels para categorias (em português)
 */
export const CALL_CATEGORY_LABELS: Record<CallCategory, string> = {
  DIRECT_INBOUND: 'Chamadas Diretas Recebidas',
  QUEUE_INBOUND: 'Chamadas em Fila',
  OUTBOUND: 'Chamadas Originadas',
  TRANSFERRED: 'Chamadas Transferidas',
  EXTENSION_TO_EXTENSION: 'Ramal para Ramal',
  OTHER: 'Outras',
};
