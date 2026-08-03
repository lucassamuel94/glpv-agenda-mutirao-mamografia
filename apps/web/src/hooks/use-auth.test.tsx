import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api/auth";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

vi.mock("@/lib/api/auth", () => ({
  authApi: {
    checkAuth: vi.fn(),
    getBranding: vi.fn().mockResolvedValue({ data: undefined }),
  },
}));

const checkAuth = vi.mocked(authApi.checkAuth);

function profileWith(organization: Record<string, unknown>, preferences?: Record<string, unknown>) {
  return {
    data: {
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@example.com",
        role: "SUPER_ADMIN",
        preferences,
      },
      organizations: [organization],
    },
  } as never;
}

function Probe() {
  const { currentTenant, orgBranding } = useAuth();
  return (
    <>
      <span data-testid="tenant">{currentTenant?.id ?? "nenhum"}</span>
      <span data-testid="favicon">{orgBranding?.faviconUrl ?? "nenhum"}</span>
      <span data-testid="cor">{orgBranding?.primaryColor ?? "nenhuma"}</span>
      <span data-testid="densidade">{orgBranding?.density ?? "nenhuma"}</span>
    </>
  );
}

function renderApp() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe("AuthProvider — branding da organização", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.clearAllMocks();
  });

  it("adota a primeira organização quando nenhuma vem marcada como atual (caso Super Admin)", async () => {
    checkAuth.mockResolvedValue(
      profileWith({ id: "org-1", name: "Org", is_primary: true, is_current: false }),
    );
    renderApp();

    await waitFor(() =>
      expect(screen.getByTestId("tenant")).toHaveTextContent("org-1"),
    );
  });

  it("expõe o favicon da organização atual", async () => {
    checkAuth.mockResolvedValue(
      profileWith({
        id: "org-1",
        name: "Org",
        is_primary: true,
        is_current: true,
        faviconUrl: "data:image/png;base64,AAA",
      }),
    );
    renderApp();

    await waitFor(() =>
      expect(screen.getByTestId("favicon")).toHaveTextContent(
        "data:image/png;base64,AAA",
      ),
    );
  });

  it("aplica o tema da organização quando o usuário não escolheu nenhum", async () => {
    checkAuth.mockResolvedValue(
      profileWith({
        id: "org-1",
        name: "Org",
        is_primary: true,
        is_current: true,
        theme: "dark",
      }),
    );
    renderApp();

    await waitFor(() =>
      expect(document.documentElement).toHaveClass("dark"),
    );
  });

  it("preferência do usuário vence o tema da organização", async () => {
    checkAuth.mockResolvedValue(
      profileWith(
        { id: "org-1", name: "Org", is_primary: true, is_current: true, theme: "dark" },
        { theme: "light" },
      ),
    );
    renderApp();

    await waitFor(() =>
      expect(screen.getByTestId("tenant")).toHaveTextContent("org-1"),
    );
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("na Platform (sem white label) o branding vem do endpoint público", async () => {
    checkAuth.mockResolvedValue(
      profileWith({
        id: "00000000-0000-0000-0000-000000000001",
        name: "Platform",
        is_primary: true,
        is_current: true,
        status: "SYSTEM",
      }),
    );
    vi.mocked(authApi.getBranding).mockResolvedValue({
      data: {
        organizationName: "Grupo Luta Pela Vida",
        primaryColor: "#ffc303",
        faviconUrl: "data:image/png;base64,PUB",
        density: "compact",
      },
    } as never);

    renderApp();

    await waitFor(() =>
      expect(screen.getByTestId("cor")).toHaveTextContent("#ffc303"),
    );
    expect(screen.getByTestId("favicon")).toHaveTextContent(
      "data:image/png;base64,PUB",
    );
    expect(screen.getByTestId("densidade")).toHaveTextContent("compact");
  });
});
