/**
 * Turno da vaga, usado como filtro do calendário de disponibilidade e das
 * sugestões de encaixe do painel.
 *
 * O corte é às 12h no HORÁRIO DE PAREDE de São Paulo: `slot_at` é
 * `timestamp without time zone` (RN-60), então `EXTRACT(HOUR FROM slot_at)`
 * já devolve a hora que a paciente vai ler no comprovante — nenhuma camada
 * converte fuso aqui.
 */
export enum SlotPeriod {
  MORNING = 'MANHA',
  AFTERNOON = 'TARDE',
}
