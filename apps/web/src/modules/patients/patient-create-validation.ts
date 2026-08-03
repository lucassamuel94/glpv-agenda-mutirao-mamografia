import { z } from "zod";

export const patientCreateSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo"),
  birthDate: z.string().min(10, "Informe a data de nascimento"),
  phone: z.string().min(8, "Informe um telefone válido"),
  altPhone: z.string().optional(),
});

export type PatientCreateFormValues = z.infer<typeof patientCreateSchema>;
