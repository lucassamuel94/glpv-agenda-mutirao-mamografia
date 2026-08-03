/**
 * Regra central do spec 2026-07-28: mundo ⇔ contexto. A rota decide o mundo,
 * e cada mundo mostra SÓ os seus itens — a mistura "Plataforma" + "Geral" na
 * mesma sidebar era a queixa original de confusão.
 */
import { describe, expect, it } from "vitest";
import { buildMenuGroups, buildBottomItems, getWorld } from "./sidebar-menu";

describe("getWorld", () => {
  it("rotas /super-admin/* são o mundo console", () => {
    expect(getWorld("/super-admin")).toBe("console");
    expect(getWorld("/super-admin/audit")).toBe("console");
  });

  it("todas as demais rotas (e pathname nulo) são o mundo crm", () => {
    expect(getWorld("/")).toBe("crm");
    expect(getWorld("/reports")).toBe("crm");
    expect(getWorld(null)).toBe("crm");
  });
});

describe("buildMenuGroups", () => {
  it("console mostra a seção Plataforma e os guias quando solicitado", () => {
    const groups = buildMenuGroups("console", { includeDevGuides: true });
    expect(groups.map((g) => g.title)).toEqual(["Plataforma", "Guia de Estilo"]);
    expect(groups[0].items.map((i) => i.path)).toEqual([
      "/super-admin",
      "/super-admin/audit",
    ]);
    expect(groups[1].items.map((i) => i.path)).toEqual([
      "/super-admin/style-guide",
      "/super-admin/form-guide",
    ]);
  });

  it("console não expõe os guias fora do ambiente de desenvolvimento", () => {
    const groups = buildMenuGroups("console", { includeDevGuides: false });
    expect(groups.map((g) => g.title)).toEqual(["Plataforma"]);
  });

  it("crm NÃO contém a seção Plataforma nem os guias", () => {
    const groups = buildMenuGroups("crm");
    expect(groups.map((g) => g.title)).toEqual(["Geral", "Mutirão"]);
    const paths = groups.flatMap((g) => g.items.map((i) => i.path));
    expect(paths.some((p) => p?.startsWith("/super-admin"))).toBe(false);
    expect(
      paths.some(
        (p) => p === "/super-admin/style-guide" || p === "/super-admin/form-guide",
      ),
    ).toBe(false);
  });

  it("crm preserva os itens e resources atuais (permissões continuam valendo)", () => {
    const geral = buildMenuGroups("crm").find((g) => g.title === "Geral")!;
    expect(geral.items.map((i) => [i.path, i.resource])).toEqual([
      ["/", "dashboard"],
      ["/reports", "reports"],
    ]);
  });

  it("crm expõe Equipe como bottom item (separado dos grupos principais)", () => {
    const bottom = buildBottomItems("crm");
    expect(bottom.map((i) => [i.path, i.resource])).toEqual([
      ["/team", "settings"],
    ]);
  });

  it("console não tem bottom items", () => {
    expect(buildBottomItems("console")).toEqual([]);
  });

  it("crm expõe a seção Mutirão com agenda, pacientes e clínicas", () => {
    const mutirao = buildMenuGroups("crm").find((g) => g.title === "Mutirão")!;
    expect(mutirao.items.map((i) => [i.path, i.resource])).toEqual([
      ["/agenda", "agenda"],
      ["/pacientes", "pacientes"],
      ["/clinics", "superadmin"],
    ]);
  });
});
