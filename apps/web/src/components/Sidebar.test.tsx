import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";

/**
 * O Sidebar não tinha NENHUM teste até 2026-07-28 — e foi essa ausência que
 * permitiu refatorá-lo (commit `cb62ed6`, react-hooks) sem rede.
 *
 * O que estes casos travam é o que o componente promete e é fácil quebrar sem
 * perceber, porque o sintoma é sempre o mesmo: menu VAZIO, não exceção.
 *
 *  - a montagem do menu depende de `usePermission().can(resource)`. Se `can`
 *    passar a devolver `false` para tudo (ex.: `role` lido do lugar errado, ou
 *    `PERMISSIONS` sem a chave do papel), TODO grupo cai no
 *    `visibleItems.length === 0 → return null` e a sidebar renderiza sem itens.
 *    Nenhum erro no console, nada quebrado — só uma barra lateral vazia;
 *  - o mundo (console × crm) sai de `isSa() ? getWorld(pathname) : "crm"`, a
 *    regra do spec 2026-07-28. Um não-SA nunca deve ver a seção Plataforma,
 *    mesmo navegando manualmente para `/super-admin`;
 *  - o espelhamento de `user` da sessão para o estado local acontece DURANTE o
 *    render (`useResetOnChange`). O caso que importa é o real: `user` chega
 *    `null` no primeiro render (auth carregando) e aparece depois — se esse
 *    caminho quebrar, o menu nunca preenche.
 *
 * `useAuth` é o único dublê: é a fronteira de sessão. `usePermission`,
 * `sidebar-menu` e a filtragem por permissão rodam de VERDADE — dublá-los
 * fabricaria justamente a decisão sob teste.
 */
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

let mockPathname = "/reports";
const mockedUseAuth = vi.mocked(useAuth);

function setAuth({ user, isSa = false }: { user: unknown; isSa?: boolean }) {
  mockedUseAuth.mockReturnValue({
    user,
    isSa: () => isSa,
    currentTenant: null,
    logout: vi.fn(),
  } as never);
}

const ADMIN = {
  id: "u1",
  name: "Ana",
  email: "ana@x.com",
  role: "ADMIN",
  organizations: [],
};

/** O usuário real do banco de dev: SA com vínculo só na Platform. */
const SA = {
  id: "sa-1",
  name: "Carlos",
  email: "carlos@ezsoft.com.br",
  role: "SA_MASTER",
  organizations: [{ id: "platform", name: "Platform", is_primary: true }],
};

function renderSidebar() {
  return render(<Sidebar isOpen onClose={() => {}} isCollapsed={false} />);
}

