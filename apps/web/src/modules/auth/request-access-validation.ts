import { z } from "zod";
import { strongPasswordSchema } from "@/lib/password-schema";

/**
 * Função para validar CNPJ
 */
const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, "");
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  return true;
};

/**
 * Schema para solicitação de acesso
 */
export const requestAccessSchema = z
  .object({
    // Dados da Organização
    organizationName: z
      .string()
      .min(2, "Nome da organização deve ter pelo menos 2 caracteres"),
    cnpj: z
      .string()
      .min(1, "CNPJ é obrigatório")
      .refine((val) => validateCNPJ(val), {
        message: "CNPJ inválido",
      }),
    organizationAddress: z.string().optional(),
    logoUrl: z.string().optional(),
    iconUrl: z.string().optional(),
    primaryColor: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^#[0-9a-fA-F]{6}$/.test(val),
        "Cor deve estar no formato #rrggbb",
      ),
    theme: z.enum(["light", "dark", "system"]).default("light"),
    density: z.enum(["compact", "comfortable", "spacious"]).default("compact"),
    locale: z.enum(["pt-BR"]).default("pt-BR"),
    timezone: z.enum(["America/Sao_Paulo"]).default("America/Sao_Paulo"),
    dateFormat: z.enum(["DD/MM/YYYY"]).default("DD/MM/YYYY"),
    // Dados do Usuário
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

/**
 * Tipos inferidos dos schemas
 */
export type RequestAccessFormValues = z.infer<typeof requestAccessSchema>;
