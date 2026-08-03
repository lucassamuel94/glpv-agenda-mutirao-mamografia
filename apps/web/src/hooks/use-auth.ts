"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { mutate } from "swr";
import { authApi } from "@/lib/api/auth";
import type { ApiResponse } from "@/lib/api/base";
import type {
  AuthProfileResponse,
  OrganizationSummary,
  PublicBrandingResponse,
  UserPreferences,
} from "@/types/auth";
import { can, SA_ROLES } from "@/lib/permissions";
import { applyBrandingColor, applyBrandingFavicon } from "@/lib/branding";
import {
  LOGIN_THEME_STORAGE_KEY,
  useTheme,
} from "@/providers/ThemeProvider";

/** Alinhado ao backend: backend/src/common/enums/user-role.enum.ts */
export type UserRole =
  | "SUPER_ADMIN"
  | "SA_MASTER"
  | "SA_BILLING"
  | "SA_USER"
  | "ADMIN"
  | "MANAGER"
  | "COORDINATOR"
  | "USER";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  organization_id?: string;
  role?: UserRole;
  must_change_password?: boolean;
  preferences?: UserPreferences;
  organizations?: OrganizationSummary[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  userRole: UserRole | null;
}

/** Chave localStorage usada em versões antigas para marcar "visualizando como";
 *  mantida apenas para limpeza na hidratação. Removida: o único caminho
 *  cross-tenant hoje é `switch-organization`, sem estado local próprio. */
const SA_VIEWING_KEY = "sa_viewing_as_organization_id";

type AuthContextValue = AuthState & {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; isSa?: boolean }>;
  logout: () => Promise<void>;
  switchOrganization: (
    organizationId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserData: (data: Partial<User>) => void;
  updateProfile: (payload: {
    name?: string;
    newPassword?: string;
    preferences?: {
      theme?: string;
      defaultDateRange?: string | null;
      primaryColor?: string | null;
    };
    avatarUrl?: string;
  }) => Promise<
    ApiResponse<{
      user?: { name: string; email: string; avatar_url?: string | null };
      message?: string;
    }>
  >;
  hasRole: (role: UserRole) => boolean;
  /** True se o usuário é Super Admin (qualquer sub-role) */
  isSa: () => boolean;
  isAdmin: () => boolean;
  /** True se o usuário possui ao menos uma das permissões (áreas de lib/permissions). SA ⇒ tudo. */
  hasPermission: (perms: string[]) => boolean;
  currentTenant: OrganizationSummary | null;
  /** Branding resolvido: da organização atual se logado, senão da organização
   *  pública da instância (whitelabel pré-login — ver /auth/branding). */
  orgBranding: {
    primaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    /** Defaults de interface da organização; preferência do usuário sobrepõe. */
    density?: "compact" | "comfortable" | "spacious";
    theme?: "light" | "dark" | "system";
  } | null;
};

const VALID_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "SA_MASTER",
  "SA_BILLING",
  "SA_USER",
  "ADMIN",
  "MANAGER",
  "COORDINATOR",
  "USER",
];

/**
 * Organização "atual" — UMA definição para todo o hook. O login gravava
 * `app_tenant` com `find(is_current) ?? organizations[0]` enquanto o
 * `currentTenant` da UI usava `find(is_current) || null`: divergiam justamente
 * no Super Admin, cujo JWT aponta para a organização SYSTEM (que não entra
 * nesta lista), e a UI ficava sem tenant — sem cor, sem logo, sem favicon.
 */
function pickCurrentOrganization(
  organizations: OrganizationSummary[] | undefined,
): OrganizationSummary | null {
  if (!organizations?.length) return null;
  return organizations.find((c) => c.is_current === true) ?? organizations[0];
}

function parseRole(raw: string | null | undefined): UserRole | null {
  return raw && (VALID_ROLES as string[]).includes(raw) ? (raw as UserRole) : null;
}

/** Exportado para permitir provider mockado em stories/testes. */
export const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,
  userRole: null,
};

