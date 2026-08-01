/**
 * Rótulos de exibição para o painel SA (apenas frontend).
 * Values (SA_MASTER, etc.) permanecem iguais na API; só mudamos o que o usuário vê.
 */

export const SA_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "SA_MASTER", label: "Admin" },
  { value: "SA_BILLING", label: "Financeiro / Cobrança" },
  { value: "SA_USER", label: "Operador" },
];

const LABELS: Record<string, string> = {
  SA_MASTER: "Admin",
  SA_BILLING: "Financeiro / Cobrança",
  SA_USER: "Operador",
};

export function getSaRoleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return LABELS[role] ?? role;
}

/** Nome do painel para uso em títulos e menu */
export const PAINEL_NAME = "Central de Operações";

/** Nome para "usuários que acessam o painel" */
export const USUARIOS_PLATAFORMA_LABEL = "usuários da plataforma";
