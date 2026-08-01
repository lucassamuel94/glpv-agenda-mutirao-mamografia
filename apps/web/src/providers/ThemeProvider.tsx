"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { User } from "@/types";
import { useAuth } from "@/hooks/use-auth";

type Theme = "light" | "dark";
export const LOGIN_THEME_STORAGE_KEY = "app_login_theme";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

interface ThemeOrigin {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: (origin?: ThemeOrigin) => void;
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

  // Aplica a classe ANTES do paint (useLayoutEffect, não useEffect). O
  // `toggleTheme` chama `startViewTransition(() => flushSync(setTheme))`: o
  // browser tira o snapshot "novo" assim que esse callback resolve. Com
  // efeito passivo comum, a troca de classe podia não ter rodado ainda
  // nesse instante — o snapshot saía com o tema errado, corrigia um frame
  // depois, e essa correção tardia era a piscada no fim do reveal.
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

  // Listen for user updates from other components
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUserUpdate = (e: CustomEvent) => {
      const user: User = e.detail;
      if (user.theme && user.theme !== theme) {
        setThemeState(user.theme);
      }
    };

    window.addEventListener(
      "app-user-update",
      handleUserUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "app-user-update",
        handleUserUpdate as EventListener,
      );
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    // Update user data
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOGIN_THEME_STORAGE_KEY, newTheme);

        if (shouldFollowSystem) {
          return;
        }

        const stored = localStorage.getItem("app_user");
        const user = stored ? JSON.parse(stored) : null;
        const updatedUser = { ...user, theme: newTheme };
        localStorage.setItem("app_user", JSON.stringify(updatedUser));
        window.dispatchEvent(
          new CustomEvent("app-user-update", { detail: updatedUser }),
        );
      } catch (error) {
        console.error("Erro ao atualizar tema do usuário:", error);
      }
    }
  }, [shouldFollowSystem]);

  const toggleTheme = useCallback(
    (origin?: ThemeOrigin) => {
      const themes: Theme[] = ["light", "dark"];
      const currentIndex = themes.indexOf(theme);
      const next = themes[(currentIndex + 1) % themes.length];

      const root = document.documentElement;
      const supportsViewTransition =
        typeof document.startViewTransition === "function" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!supportsViewTransition) {
        setTheme(next);
        return;
      }

      root.style.setProperty("--theme-x", `${origin?.x ?? window.innerWidth}px`);
      root.style.setProperty("--theme-y", `${origin?.y ?? 0}px`);

      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    },
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
