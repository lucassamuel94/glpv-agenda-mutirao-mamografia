/**
 * Guarda de coerência mundo ⇔ contexto (spec 2026-07-28): SA em rota do CRM
 * com contexto Platform não tem o que ver ali (Platform não tem contatos) —
 * vai para o console. O critério ANTIGO era por rota e papel
 * (pathname === "/" && isSa() && !isViewingAsOrganization): com acesso
 * direto livre, ele devolveria ao console um SA que acabou de escolher
 * "Entrar na organização".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import RequireAuth from "./RequireAuth";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api/auth";
import { PLATFORM_TENANT_ID } from "@/hooks/use-platform-context";

const push = vi.fn();
const replace = vi.fn();
let pathname = "/contacts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => pathname,
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ authApi: { getSetupStatus: vi.fn() } }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedAuthApi = vi.mocked(authApi);

function setAuth(over: Record<string, unknown>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    isHydrated: true,
    user: { id: "u1", name: "User", email: "u@x.com", must_change_password: false },
    isSa: () => false,
    currentTenant: { id: "org-1", name: "Org", is_primary: true },
    ...over,
  } as never);
}

describe("RequireAuth — guarda de coerência mundo ⇔ contexto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/contacts";
    mockedAuthApi.getSetupStatus.mockResolvedValue({ data: { setupRequired: false } });
  });

  it("SA + contexto Platform + rota do CRM → console", () => {
    setAuth({
      isSa: () => true,
      currentTenant: { id: PLATFORM_TENANT_ID, name: "Platform", is_primary: false },
    });
    render(<RequireAuth><p>conteúdo do CRM</p></RequireAuth>);

    expect(replace).toHaveBeenCalledWith("/super-admin");
    expect(screen.queryByText("conteúdo do CRM")).not.toBeInTheDocument();
  });

  it("SA + contexto de org operacional + rota do CRM → fica (acesso direto livre)", () => {
    setAuth({ isSa: () => true });
    render(<RequireAuth><p>conteúdo do CRM</p></RequireAuth>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("conteúdo do CRM")).toBeInTheDocument();
  });

  it("SA em '/' com org operacional NÃO é devolvido ao console (critério antigo morreu)", () => {
    pathname = "/";
    setAuth({ isSa: () => true });
    render(<RequireAuth><p>dashboard</p></RequireAuth>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("não autenticado, setup já feito → login", async () => {
    setAuth({ isAuthenticated: false });
    render(<RequireAuth><p>conteúdo</p></RequireAuth>);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("não autenticado, sem organização cadastrada (primeiro acesso) → setup direto", async () => {
    mockedAuthApi.getSetupStatus.mockResolvedValue({ data: { setupRequired: true } });
    setAuth({ isAuthenticated: false });
    render(<RequireAuth><p>conteúdo</p></RequireAuth>);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/setup"));
  });

  it("não-SA nunca é redirecionado pela guarda", () => {
    setAuth({});
    render(<RequireAuth><p>conteúdo</p></RequireAuth>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("SA + Platform em rota do console (/super-admin/*) NÃO é redirecionado — console é acessível", () => {
    pathname = "/super-admin/audit";
    setAuth({
      isSa: () => true,
      currentTenant: { id: PLATFORM_TENANT_ID, name: "Platform", is_primary: false },
    });
    render(<RequireAuth><p>página do console</p></RequireAuth>);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("página do console")).toBeInTheDocument();
  });
});
