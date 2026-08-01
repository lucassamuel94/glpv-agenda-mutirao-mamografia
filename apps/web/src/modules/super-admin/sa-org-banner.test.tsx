/**
 * O banner é a metade "nunca silencioso" do acesso direto livre
 * (spec 2026-07-28): SA pode navegar o CRM de qualquer org sem grant, mas
 * SEMPRE vendo de qual org se trata e com o caminho de volta ao console.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SaOrgBanner } from "./sa-org-banner";
import { useAuth } from "@/hooks/use-auth";
import { PLATFORM_TENANT_ID } from "@/hooks/use-platform-context";

const push = vi.fn();
let pathname = "/contacts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function setAuth(over: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isSa: () => true,
    currentTenant: { id: "org-1", name: "Minha Empresa LTDA", is_primary: true },
    ...over,
  } as never);
}

describe("SaOrgBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/contacts";
  });

  it("SA no CRM de uma org: mostra o nome e volta ao console", async () => {
    setAuth({});
    render(<SaOrgBanner />);

    expect(screen.getByText(/Minha Empresa LTDA/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /voltar ao console/i }));
    expect(push).toHaveBeenCalledWith("/super-admin");
  });

  it("isCollapsed: renderiza o botão-ícone (Tooltip) e o clique navega para /super-admin", async () => {
    setAuth({});
    render(<SaOrgBanner isCollapsed />);

    const button = screen.getByRole("button");
    await userEvent.setup().click(button);
    expect(push).toHaveBeenCalledWith("/super-admin");
  });

  it("fora do CRM não aparece (guard de world segura)", () => {
    pathname = "/super-admin";
    setAuth({ currentTenant: { id: "org-1", name: "Minha Empresa LTDA", is_primary: true } });
    const { container } = render(<SaOrgBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("no console com Platform não aparece (guard de Platform segura)", () => {
    pathname = "/contacts";
    setAuth({ currentTenant: { id: PLATFORM_TENANT_ID, name: "Platform", is_primary: false } });
    const { container } = render(<SaOrgBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("não-SA nunca vê", () => {
    setAuth({ isSa: () => false });
    const { container } = render(<SaOrgBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
