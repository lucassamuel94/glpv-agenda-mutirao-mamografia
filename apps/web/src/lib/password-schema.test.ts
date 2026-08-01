import { describe, it, expect } from "vitest";
import { strongPasswordSchema, optionalStrongPasswordSchema } from "./password-schema";

describe("strongPasswordSchema", () => {
  it("aceita senha com maiúscula, minúscula e número", () => {
    expect(strongPasswordSchema.safeParse("SenhaForte123").success).toBe(true);
  });

  it("rejeita senha curta demais (< 8)", () => {
    expect(strongPasswordSchema.safeParse("Abc123").success).toBe(false);
  });

  it("rejeita senha sem maiúscula", () => {
    expect(strongPasswordSchema.safeParse("senhaforte123").success).toBe(false);
  });

  it("rejeita senha sem minúscula", () => {
    expect(strongPasswordSchema.safeParse("SENHAFORTE123").success).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(strongPasswordSchema.safeParse("SenhaForte").success).toBe(false);
  });

  it("rejeita senha maior que 128 caracteres", () => {
    expect(strongPasswordSchema.safeParse("Aa1" + "x".repeat(126)).success).toBe(false);
  });
});

describe("optionalStrongPasswordSchema", () => {
  it("aceita vazio/ausente (campo opcional de troca de senha)", () => {
    expect(optionalStrongPasswordSchema.safeParse(undefined).success).toBe(true);
    expect(optionalStrongPasswordSchema.safeParse("").success).toBe(true);
  });

  it("valida a mesma política quando preenchido", () => {
    expect(optionalStrongPasswordSchema.safeParse("fraca").success).toBe(false);
    expect(optionalStrongPasswordSchema.safeParse("SenhaForte123").success).toBe(true);
  });
});
