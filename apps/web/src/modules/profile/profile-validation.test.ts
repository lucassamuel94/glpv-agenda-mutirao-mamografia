import { describe, it, expect } from "vitest";
import { updateProfileSchema, changePasswordSchema } from "./profile-validation";

describe("updateProfileSchema", () => {
  it("aceita nome válido", () => {
    expect(updateProfileSchema.safeParse({ name: "João Silva" }).success).toBe(true);
  });

  it("rejeita nome curto demais", () => {
    expect(updateProfileSchema.safeParse({ name: "J" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const base = { current: "senha-atual", new: "SenhaForte123", confirm: "SenhaForte123" };

  it("aceita quando as senhas coincidem e a nova é forte", () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita quando confirmação não bate", () => {
    const result = changePasswordSchema.safeParse({ ...base, confirm: "OutraSenha123" });
    expect(result.success).toBe(false);
  });

  it("rejeita nova senha fraca (regressão: política ficou dessincronizada do backend antes)", () => {
    const result = changePasswordSchema.safeParse({ ...base, new: "123456", confirm: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejeita sem senha atual", () => {
    expect(changePasswordSchema.safeParse({ ...base, current: "" }).success).toBe(false);
  });
});
