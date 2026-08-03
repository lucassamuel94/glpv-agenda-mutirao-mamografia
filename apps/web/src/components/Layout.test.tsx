import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Layout from "./Layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/contacts",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("./Sidebar", () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => (
    <aside id="app-sidebar" aria-label="Navegação principal" data-open={isOpen}>
      <button onClick={onClose}>Fechar menu</button>
    </aside>
  ),
}));
vi.mock("@/services/helpData", () => ({
  getHelpContent: () => ({ title: "Ajuda", description: "", features: [] }),
}));
vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));
// `NewBookingButton` (system tray) usa `<Can>` -> `useAuth()` pra gate de
// permissão; sem provider real nos testes de Layout, precisa do stub.
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

describe("Layout", () => {
  it("abre o drawer, expõe seu estado e devolve o foco ao acionador", () => {
    localStorage.clear();
    render(<Layout title="Contatos">Conteúdo</Layout>);

    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "app-sidebar");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("complementary", { name: "Navegação principal" }),
    ).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("fecha o drawer por Escape e preserva o atalho de recolhimento", () => {
    localStorage.clear();
    render(<Layout title="Contatos">Conteúdo</Layout>);
    const trigger = screen.getByRole("button", { name: "Abrir menu" });

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("complementary", { name: "Navegação principal" }),
    ).toHaveAttribute("data-open", "false");
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(window, { key: "b", metaKey: true });
    expect(localStorage.getItem("app_sidebar_collapsed")).toBe("true");
  });

  it("recolhe e expande a sidebar pelo controle do topbar", () => {
    localStorage.clear();
    render(<Layout title="Contatos">Conteúdo</Layout>);

    const toggle = screen.getByRole("button", { name: "Recolher menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", "app-sidebar");

    fireEvent.click(toggle);
    expect(localStorage.getItem("app_sidebar_collapsed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Expandir menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("permite conteúdo sticky sem prender a moldura à altura do viewport", () => {
    localStorage.clear();
    render(
      <Layout title="Contatos" stickyFriendly>
        Conteúdo
      </Layout>,
    );

    const shell = document.querySelector("main");
    expect(shell).toHaveClass("overflow-visible", "min-h-screen", "h-auto");
    expect(shell).not.toHaveClass(
      "overflow-hidden",
      "h-[100dvh]",
      "md:h-[calc(100dvh-1rem)]",
    );
  });
});
