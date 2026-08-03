import { z } from "zod";

export const createClinicSchema = z.object({
  organizationId: z.string().uuid("Selecione a organização"),
  name: z.string().min(2, "Informe o nome da clínica").max(255).transform((v) => v.trim()),
  capacity: z.coerce.number().int("Informe um número inteiro").min(0, "A capacidade não pode ser negativa"),
  address: z.string().min(2, "Informe o endereço").transform((v) => v.trim()),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

export const updateClinicSchema = createClinicSchema.omit({ organizationId: true });

export type CreateClinicFormValues = z.infer<typeof createClinicSchema>;
export type UpdateClinicFormValues = z.infer<typeof updateClinicSchema>;
