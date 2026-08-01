"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/hooks/use-auth";
import { SA_ROLES } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminAuditView from "@/views/AdminAudit";

/**
 * Rota /super-admin/audit — painel de consulta ao audit log.
 *
 * Requer role SA + contexto = Platform tenant. O switch para a Platform é
 * garantido pelo layout (PlatformGate) — ver src/app/(protected)/super-admin/layout.tsx.
 */
export default function SuperAdminAuditRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role ?? null;
  const isSa = role && SA_ROLES.includes(role);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isSa) {
      router.replace("/");
      return;
    }
  }, [user, isSa, isLoading, router]);

  if (isLoading || !user || !isSa) {
    return null;
  }

  return <AdminAuditView />;
}
