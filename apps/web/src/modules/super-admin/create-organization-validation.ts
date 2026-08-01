import { z } from "zod";

const organizationStatusEnum = z.enum([
  "ACTIVATION",
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
]);

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .transform((v) => v.trim()),
  cnpj: z
    .string()
    .min(14, "CNPJ deve conter 14 dígitos")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 14,
      "CNPJ deve conter 14 dígitos",
    ),
  address: z.string().optional(),
  status: organizationStatusEnum.optional().default("ACTIVATION"),
});

export type CreateOrganizationFormValues = z.infer<
  typeof createOrganizationSchema
>;
