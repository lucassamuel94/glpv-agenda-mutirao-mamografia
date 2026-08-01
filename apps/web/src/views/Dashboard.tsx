"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Percent,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useReports } from "@/hooks/use-reports";
import type { ReportEntry } from "@/types/report";
import { PageHeader } from "@/components/PageHeader";

type Range = "7d" | "30d";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(value))
    .replace(" de ", " ");
}

function displayAction(report: ReportEntry) {
  return report.action.replaceAll("_", " ").toLowerCase();
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function activityLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(new Date(value))
    .replace(".", "");
}

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const [range, setRange] = useState<Range>("7d");
  const { data: recentReports = [], pagination: recentPagination } = useReports({
    initialPage: 1,
    initialLimit: 100,
    syncUrl: false,
  });
  const { pagination: allowedPagination } = useReports({
    initialPage: 1,
    initialLimit: 1,
    initialFilters: { outcome: "allowed" },
    syncUrl: false,
  });
  const { pagination: deniedPagination } = useReports({
    initialPage: 1,
    initialLimit: 1,
    initialFilters: { outcome: "denied" },
    syncUrl: false,
  });

  // O total sai da própria listagem recente — havia uma quarta chamada a
  // `/reports` só para ler `pagination.total` com os mesmos filtros.
  const total = recentPagination?.total ?? 0;
  const allowed = allowedPagination?.total ?? 0;
  const denied = deniedPagination?.total ?? 0;
  const approvalRate = total ? Math.round((allowed / total) * 100) : 0;

  // ponytail: a série vem dos 100 eventos mais recentes já carregados — em
  // volume alto, o range de 30 dias subconta. Trocar por um endpoint de
  // agregação por dia quando o volume justificar.
  const activity = useMemo(() => {
    const days = range === "7d" ? 7 : 30;
    const now = new Date();
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - index - 1));
      const key = date.toISOString().slice(0, 10);
      const count = recentReports.filter(
        (report) => report.created_at.slice(0, 10) === key,
      ).length;
      return {
        label: days === 7 ? activityLabel(date.toISOString()) : `${date.getDate()}`,
        value: count,
      };
    });
  }, [range, recentReports]);

  const summaries = [
    {
      label: "Eventos registrados",
      value: numberFormatter.format(total),
      detail: "no período disponível",
      icon: Activity,
      tone: "text-primary",
    },
    {
      label: "Permitidos",
      value: numberFormatter.format(allowed),
      detail: total ? `${approvalRate}% do total` : "sem registros",
      icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Negados",
      value: numberFormatter.format(denied),
      detail: total ? `${100 - approvalRate}% do total` : "sem registros",
      icon: XCircle,
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      // Antes: "Sessão ativa: 1 usuário autenticado" — um indicador que nunca
      // muda não é indicador.
      label: "Taxa de aprovação",
      value: `${approvalRate}%`,
      detail: total ? "dos eventos foram permitidos" : "sem registros",
      icon: Percent,
      tone: "text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <>
      {/* O `<h1>` é do PageHeader — a view tinha um segundo `<h1>` logo abaixo
          ("Bom dia, ..."), dois títulos concorrendo na mesma tela e dois
          níveis de heading duplicados para leitor de tela. A saudação virou a
          descrição. */}
      <PageHeader
        title="Dashboard"
        description={`${greeting()}, ${currentUser?.name?.split(" ")[0] ?? "Usuário"} — acompanhe o que está acontecendo na sua operação hoje.`}
      />

      <div className="flex flex-col gap-6 pb-4">
        <section aria-label="Resumo dos indicadores" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map(({ label, value, detail, icon: Icon, tone }) => (
            <Card key={label} className="gap-4 py-5 shadow-none">
              <CardHeader className="flex flex-row items-start justify-between px-5 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Atividade</CardTitle>
                <p className="text-sm text-muted-foreground">Eventos processados por dia</p>
              </div>
              <div className="flex items-center rounded-md border border-border p-0.5" aria-label="Período do gráfico">
                <Button type="button" size="sm" variant="toggle" active={range === "7d"} onClick={() => setRange("7d")}>
                  7 dias
                </Button>
                <Button type="button" size="sm" variant="toggle" active={range === "30d"} onClick={() => setRange("30d")}>
                  30 dias
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-5 pt-5 sm:px-5">
              <div className="h-[260px] w-full" aria-label={`Gráfico de atividade dos últimos ${range === "7d" ? "7 dias" : "30 dias"}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickMargin={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={30} />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.25 }}
                      contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", fontSize: 12 }}
                      formatter={(value) => [value, "Eventos"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#activity-fill)" activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0 shadow-none">
            <CardHeader className="flex flex-row items-start justify-between border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">Resumo do acesso</CardTitle>
                <p className="text-sm text-muted-foreground">Distribuição dos eventos</p>
              </div>
              <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-5 py-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Permitidos</span>
                  <span className="font-medium text-foreground">{numberFormatter.format(allowed)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${total ? (allowed / total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Negados</span>
                  <span className="font-medium text-foreground">{numberFormatter.format(denied)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${total ? (denied / total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs leading-5 text-muted-foreground">
                  Os indicadores são atualizados a partir dos eventos de auditoria da organização.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-0 py-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Atividade recente</CardTitle>
              <p className="text-sm text-muted-foreground">Últimos eventos registrados no sistema</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">
                Ver relatório
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5 text-xs uppercase tracking-wide text-muted-foreground">Evento</TableHead>
                  <TableHead className="hidden text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">Entidade</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Resultado</TableHead>
                  <TableHead className="pr-5 text-right text-xs uppercase tracking-wide text-muted-foreground">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.slice(0, 5).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-[240px] pl-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {report.outcome === "allowed" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                        </span>
                        <span className="truncate text-sm font-medium capitalize text-foreground">{displayAction(report)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{report.entity}</TableCell>
                    <TableCell>
                      <Badge variant={report.outcome === "allowed" ? "success" : "danger"}>
                        {report.outcome === "allowed" ? "Permitido" : "Negado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right text-xs text-muted-foreground">{formatDate(report.created_at)}</TableCell>
                  </TableRow>
                ))}
                {recentReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                      Nenhum evento registrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {total > 5 && (
              // Só o contador: os outros dois caminhos para /reports desta
              // mesma tela ("Abrir todos" aqui e "Exportar dados" no rodapé,
              // que não exportava nada) eram o mesmo link repetido três vezes.
              <div className="border-t border-border px-5 py-3">
                <span className="text-xs text-muted-foreground">
                  Mostrando 5 de {numberFormatter.format(total)} eventos
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
