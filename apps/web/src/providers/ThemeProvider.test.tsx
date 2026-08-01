import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

const pathname = vi.hoisted(() => ({ current: "/login" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

const ThemeValue = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <output data-testid="theme">{theme}</output>
      <button type="button" onClick={() => toggleTheme()}>
        Alternar tema
      </button>
    </>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    pathname.current = "/login";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it("segue o tema do sistema no login, mesmo com preferência salva", async () => {
    localStorage.setItem("app_user", JSON.stringify({ theme: "light" }));

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("usa o tema já aplicado no documento no primeiro render do login", () => {
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("prioriza a preferência manual salva para o login", async () => {
    localStorage.setItem("app_login_theme", "light");

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  it("salva a escolha manual feita no login", async () => {
    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

    expect(localStorage.getItem("app_login_theme")).toBe("light");
  });

  it("mantém no sistema a preferência escolhida no login", async () => {
    pathname.current = "/contacts";
    localStorage.setItem("app_login_theme", "light");

    render(
      <ThemeProvider>
        <ThemeValue />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });
});
