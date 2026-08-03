"use client";

import React from "react";
import useSWR from "swr";
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  Download,
  ListChecks,
  Percent,
  TrendingUp,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EmptyState } from "@/modules/common/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { mutiraoDashboardApi } from "@/lib/api/mutirao-dashboard";
import type { MutiraoDashboard, MutiraoClinicMetric } from "@/lib/api/mutirao-dashboard";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDateShort(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function occupationColor(rate: number): string {
  if (rate >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const { data, error, isLoading } = useSWR<MutiraoDashboard>(
    "mutirao-dashboard-executive",
    async () => {
      const response = await mutiraoDashboardApi.overview();
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    { refreshInterval: 30_000 }
  );

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" description="Não foi possível carregar os indicadores." />
        <Card className="p-6 shadow-none">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar dados. Verifique se o servidor está rodando e tente novamente.
          </p>
        </Card>
      </>
    );
  }

  if (isLoading || !data) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description={`${greeting()}, ${currentUser?.name?.split(" ")[0] ?? "Usuário"}…`}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-[120px] animate-pulse bg-muted/30 shadow-none" />
          ))}
        </div>
      </>
    );
  }

  const { kpis, clinics, total, daily_trend } = data;

  const kpiCards = [
    {
      label: "Total de vagas",
      value: formatNumber(kpis.total_slots),
      detail: `Campanha ${kpis.campaign_start?.slice(8)}/${kpis.campaign_start?.slice(5, 7)} a ${kpis.campaign_end?.slice(8)}/${kpis.campaign_end?.slice(5, 7)}`,
      icon: CalendarClock,
      tone: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Agendamentos confirmados",
      value: formatNumber(kpis.confirmed_appointments),
      detail: `${formatNumber(kpis.appointments_today)} hoje · ${formatNumber(kpis.appointments_this_week)} esta semana`,
      icon: CalendarCheck,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Taxa de ocupação",
      value: formatPercent(kpis.occupation_rate),
      detail: `${formatNumber(kpis.confirmed_appointments)} de ${formatNumber(kpis.total_slots)} vagas preenchidas`,
      icon: Percent,
      tone: occupationColor(kpis.occupation_rate),
    },
    {
      label: "Cancelamentos",
      value: formatNumber(kpis.total_cancellations),
      detail: kpis.total_slots
        ? `${((kpis.total_cancellations / (kpis.confirmed_appointments + kpis.total_cancellations || 1)) * 100).toFixed(1)}% dos agendamentos`
        : "sem dados",
      icon: XCircle,
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Vagas livres",
      value: formatNumber(total.free_slots ?? 0),
      detail: kpis.total_slots
        ? `${(((total.free_slots ?? 0) / kpis.total_slots) * 100).toFixed(1)}% disponível`
        : "sem vagas cadastradas",
      icon: Activity,
      tone: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Reservas ativas",
      value: formatNumber(total.reserved_slots ?? 0),
      detail: "Aguardando confirmação (expira em 10min)",
      icon: TrendingUp,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Lista de espera",
      value: formatNumber(kpis.waiting_list_count),
      detail: "Pacientes aguardando vaga",
      icon: Users,
      tone: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Motivos de cancelamento",
      value: formatNumber(total.operational_cancellations ?? 0),
      detail: `Oper. ${total.operational_cancellations ?? 0} · Desist. ${total.withdrawal_cancellations ?? 0} · Ausência ${total.absence_cancellations ?? 0}`,
      icon: UserX,
      tone: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard Executivo — Mutirão de Mamografia"
        description={`${greeting()}, ${currentUser?.name?.split(" ")[0] ?? "Gestor"} — visão consolidada da campanha.`}
      />

      <div className="flex flex-col gap-6 pb-4">
        {/* Export button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(mutiraoDashboardApi.exportUrl(), "_blank")}
          >
            <Download className="mr-1.5 size-4" />
            Exportar CSV
          </Button>
        </div>
        {/* KPI Cards */}
        <section aria-label="Indicadores-chave" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map(({ label, value, detail, icon: Icon, tone }) => (
            <Card key={label} className="gap-4 py-5 shadow-none">
              <CardHeader className="flex flex-row items-start justify-between px-5 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className={`size-4 ${tone}`} aria-hidden="true" />
              </CardHeader>
              <CardContent className="px-5">
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Charts Row */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Daily Trend Chart */}
          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Tendência de agendamentos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Confirmações e cancelamentos por dia (últimos 30 dias)
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-5 pt-5 sm:px-5">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={daily_trend}
                    margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="fill-confirmations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fill-cancellations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      tickMargin={10}
                      tickFormatter={formatDateShort}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        fontSize: 12,
                      }}
                      labelFormatter={formatDateShort}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "confirmations" ? "Confirmações" : "Cancelamentos",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="confirmations"
                      stroke="hsl(152, 69%, 45%)"
                      strokeWidth={2}
                      fill="url(#fill-confirmations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cancellations"
                      stroke="hsl(0, 72%, 51%)"
                      strokeWidth={1.5}
                      fill="url(#fill-cancellations)"
                      strokeDasharray="4 2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Clinic Occupancy Bar Chart */}
          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Ocupação por clínica</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preenchimento em relação à capacidade total
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-5 pt-5 sm:px-5">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clinics.map((c: MutiraoClinicMetric) => ({
                      name: c.name.length > 15 ? c.name.slice(0, 14) + "…" : c.name,
                      ocupadas: c.occupied_slots,
                      reservadas: c.reserved_slots,
                      livres: c.free_slots,
                    }))}
                    margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickMargin={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="ocupadas" stackId="a" fill="hsl(152, 69%, 45%)" radius={[0, 0, 0, 0]} name="Ocupadas" />
                    <Bar dataKey="reservadas" stackId="a" fill="hsl(45, 93%, 47%)" radius={[0, 0, 0, 0]} name="Reservadas" />
                    <Bar dataKey="livres" stackId="a" fill="hsl(210, 40%, 85%)" radius={[4, 4, 0, 0]} name="Livres" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinic Performance Table */}
        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Desempenho por clínica</CardTitle>
              <p className="text-sm text-muted-foreground">
                Indicadores detalhados de cada unidade
              </p>
            </div>
            <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 text-xs uppercase">Clínica</TableHead>
                    <TableHead className="text-center text-xs uppercase">Capacidade</TableHead>
                    <TableHead className="text-center text-xs uppercase">Livres</TableHead>
                    <TableHead className="text-center text-xs uppercase">Reserv.</TableHead>
                    <TableHead className="text-center text-xs uppercase">Ocupadas</TableHead>
                    <TableHead className="text-center text-xs uppercase">Confirm.</TableHead>
                    <TableHead className="text-center text-xs uppercase">Ocupação</TableHead>
                    <TableHead className="text-center text-xs uppercase">Cancel.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((clinic: MutiraoClinicMetric) => {
                    const totalCancellations =
                      clinic.operational_cancellations +
                      clinic.withdrawal_cancellations +
                      clinic.absence_cancellations;
                    const clinicOccupation = clinic.capacity > 0
                      ? ((clinic.occupied_slots / clinic.capacity) * 100)
                      : 0;
                    return (
                      <TableRow key={clinic.id}>
                        <TableCell className="pl-5 font-medium">{clinic.name}</TableCell>
                        <TableCell className="text-center">{formatNumber(clinic.capacity)}</TableCell>
                        <TableCell className="text-center text-emerald-600">
                          {formatNumber(clinic.free_slots)}
                        </TableCell>
                        <TableCell className="text-center text-amber-600">
                          {formatNumber(clinic.reserved_slots)}
                        </TableCell>
                        <TableCell className="text-center">{formatNumber(clinic.occupied_slots)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {formatNumber(clinic.confirmations)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              clinicOccupation >= 80 ? "success" : clinicOccupation >= 50 ? "warning" : "danger"
                            }
                          >
                            {clinicOccupation.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-rose-600">
                          {formatNumber(totalCancellations)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {clinics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState
                          kind="clinics"
                          mode="no-data"
                          compact
                          title="Nenhuma clínica cadastrada"
                          description="Configure a agenda para ver os indicadores."
                          className="border-0 bg-transparent shadow-none"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {clinics.length > 0 && (
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="pl-5">Consolidado</TableCell>
                      <TableCell className="text-center">{formatNumber(total.capacity ?? 0)}</TableCell>
                      <TableCell className="text-center text-emerald-600">
                        {formatNumber(total.free_slots ?? 0)}
                      </TableCell>
                      <TableCell className="text-center text-amber-600">
                        {formatNumber(total.reserved_slots ?? 0)}
                      </TableCell>
                      <TableCell className="text-center">{formatNumber(total.occupied_slots ?? 0)}</TableCell>
                      <TableCell className="text-center">{formatNumber(total.confirmations ?? 0)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={kpis.occupation_rate >= 80 ? "success" : kpis.occupation_rate >= 50 ? "warning" : "danger"}>
                          {formatPercent(kpis.occupation_rate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-rose-600">
                        {formatNumber(kpis.total_cancellations)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
