"use client";

import { useState } from "react";
import { UserCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientSearch } from "@/modules/patients/patient-search";
import { PatientCreateForm } from "@/modules/patients/patient-create-form";
import type { Patient } from "@/lib/api/patients";

/**
 * Rail da paciente — o "quem" do agendamento, fixo enquanto a operadora navega
 * pelas datas.
 *
 * Inverte o fluxo antigo (vaga → paciente): a ligação real começa por quem está
 * na linha. Antes, se a paciente estivesse bloqueada ou quisesse outro dia, o
 * modal era fechado e a seleção de vaga se perdia. Aqui a paciente permanece
 * escolhida e só a vaga muda.
 */
export function PatientRail({
  patient,
  onSelectPatient,
  onClearPatient,
}: {
  patient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onClearPatient: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);

  if (patient) {
    return (
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <UserCheck size={15} className="text-emerald-600" aria-hidden />
            Paciente
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Trocar paciente"
            onClick={() => {
              onClearPatient();
              setIsCreating(false);
            }}
          >
            <X size={14} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5 p-4">
          <p className="text-sm font-medium text-foreground">{patient.full_name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{patient.phone}</p>
          <p className="text-xs text-muted-foreground">
            Nascimento: {formatBirthDate(patient.birth_date)}
          </p>
          {patient.bot_blocked && (
            <div className="pt-1">
              <Badge variant="warning">Bloqueada no bot</Badge>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Só o painel pode agendar para ela (RN-65).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">1. Quem está agendando?</CardTitle>
          <p className="text-xs text-muted-foreground">
            Identifique a paciente antes de escolher o horário.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {isCreating ? (
          <>
            <PatientCreateForm onCreated={onSelectPatient} />
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setIsCreating(false)}
            >
              Voltar para a busca
            </Button>
          </>
        ) : (
          <>
            <PatientSearch onSelect={onSelectPatient} />
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setIsCreating(true)}
            >
              <UserPlus size={14} />
              Cadastrar nova paciente
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatBirthDate(birthDate: string): string {
  const [year, month, day] = birthDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
