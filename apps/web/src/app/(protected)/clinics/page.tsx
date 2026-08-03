"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/hooks/use-auth";
import { SA_ROLES } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ClinicsPage from "@/views/Clinics";

export default function ClinicsRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role ?? null;
  const isSa = role && SA_ROLES.includes(role);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isSa) router.replace("/");
  }, [user, isSa, isLoading, router]);

  if (isLoading || !user || !isSa) return null;

  return <ClinicsPage />;
}
