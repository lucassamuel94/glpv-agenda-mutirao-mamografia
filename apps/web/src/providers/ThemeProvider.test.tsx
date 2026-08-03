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
   * A piscada no sidebar vinha do snapshot "novo" da view transition ser
   * capturado enquanto os itens ainda estavam no meio do `transition-colors` de
   * 150ms: o reveal mostrava as cores antigas e, ao remover o overlay, o DOM real
   * aparecia já na cor final. A classe desliga esses tweens durante a transição.
   */
  describe("supressão de transições durante o reveal do tema", () => {
    /** Só reduced-motion responde `false`; o resto segue o padrão do arquivo. */
    function stubMatchMediaAllowingMotion() {
      vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
          matches: !query.includes("prefers-reduced-motion"),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );
    }

    function stubViewTransition() {
      let settle: () => void = () => {};
      const finished = new Promise<void>((resolve) => {
        settle = resolve;
      });

      const startViewTransition = vi.fn((callback: () => void) => {
        callback();
        return {
          finished,
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition: () => {},
        };
      });

      Object.defineProperty(document, "startViewTransition", {
        value: startViewTransition,
        configurable: true,
        writable: true,
      });

      return { settle, startViewTransition };
    }

    it("marca o documento durante a transição e limpa ao terminar", async () => {
      stubMatchMediaAllowingMotion();
      const { settle } = stubViewTransition();

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

      // Enquanto a transição corre, nenhum tween por elemento deve valer.
      expect(document.documentElement).toHaveClass("theme-transitioning");

      settle();
      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass("theme-transitioning");
      });
    });

    /** Classe presa desabilitaria hover/foco animado no app inteiro. */
    it("limpa a marca mesmo se a transição for abortada", async () => {
      stubMatchMediaAllowingMotion();
      let reject: (reason?: unknown) => void = () => {};
      const finished = new Promise<void>((_resolve, r) => {
        reject = r;
      });
      Object.defineProperty(document, "startViewTransition", {
        value: vi.fn((callback: () => void) => {
          callback();
          return {
            finished,
            ready: Promise.resolve(),
            updateCallbackDone: Promise.resolve(),
            skipTransition: () => {},
          };
        }),
        configurable: true,
        writable: true,
      });

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));
      expect(document.documentElement).toHaveClass("theme-transitioning");

      reject(new Error("transição abortada"));
      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass("theme-transitioning");
      });
    });

    it("não marca o documento quando o usuário pediu menos movimento", () => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockReturnValue({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      );
      const { startViewTransition } = stubViewTransition();

      render(
        <ThemeProvider>
          <ThemeValue />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Alternar tema" }));

      expect(startViewTransition).not.toHaveBeenCalled();
      expect(document.documentElement).not.toHaveClass("theme-transitioning");
    });
  });

  /**
   * REGRESSÃO da tela em branco na troca de tema.
   *
   * Sintoma medido na gravação: durante o reveal, a área revelada saía cinza
   * `#B8B8B8` com desvio 0.0 — plana, sem um pixel de conteúdo — e no fim o tema
   * voltava ao anterior.
   *
   * Causa: `setTheme` reconstruía `app_user` a partir do storage e disparava
   * `app-user-update` SINCRONAMENTE, portanto dentro do `flushSync` dentro do
   * callback da view transition. O listener do Sidebar espalha o payload sobre o
   * usuário da sessão e força outro render no meio do flush; com `app_user` sem
   * `role`, `can()` devolve `false` para tudo e o menu inteiro cai em
   * `visibleItems.length === 0 → return null`. O browser capturava esse render
   * vazio como snapshot "new" — e era ele que o círculo revelava.
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
