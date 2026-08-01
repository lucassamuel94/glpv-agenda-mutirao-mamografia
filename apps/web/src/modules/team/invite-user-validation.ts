import { z } from "zod";

import { UserRole } from "@/types";
import { strongPasswordSchema, optionalStrongPasswordSchema } from "@/lib/password-schema";

const teamMemberRoleEnum = z.enum([
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.COORDINATOR,
  UserRole.USER,
]);

export const inviteUserSchema = z.object({
  email: z
    .string()
    .email("E-mail inválido")
    .transform((v) => v.trim().toLowerCase()),
  role: teamMemberRoleEnum,
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

/** Criar usuário: nome, email, senha (obrigatória), função. Ou convite: só email e função. */
export const addUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .transform((v) => v.trim())
      .optional(),
    email: z
      .string()
      .email("E-mail inválido")
      .transform((v) => v.trim().toLowerCase()),
    password: z.string().optional(),
    role: teamMemberRoleEnum,
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return strongPasswordSchema.safeParse(data.password).success && (data.name?.length ?? 0) >= 2;
      }
      return true;
    },
    {
      message:
        "Preencha nome e senha (8+ caracteres, com maiúscula, minúscula e número) para criar usuário, ou deixe senha em branco para convite.",
      path: ["password"],
    },
  );

export type AddUserFormValues = z.infer<typeof addUserSchema>;

export const updateTeamMemberSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .transform((v) => v.trim()),
  role: teamMemberRoleEnum,
  new_password: optionalStrongPasswordSchema,
});

export type UpdateTeamMemberFormValues = z.infer<typeof updateTeamMemberSchema>;
