import { z } from "zod";
import { strongPasswordSchema, optionalStrongPasswordSchema } from "@/lib/password-schema";

const saRoleEnum = z.enum(["SA_MASTER", "SA_BILLING", "SA_USER"]);

export const createSaUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").transform((v) => v.trim()),
  email: z.string().email("E-mail inválido").transform((v) => v.trim().toLowerCase()),
  password: strongPasswordSchema,
  super_admin_role: saRoleEnum,
});

export type CreateSaUserFormValues = z.infer<typeof createSaUserSchema>;

export const updateSaUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").transform((v) => v.trim()),
  email: z.string().email("E-mail inválido").transform((v) => v.trim().toLowerCase()),
  super_admin_role: saRoleEnum,
  new_password: optionalStrongPasswordSchema,
});

export type UpdateSaUserFormValues = z.infer<typeof updateSaUserSchema>;
