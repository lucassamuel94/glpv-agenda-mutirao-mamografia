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
   * Reveal circular SEM View Transitions API.
   *
   * A API nativa (`startViewTransition`) tira screenshot do DOM antes e
   * depois do callback e faz o browser cruzar (crossfade) os dois. Esse
   * crossfade competia com o re-render do React disparado por `setTheme`:
   * se a main thread ficasse ocupada no meio da captura, a animação
   * congelava numa mistura de cor errada (MEDIDO: `rgb(129,129,129)`, a
   * média exata entre o bg escuro e o claro) até o React liberar a thread.
   * Não teve timing (flushSync, `ready`, classList direto) que fechasse essa
   * corrida de forma confiável nos dois sentidos.
   *
   * Esta versão não tira screenshot de nada: troca o tema de verdade
   * INSTANTANEAMENTE (classList direto, sem flushSync), escondido atrás de
   * uma cortina sólida (cor do tema ANTIGO, lida antes da troca) que cobre a
   * tela inteira. A cortina tem um FURO que cresce a partir do ponto
   * clicado, revelando o DOM real — que já está no tema novo por baixo o
   * tempo todo. Não existe segundo snapshot pra crossfade: o pior caso de
   * main thread ocupada é o furo pausar um frame e retomar, nunca uma cor
   * errada no meio.
   *
   * O furo não dá pra fazer só com `clip-path: circle()` — essa função só
   * descreve a região INCLUÍDA, não tem jeito de dizer "tudo, menos um
   * círculo". Encolher um `circle(R at X,Y)` esconde as bordas primeiro e só
   * fecha em X,Y por último — o efeito parece nascer longe do botão e
   * fechar nele, ao contrário do esperado. Por isso a cortina usa uma
   * máscara SVG (retângulo branco = cortina visível, círculo preto = furo,
   * cresce via `r`) em vez de `clip-path`.
   */
  const toggleTheme = useCallback(
    (origin?: ThemeOrigin) => {
      const themes: Theme[] = ["light", "dark"];
      const currentIndex = themes.indexOf(theme);
      const next = themes[(currentIndex + 1) % themes.length];

      const root = document.documentElement;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const swapInstant = () => {
        root.classList.add("no-transition");
        setTheme(next);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => root.classList.remove("no-transition"));
        });
      };

      if (reducedMotion || typeof document.createElementNS !== "function") {
        swapInstant();
        return;
      }

      // Cor sólida do tema ATUAL — lida antes de qualquer mutação, é o que
      // vira a cortina que finge ser o "snapshot antigo".
      const oldShellBg = getComputedStyle(root)
        .getPropertyValue("--shell-bg")
        .trim();

      const x = origin?.x ?? window.innerWidth;
      const y = origin?.y ?? 0;
      const farthestX = Math.max(x, window.innerWidth - x);
      const farthestY = Math.max(y, window.innerHeight - y);
      const maxRadius = Math.hypot(farthestX, farthestY);

      const svgNS = "http://www.w3.org/2000/svg";
      const maskId = `theme-reveal-mask-${Date.now()}`;

      // `width`/`height` do <svg> não podem ser 0: sem tamanho real, o
      // Chrome não resolve o sistema de coordenadas do conteúdo do <mask> e
      // a máscara vira "esconde tudo" — cortina invisível, zero efeito
      // visual (mesmo com cx/cy/r corretos). Testado ao vivo: com 0x0 nada
      // aparece; com o tamanho real do viewport, a máscara funciona.
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", String(window.innerWidth));
      svg.setAttribute("height", String(window.innerHeight));
      svg.style.cssText = "position:fixed;inset:0;pointer-events:none";

      const mask = document.createElementNS(svgNS, "mask");
      mask.setAttribute("id", maskId);
      mask.setAttribute("maskUnits", "userSpaceOnUse");
      mask.setAttribute("x", "0");
      mask.setAttribute("y", "0");
      mask.setAttribute("width", String(window.innerWidth));
      mask.setAttribute("height", String(window.innerHeight));

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      rect.setAttribute("fill", "white");

      const hole = document.createElementNS(svgNS, "circle");
      hole.setAttribute("cx", String(x));
      hole.setAttribute("cy", String(y));
      hole.setAttribute("r", "0");
      hole.setAttribute("fill", "black");

      mask.append(rect, hole);
      svg.appendChild(mask);
      document.body.appendChild(svg);

      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:2147483647",
        "pointer-events:none",
        oldShellBg ? `background:hsl(${oldShellBg})` : "",
        `mask:url(#${maskId})`,
        `-webkit-mask:url(#${maskId})`,
      ]
        .filter(Boolean)
        .join(";");
      document.body.appendChild(overlay);

      swapInstant();

      const cleanup = () => {
        overlay.remove();
        svg.remove();
      };

      // Raio via rAF manual, não via `hole.animate`: interpolar o atributo
      // `r` de um <circle> por CSS/WAAPI depende de suporte a geometry
      // properties que varia por browser — o loop manual funciona em
      // qualquer um que tenha SVG mask, sem depender disso.
      const duration = 550;
      const start = performance.now();
      // Smoothstep: acelera e desacelera suave nas duas pontas (em vez de
      // sair rápido do zero como o easeOutCubic anterior) — mais macio.
      const smoothstep = (t: number) => t * t * (3 - 2 * t);

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        hole.setAttribute("r", String(maxRadius * smoothstep(t)));
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          cleanup();
        }
      };
      requestAnimationFrame(step);
    },
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
