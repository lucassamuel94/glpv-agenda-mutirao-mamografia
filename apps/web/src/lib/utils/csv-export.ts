/**
 * Utilitário para exportar dados para CSV
 * Função puramente frontend - gera arquivo CSV no navegador
 */

/**
 * Converte array de objetos para CSV e faz download
 * @param data - Array de objetos a serem exportados
 * @param filename - Nome do arquivo (sem extensão .csv)
 */
export const downloadCSV = (data: unknown[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("downloadCSV: Nenhum dado para exportar");
    return;
  }

  // Obter cabeçalhos (chaves do primeiro objeto)
  const headers = Object.keys(data[0] as Record<string, unknown>);

  // Criar linhas CSV
  const csvRows: string[] = [];

  // Adicionar cabeçalhos
  csvRows.push(headers.join(","));

  // Adicionar dados
  for (const row of data) {
    const values = headers.map((header) => {
      const value = (row as Record<string, unknown>)[header];
      // Escapar vírgulas e aspas, e envolver em aspas se necessário
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      // Se contém vírgula, aspas ou quebra de linha, envolver em aspas e escapar aspas
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  // Criar blob e fazer download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpar URL do objeto
  URL.revokeObjectURL(url);
};


