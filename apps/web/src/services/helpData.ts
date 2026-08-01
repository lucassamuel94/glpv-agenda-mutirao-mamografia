export const HELP_CONTENT: Record<
  string,
  { title: string; description: string; features: string[] }
> = {
  "/": {
    title: "Dashboard",
    description:
      "Tela inicial do template — ponto de customização por projeto.",
    features: [
      "Substitua o placeholder por KPIs/atalhos do seu domínio.",
      "Ver `modules/reports` para um exemplo funcional de módulo com dados reais.",
    ],
  },
  "/reports": {
    title: "Relatórios",
    description:
      "Módulo de exemplo do template: listagem com filtro e paginação.",
    features: [
      "Filtros: busca livre, resultado (permitido/negado), entidade e período.",
      "Paginação e ordenação por coluna.",
      "Copie este módulo como referência ao criar uma nova listagem.",
    ],
  },
  "/team": {
    title: "Equipe",
    description: "Gerencie os usuários da sua organização.",
    features: [
      "Convide membros e defina roles (Admin/Gerente/Coordenador/Usuário).",
      "Ative/desative acesso sem excluir o histórico do usuário.",
    ],
  },
};

export const getHelpContent = (path: string) => {
  // Exact match
  if (HELP_CONTENT[path]) return HELP_CONTENT[path];

  // Partial match (e.g. /reports/123 -> /reports)
  const key = Object.keys(HELP_CONTENT).find(
    (k) => path.startsWith(k) && k !== "/",
  );
  return key
    ? HELP_CONTENT[key]
    : {
        title: "Ajuda do Sistema",
        description:
          "Selecione um módulo no menu para ver ajuda específica, ou use o assistente de IA.",
        features: [],
      };
};
