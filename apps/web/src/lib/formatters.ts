
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateStr: string | Date) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

/**
 * Formata uma data-only "YYYY-MM-DD" em dd/mm/yyyy (ou dd/mm se withYear=false)
 * SEM conversão de fuso. `new Date("YYYY-MM-DD")` é interpretado como UTC e
 * desloca o dia em fusos negativos (ex.: -03 mostraria o dia anterior); por isso
 * fazemos split de string em vez de usar Date.
 */
export const formatDateOnlyPtBR = (ymd: string, withYear = true): string => {
  if (!ymd) return '-';
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
};

/**
 * Formata um datetime cru "YYYY-MM-DD HH:mm:ss" (formato do MySQL/backend) em
 * "dd/mm/yyyy HH:mm:ss" SEM conversão de fuso — mesma motivação do
 * formatDateOnlyPtBR. `new Date("YYYY-MM-DD HH:mm:ss")` depende de parsing
 * não-padrão (Safari rejeita) e do fuso do navegador; o split de string
 * garante paridade exata com o download XLSX (que usa date('d/m/Y H:i:s')).
 * Aceita separador ' ' ou 'T'. Vazio/sem fim (pausa aberta) → "-".
 */
export const formatDateTimeOnlyPtBR = (datetime: string | null | undefined | false): string => {
  if (!datetime) return '-';
  const [datePart, timePart = ''] = datetime.split(/[ T]/);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return String(datetime);
  const time = timePart.slice(0, 8); // HH:mm:ss (descarta fração/Z, se houver)
  return time ? `${d}/${m}/${y} ${time}` : `${d}/${m}/${y}`;
};

/**
 * Faz o parse de "YYYY-MM-DD HH:mm:ss" (separador ' ' ou 'T') como horário
 * LOCAL — mesma motivação dos formatters split-based (sem fuso, Safari-safe).
 * `null` quando inválido/vazio.
 */
export function parseLocalDateTime(dt: string | null | undefined): Date | null {
  if (!dt) return null;
  const str = String(dt).trim();
  // Com fuso explícito (termina em Z ou ±hh[:]mm) → instante ABSOLUTO; deixa o
  // browser converter pro relógio local. (O modo apresentação manda ISO-UTC; o
  // backend de produção manda "YYYY-MM-DD HH:mm:ss" local — ambos funcionam.)
  if (/(z|[+-]\d\d:?\d\d)$/i.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  const [datePart, timePart = "00:00:00"] = str.split(/[ T]/);
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, mi, s] = timePart.slice(0, 8).split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, h || 0, mi || 0, s || 0);
}

/** "HH:MM" LOCAL de um agendamento (robusto a formato local OU ISO-UTC). */
export function scheduledTimeLabel(dt: string | null | undefined): string {
  const date = parseLocalDateTime(dt);
  if (!date) return "--:--";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Rótulo de DIA para agendamentos: "hoje" / "amanhã" / "ontem" / "dd/MM".
 * Compara o dia-calendário local (não o instante), então 23:00 hoje × 01:00
 * amanhã caem em dias diferentes corretamente.
 */
export function scheduledDayLabel(dt: string | null | undefined): string {
  const date = parseLocalDateTime(dt);
  if (!date) return "—";
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86_400_000,
  );
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

/**
 * Tempo relativo de um agendamento. Futuro → "em 21 h"; passado → "atrasada há
 * 45 min". Granularidade min/h/d. Vazio quando inválido.
 */
export function scheduledRelativeLabel(dt: string | null | undefined): string {
  const date = parseLocalDateTime(dt);
  if (!date) return "";
  const diffMin = Math.round((date.getTime() - Date.now()) / 60_000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return "agora";
  const mag =
    abs < 60
      ? `${abs} min`
      : abs < 60 * 24
        ? `${Math.round(abs / 60)} h`
        : `${Math.round(abs / (60 * 24))} d`;
  return diffMin >= 0 ? `em ${mag}` : `atrasada há ${mag}`;
}

export const formatDateTime = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatRelativeTime = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Agora mesmo';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `${diffInDays} dias atrás`;

  return formatDate(date);
};

export const calculateDaysOpen = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