describe("Sidebar", () => {
  it("marca semanticamente a rota ativa sem depender somente da cor", () => {
    localStorage.clear();
    mockPathname = "/reports";
    setAuth({ user: ADMIN });

    renderSidebar();

    expect(screen.getByRole("button", { name: "Relatórios" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Equipe" }),
    ).not.toHaveAttribute("aria-current");
  });

  // O controle de recolhimento vive no topbar (Layout), não mais aqui —
  // ver Layout.test.tsx.

  it("abre o menu do usuário por um botão semântico e expõe seu estado", () => {
    localStorage.clear();
    mockPathname = "/reports";
    setAuth({ user: ADMIN });

    renderSidebar();

    const userMenu = screen.getByRole("button", {
      name: "Abrir menu do usuário",
    });
    expect(userMenu).toHaveAttribute("aria-expanded", "false");
    expect(userMenu).toHaveAttribute("aria-haspopup", "menu");

    fireEvent.click(userMenu);

    expect(userMenu).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Meu Perfil" }),
    ).toBeInTheDocument();
  });

  it("expõe o drawer mobile e permite fechá-lo por um controle nomeado", () => {
    localStorage.clear();
    mockPathname = "/reports";
    setAuth({ user: ADMIN });
    const onClose = vi.fn();

    render(
      <Sidebar isOpen onClose={onClose} isCollapsed={false} />,
    );

    expect(
      screen.getByRole("complementary", { name: "Navegação principal" }),
    ).toHaveClass("translate-x-0");
    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ADMIN no CRM: renderiza os itens do mundo crm", () => {
    localStorage.clear();
    mockPathname = "/reports";
    setAuth({ user: ADMIN });

    renderSidebar();

    expect(screen.getByText("Relatórios")).toBeInTheDocument();
    expect(screen.getByText("Equipe")).toBeInTheDocument();
    // A seção Plataforma NÃO existe no mundo crm (spec 2026-07-28).
    expect(screen.queryByText("Central de Operações")).not.toBeInTheDocument();
    expect(screen.queryByText("Clínicas")).not.toBeInTheDocument();
  });

  it("SA no CRM: exibe Clínicas no menu operacional", () => {
    localStorage.clear();
    mockPathname = "/";
    setAuth({ user: SA, isSa: true });

    renderSidebar();

    expect(screen.getByText("Clínicas")).toBeInTheDocument();
  });

  it("SA no console: renderiza a seção Plataforma", () => {
    localStorage.clear();
    mockPathname = "/super-admin";
    setAuth({ user: SA, isSa: true });

    renderSidebar();

    expect(screen.getByText("Central de Operações")).toBeInTheDocument();
    expect(screen.getByText("Auditoria")).toBeInTheDocument();
  });

  /**
   * O reforço de render do spec: ADMIN tem `PERMISSIONS['*']` (o mesmo wildcard
   * do SA), então sem o `isSa()` na frente um ADMIN que digitasse `/super-admin`
   * veria o menu da Plataforma piscar antes do guard da página redirecionar.
   */
  it("ADMIN em /super-admin: NÃO vê a seção Plataforma (o mundo exige SA)", () => {
    localStorage.clear();
    mockPathname = "/super-admin";
    setAuth({ user: ADMIN, isSa: false });

    renderSidebar();

    expect(screen.queryByText("Central de Operações")).not.toBeInTheDocument();
    expect(screen.getByText("Relatórios")).toBeInTheDocument();
  });

  /**
   * O fluxo REAL de carregamento: `user` chega null e aparece depois. É o caminho
   * que o espelhamento durante o render tem que atender — se ele parar de
   * funcionar, o menu fica vazio para sempre e nada dá erro.
   */
  it("usuário chega DEPOIS do primeiro render: o menu preenche", () => {
    localStorage.clear();
    mockPathname = "/reports";
    setAuth({ user: null });

    const { rerender } = renderSidebar();
    expect(screen.queryByText("Relatórios")).not.toBeInTheDocument();

    setAuth({ user: ADMIN });
    rerender(<Sidebar isOpen onClose={() => {}} isCollapsed={false} />);

    expect(screen.getByText("Relatórios")).toBeInTheDocument();
  });
});

/**
 * REGRESSÃO do bug de 2026-07-28 (relatado como "conteúdo do sidebar não
 * aparece", e que sobreviveu a logout, reload e apagar o `.next` — porque não
 * era estado velho, era código).
 *
 * O estado que reproduz: `localStorage.app_user` já gravado (todo usuário que já
 * usou o app) e SEM `role` — o `ThemeProvider` grava preferências ali, não papel.
 *
 * O que quebrava: `usePermission` e `Sidebar` copiavam o usuário da sessão para
 * estado local por efeito; o refactor de react-hooks trocou o efeito por
 * `useResetOnChange`, que dispara só na MUDANÇA e **não no mount**. Com o storage
 * já populado, a cópia nunca acontecia, `role` ficava `undefined`, `can()`
 * devolvia `false` para tudo, e todo grupo do menu caía no
 * `visibleItems.length === 0 → return null`. Sidebar renderizada, conteúdo vazio,
 * zero erros no console — o pior tipo de falha.
 *
 * Este teste é o que faltava: os outros casos deste arquivo limpavam o
 * `localStorage` no `beforeEach` e, por isso, passavam com o bug presente.
 */
describe("Sidebar — regressão: storage populado não pode esvaziar o menu", () => {
  it("app_user sem role no storage + sessão COM role: o menu aparece", () => {
    localStorage.setItem(
      "app_user",
      JSON.stringify({ id: "u1", name: "Ana", email: "ana@x.com" }),
    );
    mockPathname = "/reports";
    setAuth({ user: ADMIN });

    renderSidebar();

    expect(screen.getByText("Relatórios")).toBeInTheDocument();
  });

  it("app_user com role DESATUALIZADO: a sessão manda, não o storage", () => {
    // Storage diz USER (que não tem acesso a Equipe); a sessão diz ADMIN.
    // Quem decide tem que ser a sessão.
    localStorage.setItem(
      "app_user",
      JSON.stringify({ id: "u1", name: "Ana", email: "ana@x.com", role: "USER" }),
    );
    mockPathname = "/reports";
    setAuth({ user: ADMIN });

    renderSidebar();

    expect(screen.getByText("Equipe")).toBeInTheDocument();
  });
});
