"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  BarChart3,
  Hospital,
  ListChecks,
  SearchX,
  ScrollText,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateKind =
  "search"
  | "patients"
  | "clinics"
  | "organizations"
  | "users"
  | "agenda"
  | "waiting-list"
  | "audit"
  | "reports";

export type EmptyStateMode = "no-data" | "no-results" | "no-availability";

const KIND_ICONS: Record<EmptyStateKind, LucideIcon> = {
  search: SearchX,
  patients: UserRound,
  clinics: Hospital,
  organizations: Building2,
  users: UsersRound,
  agenda: CalendarDays,
  "waiting-list": ListChecks,
  audit: ScrollText,
  reports: BarChart3,
};

const KIND_TONES: Record<EmptyStateKind, string> = {
  search: "bg-primary/10 text-primary dark:bg-primary/20",
  patients: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  clinics: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  organizations: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  users: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  agenda: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "waiting-list": "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  audit: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  reports: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
};

export function EmptyStateIllustration({
  kind,
  mode,
  animated = true,
}: {
  kind: EmptyStateKind;
  mode: EmptyStateMode;
  animated?: boolean;
}) {
  const Icon = KIND_ICONS[kind];

  return (
    <div
      aria-hidden="true"
      data-testid="empty-state-illustration"
      data-empty-state-kind={kind}
      data-empty-state-mode={mode}
      className={cn(
        "empty-state-illustration",
        animated && "empty-state-illustration-enter",
      )}
    >
      <div className="empty-state-illustration__layer empty-state-illustration__layer--back" />
      <div className="empty-state-illustration__layer empty-state-illustration__layer--middle" />
      <div className="empty-state-illustration__card">
        <div className={cn("empty-state-illustration__icon", KIND_TONES[kind])}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div className="empty-state-illustration__lines">
          <span className="empty-state-illustration__line empty-state-illustration__line--strong" />
          <span className="empty-state-illustration__line empty-state-illustration__line--short" />
          <span className="empty-state-illustration__line empty-state-illustration__line--faint" />
        </div>
      </div>
    </div>
  );
}