/**
 * Provider que mantém o estado de autenticação em um único lugar.
 * O GET /auth/check é chamado apenas uma vez ao montar (quando há token).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [authState, setAuthState] = useState<AuthState>(INITIAL_STATE);
  const [publicBranding, setPublicBranding] =
    useState<PublicBrandingResponse | null>(null);

  // Hidratação: marca que já estamos no CLIENTE. É o caso em que o efeito é a
  // única ferramenta possível — no servidor ele não roda, e é essa diferença que
  // se quer capturar. Derivar no render daria `true` no HTML do servidor e
  // quebraria a hidratação.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthState((prev) => ({ ...prev, isHydrated: true }));
  }, []);

  /**
   * Verificar autenticação ao carregar — executado uma única vez por app.
   * Sessão vive num cookie httpOnly: invisível pro JS, então não dá pra
   * checar "existe token?" antes de chamar a API — GET /auth/check é a
   * única forma de saber se há sessão válida (o cookie, se existir, vai
   * junto automaticamente via `credentials: "include"`).
   */
  useEffect(() => {
    if (!authState.isHydrated) return;

    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response = await authApi.checkAuth();
        if (cancelled) return;

        if (!response.data) {
          setAuthState({ ...INITIAL_STATE, isHydrated: true, isLoading: false });
          return;
        }

        const userRole = parseRole(response.data.user.role);
        setAuthState({
          user: {
            id: response.data.user.id || "",
            email: response.data.user.email || "",
            name: response.data.user.name || "",
            avatarUrl: response.data.user.avatarUrl,
            role: userRole || undefined,
            must_change_password:
              response.data.user.must_change_password === true,
            preferences: response.data.user.preferences,
            organizations: response.data.organizations,
          },
          isAuthenticated: true,
          isLoading: false,
          isHydrated: true,
          userRole,
        });
      } catch {
        if (!cancelled) {
          setAuthState({ ...INITIAL_STATE, isHydrated: true, isLoading: false });
        }
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [authState.isHydrated]);

  const switchOrganization = useCallback(async (organizationId: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.switchOrganization(organizationId);
      if (response.data) {
        // Backend já trocou o cookie httpOnly pro token da nova organização;
        // busca o perfil atualizado (role muda por organização).
        const profile = await authApi.checkAuth();
        if (profile.data) {
          const userRole = parseRole(profile.data.user.role);
          const organizations = profile.data.organizations ?? [];
          const newCurrent = organizations.find((c) => c.id === organizationId);
          setAuthState((prev) => ({
            ...prev,
            user: {
              id: profile.data!.user.id || "",
              email: profile.data!.user.email || "",
              name: profile.data!.user.name || "",
              avatarUrl: profile.data!.user.avatarUrl,
              role: userRole || undefined,
              must_change_password:
                (profile.data as AuthProfileResponse).user
                  ?.must_change_password === true,
              preferences: profile.data!.user.preferences,
              organizations,
            },
            isLoading: false,
            isAuthenticated: true,
            isHydrated: true,
            userRole,
          }));
          if (typeof window !== "undefined" && newCurrent) {
            const tenant = {
              id: newCurrent.id,
              name: newCurrent.name,
              is_primary: newCurrent.is_primary ?? false,
              is_current: true,
              plan: newCurrent.plan,
              primaryColor: newCurrent.primaryColor,
              logoUrl: newCurrent.logoUrl,
            };
            localStorage.setItem("app_tenant", JSON.stringify(tenant));
            window.dispatchEvent(
              new CustomEvent("app-tenant-update", { detail: tenant }),
            );
          }
          mutate(() => true);
          return { success: true };
        }
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: response.error };
    } catch {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: "Erro ao trocar de organização" };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.login(email, password);
      if (response.data?.access_token) {
        const userRole = parseRole(response.data.user?.role);
        const userData = response.data.user;
        const organizations = response.data.organizations ?? [];
        const current = pickCurrentOrganization(organizations);
        setAuthState({
          user: {
            id: userData?.id ?? "",
            email: userData?.email ?? "",
            name: userData?.name ?? "",
            avatarUrl: userData?.avatarUrl,
            role: userRole || undefined,
            must_change_password:
              response.data.user?.must_change_password === true,
            preferences: userData?.preferences,
            organizations,
          },
          isAuthenticated: true,
          isLoading: false,
          isHydrated: true,
          userRole,
        });
        if (typeof window !== "undefined" && current) {
          localStorage.setItem(
            "app_tenant",
            JSON.stringify({
              id: current.id,
              name: current.name,
              is_primary: current.is_primary ?? false,
              is_current: true,
              plan: current.plan,
              primaryColor: current.primaryColor,
              logoUrl: current.logoUrl,
            }),
          );
        }
        const isSa = !!userRole && SA_ROLES.includes(userRole);
        return { success: true, isSa: !!isSa };
      }
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: response.error };
    } catch {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: "Erro ao fazer login" };
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState({ ...INITIAL_STATE, isHydrated: true });
    await authApi.logout().catch(() => {});
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const updateUserData = useCallback((updatedData: Partial<User>) => {
    setAuthState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updatedData } : null,
    }));
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      name?: string;
      newPassword?: string;
      preferences?: UserPreferences;
      avatarUrl?: string;
    }) => {
      const response = await authApi.updateProfile(payload);
      if (response.data?.user) {
        updateUserData({
          name: response.data.user.name,
          email: response.data.user.email,
          avatarUrl: response.data.user.avatar_url ?? undefined,
          must_change_password: false,
          // A resposta do backend não devolve `preferences` — o payload
          // enviado É a nova preferência (mesma sessão, sem round-trip).
          ...(payload.preferences && { preferences: payload.preferences }),
        });
      }
      return response;
    },
    [updateUserData],
  );

  const hasRole = useCallback(
    (requiredRole: UserRole) => authState.userRole === requiredRole,
    [authState.userRole],
  );

  const isSa = useCallback(
    () => !!authState.userRole && SA_ROLES.includes(authState.userRole),
    [authState.userRole],
  );

  const isAdmin = useCallback(
    () =>
      authState.userRole === "ADMIN" ||
      (!!authState.userRole && SA_ROLES.includes(authState.userRole)),
    [authState.userRole],
  );

  const hasPermission = useCallback(
    (perms: string[]) => can(authState.userRole, perms),
    [authState.userRole],
  );

  const currentTenant = useMemo(
    () => pickCurrentOrganization(authState.user?.organizations),
    [authState.user?.organizations],
  );

  /**
   * Branding pré-login: só existe organização "atual" depois de autenticar,
   * então telas como Login/Setup dependem do endpoint público. Busca uma
   * única vez quando fica claro que não há sessão (evita disparo redundante
   * enquanto `checkAuth` ainda está resolvendo o token).
   */
  useEffect(() => {
    if (!authState.isHydrated || authState.isLoading) return;
    // A condição é ter COR, não ter organização: o Super Admin aterrissa na
    // Platform (`PLATFORM_TENANT_ID`, ver auth.service.ts), que é uma
    // organização de verdade na lista mas não tem white label. Sem esta busca
    // ele veria a cor padrão em vez da escolhida no /setup.
    if (authState.isAuthenticated && currentTenant?.primaryColor) return;
    let cancelled = false;
    authApi.getBranding().then((res) => {
      if (cancelled || !res.data) return;
      setPublicBranding(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [
    authState.isHydrated,
    authState.isLoading,
    authState.isAuthenticated,
    currentTenant,
  ]);

  // Cor pessoal do usuário (Preferências → Minha conta) sobrepõe o branding
  // da organização/instância — mesmo mecanismo (`applyBrandingColor`), só
  // muda a fonte da cor.
  // Composição por CAMPO, não escolha de fonte: a organização atual pode ser a
  // Platform, que existe na lista mas não tem white label nenhum. Escolher
  // "tenant ou público" em bloco deixava o Super Admin sem cor, logo e favicon.
  const orgBranding = useMemo(() => {
    const userColor = authState.user?.preferences?.primaryColor || undefined;
    return {
      primaryColor:
        userColor ?? currentTenant?.primaryColor ?? publicBranding?.primaryColor,
      logoUrl: currentTenant?.logoUrl ?? publicBranding?.logoUrl,
      faviconUrl: currentTenant?.faviconUrl ?? publicBranding?.faviconUrl,
      density: currentTenant?.density ?? publicBranding?.density,
      theme: currentTenant?.theme ?? publicBranding?.theme,
    };
  }, [currentTenant, publicBranding, authState.user?.preferences?.primaryColor]);

  // Sincroniza com o DOM (CSS vars + favicon) — sistema externo, efeito é a
  // ferramenta certa aqui. O favicon sai do mesmo `orgBranding` que a cor: até
  // então só o branding público era aplicado, então o favicon da organização
  // sumia assim que o usuário logava.
  useEffect(() => {
    applyBrandingColor(orgBranding?.primaryColor);
    applyBrandingFavicon(orgBranding?.faviconUrl);
  }, [orgBranding]);

  /**
   * Tema padrão da organização (escolhido no /setup). Só vale como DEFAULT:
   * qualquer sinal de escolha explícita do usuário — preferência salva no
   * perfil, toggle da tela de login, ou tema já gravado em `app_user` — vence.
   * O ThemeProvider não pode ler isto sozinho: ele monta ACIMA do
   * AuthProvider (`app/layout.tsx`) e não enxerga a organização.
   */
  useEffect(() => {
    const organizationTheme = orgBranding?.theme;
    if (!organizationTheme || organizationTheme === "system") return;
    if (authState.user?.preferences?.theme) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LOGIN_THEME_STORAGE_KEY)) return;
    try {
      const storedUser = localStorage.getItem("app_user");
      if (storedUser && JSON.parse(storedUser)?.theme) return;
    } catch {
      // app_user corrompido: trata como "sem escolha do usuário"
    }
    setTheme(organizationTheme);
  }, [orgBranding?.theme, authState.user?.preferences?.theme, setTheme]);

  /**
   * Limpa o marcador legacy de "visualizando como" (versões antigas gravavam
   * em localStorage). Não é estado derivado: é escrita em sistema externo,
   * que é o uso correto de efeito.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SA_VIEWING_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login,
      logout,
      switchOrganization,
      updateUserData,
      updateProfile,
      hasRole,
      isSa,
      isAdmin,
      hasPermission,
      currentTenant,
      orgBranding,
    }),
    [
      authState,
      login,
      logout,
      switchOrganization,
      updateUserData,
      updateProfile,
      hasRole,
      isSa,
      isAdmin,
      hasPermission,
      currentTenant,
      orgBranding,
    ],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}
