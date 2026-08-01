"use client";

import React from "react";
import { Building2, Mail, ShieldCheck, UserPlus, UserRound } from "lucide-react";

interface UserDialogHeroProps {
  mode: "create" | "edit";
  name?: string;
  email?: string;
  role?: string;
  description: string;
}

export function UserDialogHero({
  mode,
  name,
  email,
  role,
  description,
}: UserDialogHeroProps) {
  const isCreate = mode === "create";

  return (
    <section className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20">
          {isCreate ? <UserPlus size={25} aria-hidden="true" /> : <UserRound size={25} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {name || (isCreate ? "Novo usuário" : "Usuário")}
            </h3>
            {role && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <ShieldCheck size={13} aria-hidden="true" />
                {role}
              </span>
            )}
          </div>
          {email && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail size={14} aria-hidden="true" />
              {email}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}

export function UserDialogSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function OrganizationDialogHero({
  mode,
  name,
  cnpj,
  status,
  description,
}: {
  mode: "create" | "edit";
  name?: string;
  cnpj?: string;
  status?: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-2 ring-background">
          <Building2 size={25} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {name || (mode === "create" ? "Nova organização" : "Organização")}
            </h3>
            {status && (
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {status}
              </span>
            )}
          </div>
          {cnpj && <p className="mt-1 text-sm text-muted-foreground">CNPJ: {cnpj}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}
