"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlatformContext } from "@/hooks/use-platform-context";

/**
 * Garante a metade console da regra mundo ⇔ contexto (spec 2026-07-28):
 * toda rota /super-admin/* opera com contexto = Platform tenant.
 *
 * `usePlatformContext` faz o trabalho (SA fora da Platform → switch
 * transparente, igual grants/audit já faziam por conta própria); o gate só
 * decide o que renderizar em cada estado. Aplicado uma única vez no layout
 * `app/(protected)/super-admin/layout.tsx` — páginas do console não precisam
 * (e não devem) repetir o gating.
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isReady } = usePlatformContext();

  useEffect(() => {
    if (status === "forbidden") router.replace("/");
  }, [status, router]);

  if (status === "forbidden") return null;

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
