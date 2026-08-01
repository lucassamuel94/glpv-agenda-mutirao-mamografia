import { z } from "zod";
import { strongPasswordSchema } from "@/lib/password-schema";

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  avatarUrl: z.string().optional(),
});

/**
 * Schema para alteração de senha
 */
export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Senha atual é obrigatória"),
    new: strongPasswordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.new === data.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

/**
 * Tipos inferidos dos schemas
 */
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
