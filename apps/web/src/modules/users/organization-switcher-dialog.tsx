"use client";

import React, { useState, useEffect } from "react";
import { Building2, Check } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";
import { superAdminApi } from "@/lib/api/super-admin";
import { EmptyState } from "@/modules/common/empty-state";

interface OrganizationSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationSwitcherDialog({
  open,
  onOpenChange,
}: OrganizationSwitcherDialogProps) {
  const { currentTenant, user: currentUser, switchOrganization, isSa } = useAuth();
  const isSaUser = isSa();

  const [saOrganizations, setSaOrganizations] = useState<Array<{
    id: string;
    name: string;
    plan?: string;
    status?: string;
    is_primary?: boolean;
    is_current?: boolean;
  }>>([]);
  const [loadingSaOrganizations, setLoadingSaOrganizations] = useState(false);

  // Busca as organizações ao abrir — efeito legítimo. O setState que a regra
  // aponta é o flag de loading ligado antes do await.
  useEffect(() => {
    if (!open || !isSaUser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSaOrganizations(true);
    superAdminApi
      .getStats()
      .then((res) => {
        if (res.data?.organizations) {
          setSaOrganizations(
            res.data.organizations
              // Platform (SYSTEM) é infraestrutura — nunca é destino de troca
              // (spec 2026-07-28: invisível na UI). O backend já filtra nas stats
              // (Task 1); este filtro é defesa local para listas vindas de outras
              // fontes (ex.: organizations do /auth/check, que PRECISA conter a
              // Platform para o currentTenant do console funcionar).
              .filter((c) => c.status !== "SYSTEM")
              .map((c, index) => ({
                id: c.id,
                name: c.name,
                plan: c.plan,
                status: c.status,
                is_primary: index === 0,
                is_current: c.id === currentTenant?.id,
              })),
          );
        } else {
          setSaOrganizations([]);
        }
      })
      .catch(() => setSaOrganizations([]))
      .finally(() => setLoadingSaOrganizations(false));
  }, [open, isSaUser, currentTenant?.id]);

  const organizations = isSaUser
    ? saOrganizations
    // Platform (SYSTEM) é infraestrutura — nunca é destino de troca (spec
    // 2026-07-28). O /auth/check PRECISA conter a Platform para o
    // currentTenant do console funcionar, então o filtro é aplicado aqui.
    : (currentUser?.organizations ?? []).filter((o) => o.status !== "SYSTEM");
  const isActivation = (status?: string) => status === "ACTIVATION";

  const handleSelect = async (organizationId: string) => {
    if (organizationId === currentTenant?.id) {
      onOpenChange(false);
      return;
    }
    const result = await switchOrganization(organizationId);
    if (result.success) {
      onOpenChange(false);
    } else if (result.error) {
      toast(result.error, "error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Trocar organização"
      maxWidth="sm"
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {isSaUser
            ? "Selecione qualquer organização do sistema para acessar no contexto dela."
            : "Selecione a organização que deseja acessar."}
        </p>

        {loadingSaOrganizations ? (
          <p className="text-sm text-muted-foreground py-4">Carregando organizações...</p>
        ) : organizations.length === 0 ? (
          <EmptyState
            kind="organizations"
            mode="no-data"
            compact
            title={isSaUser ? "Nenhuma organização cadastrada" : "Nenhuma organização disponível"}
            description={isSaUser ? "Não há organizações para acessar neste momento." : "Seu acesso ainda não está vinculado a uma organização."}
            className="border-0 bg-transparent px-0 shadow-none"
          />
        ) : (
        <ul className="space-y-2">
          {organizations.map((c) => {
            const isCurrent = c.id === currentTenant?.id;
            const inActivation = isActivation(c.status);
            const canSwitch = isSaUser || !inActivation;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => canSwitch && handleSelect(c.id)}
                  disabled={!canSwitch}
                  className={`w-full h-auto flex items-center gap-3 rounded-lg border px-6 py-4 text-left transition-colors ${
                    !canSwitch
                      ? "cursor-not-allowed border-border bg-muted/50 opacity-90"
                      : isCurrent
                        ? "border-primary bg-primary/10 hover:bg-primary/15"
                        : "border-border bg-card hover:bg-secondary hover:border-primary/50"
                  }`}
                >
                  <Building2
                    size={20}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground block truncate">
                      {c.name}
                    </span>
                    {inActivation ? (
                      <span className="text-sm text-amber-600 dark:text-amber-400 mt-0.5 block">
                        Em processo de ativação
                      </span>
                    ) : (
                      c.plan && (
                        <span className="text-sm text-muted-foreground">
                          {c.plan}
                        </span>
                      )
                    )}
                  </div>
                  {isCurrent && (
                    <Check
                      size={20}
                      className="text-primary flex-shrink-0"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        )}
      </div>
    </Dialog>
  );
}
