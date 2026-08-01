import { z } from "zod";

/**
 * Política de senha para CRIAÇÃO/TROCA — espelha `IsStrongPassword` do
 * backend (`apps/api/src/common/validators/password.validator.ts`). Backend
 * é quem decide de verdade (esta validação é só UX: falhar aqui evita um
 * round-trip pra descobrir que a senha não passou lá). Não usar em login
 * (senha antiga pode não seguir a política nova; login autentica contra o
 * hash já salvo, não valida força).
 */
export const strongPasswordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Senha deve conter ao menos uma letra maiúscula, uma minúscula e um número",
  );

/** Mesma política, mas aceita string vazia/ausente (campo opcional de troca de senha). */
export const optionalStrongPasswordSchema = z
  .string()
  .optional()
  .refine((v) => !v || strongPasswordSchema.safeParse(v).success, {
    message:
      "Senha deve ter 8+ caracteres, com maiúscula, minúscula e número",
  });
