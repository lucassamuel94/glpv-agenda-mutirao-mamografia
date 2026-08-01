import { describe, it, expect } from "vitest";
import { inviteUserSchema, addUserSchema, updateTeamMemberSchema } from "./invite-user-validation";
import { UserRole } from "@/types";

describe("inviteUserSchema", () => {
  it("normaliza e-mail (lowercase)", () => {
    const result = inviteUserSchema.safeParse({
      email: "Joao@Empresa.com",
      role: UserRole.USER,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("joao@empresa.com");
  });

  it("rejeita e-mail inválido", () => {
    expect(
      inviteUserSchema.safeParse({ email: "não-é-email", role: UserRole.USER }).success,
    ).toBe(false);
  });
});

describe("addUserSchema", () => {
  const baseInvite = { email: "joao@empresa.com", role: UserRole.USER };

  it("sem senha: é um convite válido (nome opcional)", () => {
    expect(addUserSchema.safeParse(baseInvite).success).toBe(true);
  });

  it("com senha: exige nome preenchido e senha forte", () => {
    const result = addUserSchema.safeParse({
      ...baseInvite,
      name: "João",
      password: "SenhaForte123",
    });
    expect(result.success).toBe(true);
  });

  it("com senha fraca: rejeita (regressão: política ficou dessincronizada do backend antes)", () => {
    const result = addUserSchema.safeParse({
      ...baseInvite,
      name: "João",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("com senha mas sem nome: rejeita", () => {
    const result = addUserSchema.safeParse({ ...baseInvite, password: "SenhaForte123" });
    expect(result.success).toBe(false);
  });
});

describe("updateTeamMemberSchema", () => {
  const base = { name: "João Silva", role: UserRole.ADMIN };

  it("aceita sem trocar senha", () => {
    expect(updateTeamMemberSchema.safeParse(base).success).toBe(true);
  });

  it("aceita nova senha forte", () => {
    expect(
      updateTeamMemberSchema.safeParse({ ...base, new_password: "SenhaForte123" }).success,
    ).toBe(true);
  });

  it("rejeita nova senha fraca", () => {
    expect(
      updateTeamMemberSchema.safeParse({ ...base, new_password: "fraca" }).success,
    ).toBe(false);
  });
});
