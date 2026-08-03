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
    document.documentElement.classList.remove("theme-transitioning");
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

  /**
   * REGRESSÃO da tela em branco na troca de tema.
   *
   * Sintoma medido em gravação: a troca de tema usava a View Transitions API
   * pra um reveal circular; qualquer render do React na janela em que o
   * browser tirava o snapshot "novo" (mesmo só o ícone sol/lua trocando)
   * competia com o crossfade padrão do browser e travava a tela num cinza
   * plano no meio da troca (`rgb(129,129,129)`, medido) ou cortava o círculo
   * antes de cobrir a tela — sem combinação de timing confiável. O reveal foi
   * removido; a troca de tema agora só troca a classe `.dark`, sem animação.
   *
   * Causa correlata (já corrigida antes da remoção do reveal, mantida coberta
   * porque é sobre a persistência do usuário, não sobre a animação):
   * `setTheme` reconstruía `app_user` a partir do storage e disparava
   * `app-user-update` SINCRONAMENTE. O listener do Sidebar espalha o payload
   * sobre o usuário da sessão e força outro render; com `app_user` sem
   * `role`, `can()` devolve `false` para tudo e o menu inteiro cai em
   * `visibleItems.length === 0 → return null`.
   */
  describe("regressão: troca de tema não pode transmitir usuário", () => {
    it("não dispara app-user-update ao trocar o tema", async () => {
      const listener = vi.fn();
      window.addEventListener("app-user-update", listener);

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );
      await waitFor(() => {
        expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      });

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

      expect(listener).not.toHaveBeenCalled();
      window.removeEventListener("app-user-update", listener);
    });

    /** Gravar `{...user, theme}` com `user` nulo produzia `{theme}` puro. */
    it("não substitui app_user por um objeto só com o tema", async () => {
      pathname.current = "/clinics";
      localStorage.removeItem("app_user");

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

      expect(localStorage.getItem("app_user")).toBeNull();
    });

    /** O `role` é o campo cuja perda apagava o menu — a sessão não pode perdê-lo. */
    it("preserva os campos do usuário ao persistir o tema", async () => {
      pathname.current = "/clinics";
      localStorage.setItem(
        "app_user",
        JSON.stringify({ id: "u1", name: "Ana", role: "ADMIN", theme: "light" }),
      );

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem("app_user") as string);
        // O script anti-FOUC do layout.tsx lê `app_user.theme` em rota
        // protegida, então a persistência tem de continuar acontecendo...
        expect(stored.theme).toBe("dark");
        // ...sem levar embora o resto do usuário.
        expect(stored).toMatchObject({ id: "u1", name: "Ana", role: "ADMIN" });
      });
    });
  });
});
