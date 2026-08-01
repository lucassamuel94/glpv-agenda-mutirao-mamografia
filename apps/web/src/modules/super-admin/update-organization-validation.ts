import { z } from "zod";

const organizationStatusEnum = z.enum([
  "ACTIVATION",
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
]);

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .transform((v) => v.trim())
    .optional(),
  cnpj: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.replace(/\D/g, "").length >= 14,
      "CNPJ deve conter 14 dígitos",
    ),
  address: z.string().optional(),
  status: organizationStatusEnum.optional().default("ACTIVATION"),
  primary_color: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^#[0-9a-fA-F]{6}$/.test(v),
      "Cor deve estar no formato #rrggbb",
    ),
  logo_url: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(https?:\/\/|data:image\/)/.test(v),
      "Imagem do logo inválida",
    ),
  icon_url: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(https?:\/\/|data:image\/)/.test(v),
      "Imagem do ícone inválida",
    ),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  density: z.enum(["compact", "comfortable", "spacious"]).default("compact"),
  locale: z.enum(["pt-BR"]).default("pt-BR"),
  timezone: z.enum(["America/Sao_Paulo"]).default("America/Sao_Paulo"),
  date_format: z.enum(["DD/MM/YYYY"]).default("DD/MM/YYYY"),
});

export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationSchema
>;
