"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Tooltip } from "@/components/Tooltip";
import { useAuth } from "@/hooks/use-auth";
import { getWorld } from "@/components/sidebar-menu";
import { PLATFORM_TENANT_ID } from "@/hooks/use-platform-context";

/**
 * Banner persistente do SA no mundo CRM: "Você está na organização «nome»".
 *
 * É a contrapartida do acesso direto livre (spec 2026-07-28): o SA pode
 * navegar o CRM de qualquer organização sem grant, mas nunca silenciosamente
 * — sempre com a identificação da org e o caminho de volta ao console.
 *
 * "Voltar ao console" só navega: o guard do console (PlatformGate) é quem
 * recoloca o contexto na Platform.
 */
type SaOrgBannerProps = { isCollapsed?: boolean };

export function SaOrgBanner({ isCollapsed = false }: SaOrgBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSa, currentTenant } = useAuth();

  if (!isSa()) return null;
  if (getWorld(pathname) !== "crm") return null;
  if (!currentTenant || currentTenant.id === PLATFORM_TENANT_ID) return null;

  const goBack = () => router.push("/super-admin");
  const tooltipText = `Você está na organização ${currentTenant.name}. Clique para voltar ao console.`;

  if (isCollapsed) {
    return (
      <div className="flex justify-center mx-2 mb-1" role="status">
        <Tooltip content={tooltipText} side="right">
          <Button
            variant="secondary"
            size="icon"
            onClick={goBack}
            className="h-9 w-9 rounded-lg border-primary/40 text-primary hover:bg-primary/15"
          >
            <Building2 size={18} />
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      // Cor de marca vem de `--primary` (whitelabel por organização), nunca de
      // um indigo fixo: com a cor da org trocada, o banner destoava do resto.
      className="mx-2 my-3 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2 py-2 text-[hsl(var(--sidebar-text))]"
      role="status"
    >
      <p className="text-xs leading-tight truncate" title={tooltipText}>
        Você está na organização{" "}
        <strong className="font-semibold truncate">{currentTenant.name}</strong>
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={goBack}
        className="h-8 w-full justify-center border-primary/40 text-xs hover:bg-primary/15"
      >
        <ArrowLeft size={12} className="mr-1.5 shrink-0" />
        Voltar ao console
      </Button>
    </div>
  );
}
