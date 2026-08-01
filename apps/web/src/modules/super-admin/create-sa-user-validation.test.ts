import { describe, it, expect } from "vitest";
import { createSaUserSchema, updateSaUserSchema } from "./create-sa-user-validation";

describe("createSaUserSchema", () => {
  const base = {
    name: "Carlos",
    email: "carlos@ezcrm.com",
    password: "SenhaForte123",
    super_admin_role: "SA_MASTER" as const,
  };

  it("aceita dados válidos", () => {
    expect(createSaUserSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita senha fraca (regressão: política ficou dessincronizada do backend antes)", () => {
    expect(createSaUserSchema.safeParse({ ...base, password: "123456" }).success).toBe(false);
  });

  it("normaliza e-mail (lowercase)", () => {
    const result = createSaUserSchema.safeParse({ ...base, email: "Carlos@EZCRM.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("carlos@ezcrm.com");
  });
});

describe("updateSaUserSchema", () => {
  const base = { name: "Carlos", email: "carlos@ezcrm.com", super_admin_role: "SA_MASTER" as const };

  it("aceita sem trocar senha", () => {
    expect(updateSaUserSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita nova senha fraca", () => {
    expect(updateSaUserSchema.safeParse({ ...base, new_password: "fraca" }).success).toBe(false);
  });
});
