import { describe, expect, it } from "vitest";
import { buildWeekdayGrid, shiftMonth } from "./availability-calendar";

/**
 * A grade do calendário é montada com aritmética de data em UTC e texto
 * `YYYY-MM-DD`, nunca com `Date` local: as vagas da campanha são horário de
 * parede (RN-60) e um `Date` local deslocaria o dia perto da meia-noite.
 *
 * O alinhamento da primeira semana é o ponto frágil — se o preenchimento estiver
 * errado, todos os dias do mês aparecem no dia da semana errado, e a operadora
 * agenda achando que terça é quarta.
 */
describe("buildWeekdayGrid", () => {
  it("alinha o primeiro dia útil na coluna do seu dia da semana", () => {
    // 01/09/2026 é uma terça: a primeira célula (segunda) fica vazia.
    const [firstWeek] = buildWeekdayGrid("2026-09");

    expect(firstWeek[0]).toBeNull();
    expect(firstWeek[1]).toBe("2026-09-01");
    expect(firstWeek[4]).toBe("2026-09-04");
  });

  it("não inclui sábado nem domingo (a campanha não tem vaga em fim de semana)", () => {
    const days = buildWeekdayGrid("2026-09").flat().filter(Boolean) as string[];

    for (const day of days) {
      const [year, month, dayOfMonth] = day.split("-").map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay();
      expect(weekday).toBeGreaterThanOrEqual(1);
      expect(weekday).toBeLessThanOrEqual(5);
    }
  });

  it("cobre todos os dias úteis do mês em linhas de cinco colunas", () => {
    const weeks = buildWeekdayGrid("2026-10");

    // Outubro/2026 tem 22 dias úteis.
    expect(weeks.flat().filter(Boolean)).toHaveLength(22);
    for (const week of weeks) expect(week.length).toBeLessThanOrEqual(5);
  });

  it("mantém a ordem cronológica ao longo do mês", () => {
    const days = buildWeekdayGrid("2026-09").flat().filter(Boolean) as string[];

    expect([...days].sort()).toEqual(days);
  });
});

describe("shiftMonth", () => {
  it("avança e volta um mês", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10");
    expect(shiftMonth("2026-10", -1)).toBe("2026-09");
  });

  it("atravessa a virada de ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
  });
});
