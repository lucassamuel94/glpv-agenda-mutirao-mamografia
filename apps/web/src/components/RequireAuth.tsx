"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getWorld } from "@/components/sidebar-menu";
import { PLATFORM_TENANT_ID } from "@/hooks/use-platform-context";
import { AppBrandMark } from "@/components/AppBrand";
import { ForceChangePasswordScreen } from "@/components/ForceChangePasswordScreen";
import { authApi } from "@/lib/api/auth";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated,
    isLoading,
    isHydrated,
    user,
    isSa,
    currentTenant,
  } = useAuth();
  useEffect(() => {
    // Só verifica após hidratação
    if (!isHydrated) return;

    // Se não está carregando e não está autenticado, redireciona
    if (!isLoading && !isAuthenticated) {
      // Salva a rota atual para redirect após login
      if (pathname && pathname !== "/login") {
        localStorage.setItem("redirect_after_login", pathname);
      }
      // Sem organização cadastrada ainda (primeiro acesso): vai direto para
      // /setup, sem passar por /login — evita o hop extra que Login.tsx faria
      // no mount seguinte.
      authApi.getSetupStatus().then((res) => {
        router.push(res.data?.setupRequired ? "/setup" : "/login");
      });
      return;
    }

    // Guarda de coerência mundo ⇔ contexto (spec 2026-07-28): SA em rota do
    // CRM com contexto Platform → console. A Platform não tem dados de CRM;
    // deixar passar renderia telas vazias/erradas. O critério é o CONTEXTO,
    // não o papel: SA que entrou numa org (contexto operacional) navega o CRM
    // normalmente, com o SaOrgBanner sinalizando onde está.
    if (
      isAuthenticated &&
      isSa() &&
      currentTenant?.id === PLATFORM_TENANT_ID &&
      getWorld(pathname) === "crm"
    ) {
      router.replace("/super-admin");
    }
  }, [
    isAuthenticated,
    isLoading,
    isHydrated,
    pathname,
    isSa,
    currentTenant?.id,
    router,
  ]);

  // Durante SSR, renderiza os children para evitar erro de hidratação
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  // Aguardando hidratação
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground text-sm">Inicializando...</div>
        </div>
      </div>
    );
  }

  // Verificando autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="flex flex-col items-center space-y-4">
          <AppBrandMark className="h-14 opacity-20 animate-pulse" />
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Não autenticado (redireciona via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Autenticado mas deve trocar senha no primeiro acesso
  if (user?.must_change_password) {
    return <ForceChangePasswordScreen />;
  }

  // SA com contexto Platform em rota do CRM: não renderizar enquanto redireciona
  if (isSa() && currentTenant?.id === PLATFORM_TENANT_ID && getWorld(pathname) === "crm") {
    return null;
  }

  // Autenticado - renderiza os children
  return <>{children}</>;
};

export default RequireAuth;
