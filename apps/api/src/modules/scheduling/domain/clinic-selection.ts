type ClinicLoad = { id: string; capacity: number; occupied: number; reserved: number };

/**
 * Ordena as clínicas da menos para a mais carregada — a regra determinística de
 * balanceamento (RN-22/23), em ordem completa.
 *
 * Existe separada de `pickClinic` porque a barra de equilíbrio do painel precisa
 * da FILA inteira (para mostrar a posição de cada clínica), não só do vencedor.
 * Uma regra, dois consumidores: se o critério mudar, bot e painel mudam juntos.
 */
export function rankClinicsByLoad(clinics: ClinicLoad[]): ClinicLoad[] {
  return [...clinics]
    .filter((clinic) => clinic.capacity > 0)
    .sort((left, right) => {
      const leftTotal = left.occupied + left.reserved;
      const rightTotal = right.occupied + right.reserved;
      return (
        leftTotal / left.capacity - rightTotal / right.capacity ||
        leftTotal - rightTotal ||
        left.id.localeCompare(right.id)
      );
    });
}

/** Selects the clinic according to the deterministic balancing rule. */
export function pickClinic(clinics: ClinicLoad[]): string | null {
  return rankClinicsByLoad(clinics)[0]?.id || null;
}
