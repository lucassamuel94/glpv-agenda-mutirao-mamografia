"use client";

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  Download,
  Hospital,
  Percent,
  Users,
  XCircle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission, Tabs } from "@/components";
import InputSearch from "@/components/InputSearch";
import { ErrorMessage } from "@/modules/common/error-message";
import { EmptyState } from "@/modules/common/empty-state";
import { mutiraoDashboardApi } from "@/lib/api/mutirao-dashboard";
import type {
  MutiraoDashboard,
  MutiraoClinicMetric,
} from "@/lib/api/mutirao-dashboard";
import { patientsApi, type Patient } from "@/lib/api/patients";
import { appointmentsApi } from "@/lib/api/appointments";
import type { Appointment } from "@/lib/api/scheduling";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function occupationVariant(rate: number): "success" | "warning" | "danger" {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "danger";
}

function clinicTabValue(clinicId: string) {
  return `clinic-${clinicId}`;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card className="flex flex-row items-center gap-3 px-4 py-3 shadow-none">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50", tone)}>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold leading-tight text-foreground">{value}</p>
      </div>
    </Card>
  );
}

// ─── Clinic Detail Card ─────────────────────────────────────────────────────

function ClinicKpiCards({ clinic }: { clinic: MutiraoClinicMetric }) {
  const occupationRate =
    clinic.capacity > 0
      ? (clinic.occupied_slots / clinic.capacity) * 100
      : 0;
  const totalCancellations =
    clinic.operational_cancellations +
    clinic.withdrawal_cancellations +
    clinic.absence_cancellations;

  return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Capacidade total"
          value={formatNumber(clinic.capacity)}
          detail={`${formatNumber(clinic.free_slots)} vagas livres`}
          icon={CalendarClock}
          tone="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          label="Confirmações"
          value={formatNumber(clinic.confirmations)}
          detail={`${formatNumber(clinic.occupied_slots)} vagas ocupadas`}
          icon={CalendarCheck}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Taxa de ocupação"
          value={formatPercent(occupationRate)}
          detail={`${formatNumber(clinic.occupied_slots)} de ${formatNumber(clinic.capacity)} vagas`}
          icon={Percent}
          tone={
            occupationRate >= 80
              ? "text-emerald-600 dark:text-emerald-400"
              : occupationRate >= 50
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400"
          }
        />
        <KpiCard
          label="Cancelamentos"
          value={formatNumber(totalCancellations)}
          detail={`Oper. ${clinic.operational_cancellations} · Desist. ${clinic.withdrawal_cancellations} · Ausência ${clinic.absence_cancellations}`}
          icon={XCircle}
          tone="text-rose-600 dark:text-rose-400"
        />
      </div>
  );
}

// ─── Patient Search ─────────────────────────────────────────────────────────

function PatientSearchSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [searching, setSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) {
      setPatients([]);
      setSelectedPatientId(null);
      return;
    }
    setSearching(true);
    try {
      const res = await patientsApi.search(trimmed);
      if (res.error) {
        toast(res.error, "error");
        setPatients([]);
      } else {
        setPatients(res.data ?? []);
      }
      setSelectedPatientId(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectPatient = useCallback(async (patientId: string) => {
    setSelectedPatientId(patientId);
    if (appointments[patientId]) return; // já carregou
    setLoadingHistory(true);
    try {
      const res = await appointmentsApi.history(patientId);
      if (res.data) {
        setAppointments((prev) => ({ ...prev, [patientId]: res.data! }));
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [appointments]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const patientAppointments = selectedPatientId ? (appointments[selectedPatientId] ?? []) : [];

  return (
    <section className="border-b border-border">
      <div className="p-5">
        <div className="space-y-4">
          <InputSearch
            name="patient-search"
            variant="input"
            placeholder="Nome ou telefone do paciente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
          />

          {!searching && !searchTerm && !selectedPatient && (
            <EmptyState
              kind="reports"
              mode="no-data"
              compact
              title="Consulte o relatório por paciente"
              description="Busque uma paciente para detalhar os agendamentos e indicadores."
              className="border-0 bg-transparent px-0 shadow-none"
            />
          )}

          {searching && (
            <p className="text-sm text-muted-foreground">Buscando...</p>
          )}

          {!searching && patients.length > 0 && (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-xs uppercase">Nome</TableHead>
                    <TableHead className="text-xs uppercase">Telefone</TableHead>
                    <TableHead className="text-xs uppercase">Nascimento</TableHead>
                    <TableHead className="text-xs uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "cursor-pointer",
                        selectedPatientId === p.id && "bg-primary/5",
                      )}
                      onClick={() => handleSelectPatient(p.id)}
                    >
                      <TableCell className="pl-4 font-medium">{p.full_name}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.birth_date
                          ? new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.bot_blocked ? (
                          <Badge variant="danger">Bloqueado</Badge>
                        ) : (
                          <Badge variant="success">Ativo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!searching && searchTerm.length >= 2 && patients.length === 0 && (
            <EmptyState
              kind="patients"
              mode="no-results"
              compact
              query={searchTerm}
              title={`Nenhum paciente encontrado para “${searchTerm}”`}
              description="Tente ajustar a busca ou limpar o termo informado."
              action={{
                label: "Limpar busca",
                onClick: () => {
                  setSearchTerm("");
                  setPatients([]);
                  setSelectedPatientId(null);
                },
              }}
              className="border-0 bg-transparent px-0 shadow-none"
            />
          )}

          {/* Histórico do paciente selecionado */}
          {selectedPatient && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-foreground">
                Agendamentos de {selectedPatient.full_name}
              </h4>
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : patientAppointments.length === 0 ? (
                <EmptyState
                  kind="agenda"
                  mode="no-data"
                  compact
                  title="Nenhum agendamento encontrado"
                  description="Este paciente ainda não possui agendamentos registrados."
                  className="border-0 bg-transparent px-0 shadow-none"
                />
              ) : (
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4 text-xs uppercase">Protocolo</TableHead>
                        <TableHead className="text-xs uppercase">Status</TableHead>
                        <TableHead className="text-xs uppercase">Canal</TableHead>
                        <TableHead className="text-xs uppercase">Data</TableHead>
                        <TableHead className="text-xs uppercase">Motivo cancel.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="pl-4 font-mono text-xs">
                            {apt.protocol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={apt.status === "CONFIRMADO" ? "success" : "danger"}
                            >
                              {apt.status === "CONFIRMADO" ? "Confirmado" : "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {apt.channel === "BOT" ? "Bot" : "Painel"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(apt.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {apt.cancel_reason
                              ? apt.cancel_reason.replace(/_/g, " ").toLowerCase()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Main View ──────────────────────────────────────────────────────────────

function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data, error, isLoading } = useSWR<MutiraoDashboard>(
    "mutirao-reports",
    async () => {
      const response = await mutiraoDashboardApi.overview();
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    { refreshInterval: 60_000 },
  );

  if (error) {
    return (
      <>
        <PageHeader title="Relatórios" />
        <ErrorMessage error={typeof error === "string" ? error : error.message} />
      </>
    );
  }

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Relatórios" isLoading />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-[120px] animate-pulse bg-muted/30 shadow-none" />
          ))}
        </div>
      </>
    );
  }

  const { kpis, clinics } = data;
  const clinicTotals = clinics.reduce(
    (totals, clinic) => ({
      capacity: totals.capacity + clinic.capacity,
      confirmations: totals.confirmations + clinic.confirmations,
      occupied_slots: totals.occupied_slots + clinic.occupied_slots,
    }),
    { capacity: 0, confirmations: 0, occupied_slots: 0 },
  );
  const clinicOccupationRate =
    clinicTotals.capacity > 0
      ? (clinicTotals.occupied_slots / clinicTotals.capacity) * 100
      : 0;

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Métricas e indicadores do Mutirão de Mamografia."
      />

      <Tabs
        variant="solid"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs.List className="max-w-full overflow-x-auto">
            <Tabs.Trigger value="overview">
              <Activity size={15} aria-hidden="true" />
              Visão geral
            </Tabs.Trigger>
            {clinics.map((clinic) => (
              <Tabs.Trigger key={clinic.id} value={clinicTabValue(clinic.id)}>
                <Hospital size={15} aria-hidden="true" />
                {clinic.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(mutiraoDashboardApi.exportUrl(), "_blank")
            }
          >
            <Download className="mr-1.5 size-4" />
            Exportar CSV
          </Button>
        </div>

        {/* ─── Tab Visão Geral ─────────────────────────────────────────── */}
        <Tabs.Content value="overview" className="mt-5">
          <div className="flex flex-col gap-6">
            {/* KPIs Consolidados */}
            <section
              aria-label="Indicadores consolidados"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <KpiCard
                label="Total de vagas"
                value={formatNumber(clinicTotals.capacity)}
                detail={`Campanha ${kpis.campaign_start?.slice(8)}/${kpis.campaign_start?.slice(5, 7)} a ${kpis.campaign_end?.slice(8)}/${kpis.campaign_end?.slice(5, 7)}`}
                icon={CalendarClock}
                tone="text-blue-600 dark:text-blue-400"
              />
              <KpiCard
                label="Agendamentos confirmados"
                value={formatNumber(clinicTotals.confirmations)}
                detail={`${formatNumber(kpis.appointments_today)} hoje · ${formatNumber(kpis.appointments_this_week)} esta semana`}
                icon={CalendarCheck}
                tone="text-emerald-600 dark:text-emerald-400"
              />
              <KpiCard
                label="Taxa de ocupação"
                value={formatPercent(clinicOccupationRate)}
                detail={`${formatNumber(clinicTotals.occupied_slots)} de ${formatNumber(clinicTotals.capacity)} vagas preenchidas`}
                icon={Percent}
                tone={
                  clinicOccupationRate >= 80
                    ? "text-emerald-600 dark:text-emerald-400"
                    : clinicOccupationRate >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                }
              />
              <KpiCard
                label="Lista de espera"
                value={formatNumber(kpis.waiting_list_count)}
                detail="Pacientes aguardando vaga"
                icon={Users}
                tone="text-purple-600 dark:text-purple-400"
              />
            </section>

            <Card className="gap-0 overflow-hidden py-0 shadow-none">
              {/* Busca de paciente */}
              <PatientSearchSection />
            </Card>
          </div>
        </Tabs.Content>

        {/* ─── Tabs individuais por clínica ─────────────────────────────── */}
        {clinics.map((clinic) => (
          <Tabs.Content
            key={clinic.id}
            value={clinicTabValue(clinic.id)}
            className="mt-5"
          >
          <div className="flex flex-col gap-5">
            <ClinicKpiCards clinic={clinic} />
            <Card className="gap-0 overflow-hidden py-0 shadow-none">
              <PatientSearchSection />
            </Card>
          </div>
          </Tabs.Content>
        ))}
      </Tabs>
    </>
  );
}

export default function Reports() {
  return (
    <RequirePermission perm={PERMISSIONS.REPORTS}>
      <ReportsPage />
    </RequirePermission>
  );
}
