/**
 * RN-38/41/42, §3.7 do documento de regras de negócio — texto funcional
 * recomendado para a pergunta de dupla confirmação de ausência. Pendente de
 * aprovação final do cliente (Pendência 5); este é o default do documento.
 */
export function absenceConfirmationQuestion(
  date: string,
  time: string,
  clinicName: string
): string {
  return (
    `Você confirma que deseja cancelar seu atendimento de mamografia em ${date}, ` +
    `às ${time}, na ${clinicName}?`
  );
}

export const ABSENCE_CONFIRMATION_OPTIONS = {
  confirm: 'Sim, cancelar atendimento',
  keep: 'Não, manter atendimento',
} as const;
