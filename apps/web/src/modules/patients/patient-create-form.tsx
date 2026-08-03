"use client";

import { useState } from "react";
import { Form, Input, DatePicker } from "@/components/Form";
import { Button } from "@/components/Button";
import { patientsApi, type Patient } from "@/lib/api/patients";
import { toast } from "@/lib/toast";
import { patientCreateSchema, type PatientCreateFormValues } from "./patient-create-validation";

interface PatientCreateFormProps {
  onCreated: (patient: Patient) => void;
}

/** RN-04/05: cadastra (ou reaproveita, se já existir) a paciente para o agendamento manual. */
export function PatientCreateForm({ onCreated }: PatientCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PatientCreateFormValues) => {
    setIsLoading(true);
    try {
      const response = await patientsApi.findOrCreate(data);
      if (response.error) throw new Error(response.error);
      if (response.data) onCreated(response.data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao cadastrar paciente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      id="patient-create-form"
      schema={patientCreateSchema}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      showDefaultButtons={false}
      className="space-y-4"
    >
      <Input name="fullName" label="Nome completo" required placeholder="Nome completo" />
      <DatePicker name="birthDate" label="Data de nascimento" required />
      <Input name="phone" label="Telefone" required placeholder="(00) 00000-0000" />
      <Input name="altPhone" label="Telefone alternativo (opcional)" placeholder="(00) 00000-0000" />
      <Button type="submit" variant="primary" size="md" disabled={isLoading} className="w-full">
        {isLoading ? "Cadastrando..." : "Cadastrar paciente"}
      </Button>
    </Form>
  );
}
