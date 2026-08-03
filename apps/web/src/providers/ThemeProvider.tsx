"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { User } from "@/types";

type Theme = "light" | "dark";
export const LOGIN_THEME_STORAGE_KEY = "app_login_theme";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Durante SSR, retornar valores padrão se o provider não estiver disponível
  if (!context) {
    if (typeof window === "undefined") {
      // SSR: retornar valores padrão
      return {
        theme: "system" as const,
        setTheme: () => {},
        toggleTheme: () => {},
      };
    }
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const shouldFollowSystem = pathname === "/login";
  // No login, o script inline aplica a classe antes da hidratação. Ler essa
  // classe no primeiro render evita removê-la e aplicá-la de novo (FOUC).
  const [theme, setThemeState] = useState<Theme>(() => {
    if (
      shouldFollowSystem &&
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
    ) {
      return "dark";
    }

    return "light";
  });

  // Sincroniza o estado com a preferência real do usuário após o mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (shouldFollowSystem) {
      const savedLoginTheme = localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
      if (isTheme(savedLoginTheme)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza a preferência persistida após a hidratação
        setThemeState(savedLoginTheme);
        return;
      }

      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
      return;
    }

    try {
      const savedLoginTheme = localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
      if (isTheme(savedLoginTheme)) {
        setThemeState(savedLoginTheme);
        return;
      }

      const storedUser = localStorage.getItem("app_user");
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        if (user.theme) {
          setThemeState(user.theme);
          return;
        }
      }

      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setThemeState("dark");
      }
    } catch {
      // mantém "light"
    }
  }, [shouldFollowSystem]);

  // Aplica a classe ANTES do paint (useLayoutEffect, não useEffect). No
  // toggle via botão, `toggleTheme` já troca a classList direto (ver
  // comentário lá) antes mesmo do React re-renderizar — este efeito só
  // mantém `theme` e a classe em sincronia pros outros casos (mount inicial,
  // preferência de sistema, `setTheme` chamado fora do toggle).
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Remove all theme classes first
    root.classList.remove("dark");

    // Apply appropriate theme class
    if (theme === "dark") {
      root.classList.add("dark");
    }

    // Also update localStorage immediately
    try {
      const storedUser = localStorage.getItem("app_user");
      if (storedUser && !shouldFollowSystem) {
        const user: User = JSON.parse(storedUser);
        user.theme = theme;
        localStorage.setItem("app_user", JSON.stringify(user));
      }
    } catch (e) {
      // Ignore errors
    }
  }, [theme, shouldFollowSystem]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't set a preference
      const savedLoginTheme = localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
      const storedUser = localStorage.getItem("app_user");
      if (
        (shouldFollowSystem && !isTheme(savedLoginTheme)) ||
        (!shouldFollowSystem &&
          (!storedUser || !JSON.parse(storedUser).theme))
      ) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [shouldFollowSystem]);

  /*
   * O listener de `app-user-update` foi removido: ele existia só para receber o
   * broadcast que o PRÓPRIO `setTheme` disparava (ver o comentário em
   * `setTheme`). Sem o dispatch, o evento não tem mais nenhum produtor no app —
   * o mesmo já estava registrado no JSDoc de `usePermission`, que também
   * abandonou esse listener por não carregar informação útil.
   */

  /**
   * Persiste a escolha e nada mais.
   *
   * ANTES isto fazia duas coisas a mais, e ambas eram a causa da tela em branco
   * na troca de tema (MEDIDO na gravação: dentro do reveal a página saía cinza
   * `#B8B8B8` com desvio 0.0 — plana, sem um pixel de conteúdo):
   *
   *  1. reconstruía o usuário a partir do `localStorage` (`{...user, theme}`) e
   *     regravava `app_user`. Com `stored` nulo isso gravava `{theme}` puro, sem
   *     `id`/`role`/`name`;
   *  2. disparava `app-user-update` com esse objeto — SINCRONAMENTE, portanto
   *     dentro do `flushSync` dentro do callback da view transition.
   *
   * O listener do Sidebar espalha o payload sobre o usuário da sessão e força
   * outro render no meio do flush. É a mesma armadilha já documentada em
   * `usePermission` e em `Sidebar.test.tsx`: `app_user` sem `role` faz `can()`
   * devolver `false` para tudo, todo grupo do menu cai em
   * `visibleItems.length === 0 → return null` e o app renderiza VAZIO — sem erro
   * no console. Era esse render vazio que o browser capturava como snapshot
   * "new", e é ele que o círculo revelava.
   *
   * A persistência de `app_user.theme` que o script anti-FOUC do `layout.tsx`
   * consome continua existindo, feita pelo `useLayoutEffect` acima — que faz a
   * gravação NÃO destrutiva (parseia o usuário e só ajusta `.theme`) e nunca
   * transmite nada.
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOGIN_THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Erro ao salvar a preferência de tema:", error);
    }
  }, []);

  /**
   * Sem animação de reveal (View Transitions API) de propósito: o reveal
   * exigia forçar o snapshot "novo" via `startViewTransition`, e qualquer
   * render do React nessa janela (mesmo só o ícone sol/lua trocando)
   * competia com o crossfade padrão do browser e travava a tela num cinza
   * plano no meio da troca (`rgb(129,129,129)`, medido) ou cortava o círculo
   * antes de cobrir a tela. Não teve combinação de timing (flushSync,
   * `ready`, classList direto) que eliminasse a corrida de forma confiável.
   * Troca de classe direta, sem animação, não tem essa janela de corrida.
   *
   * `.no-transition` mata o `transition-colors` por elemento (Tailwind) que
   * senão faz cada item da sidebar/tabela fazer seu próprio fade de ~150ms —
   * sem isso a troca não é seca, só trocou o mecanismo de animação (VT →
   * tween CSS por elemento). Removida no próximo frame: só precisa cobrir o
   * instante da troca de classe, não travar transições do resto do app.
   */
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ["light", "dark"];
    const currentIndex = themes.indexOf(theme);
    const next = themes[(currentIndex + 1) % themes.length];

    const root = document.documentElement;
    root.classList.add("no-transition");
    setTheme(next);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("no-transition"));
    });
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
