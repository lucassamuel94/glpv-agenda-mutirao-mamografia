import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Setup from "./Setup";
import { authApi } from "@/lib/api/auth";
import { toRegisterPayload } from "@/modules/auth/request-access-payload";

/**
 * Este arquivo protege o ÚLTIMO passo da instalação — o mais fácil de quebrar
 * sem ninguém notar, porque só acontece uma vez por instalação e ninguém
 * reexecuta.
 *
 * Defeito medido no navegador: ao concluir o setup, a tela fazia
 * `router.push("/")`. O `AuthProvider` hidrata a sessão UMA vez, no mount, e
 * quando esta tela montou ainda não havia token — o estado continuou
 * `isAuthenticated: false`. Navegação client-side não remonta o provider, então
 * o `RequireAuth` do `(protected)/layout` gravava `redirect_after_login` e
 * mandava para `/login`: o instalador acabava de criar a conta, tinha um token
 * válido de 437 chars no `localStorage`, e caía na tela de login.
 *
 * A correção é navegar com a página inteira (`window.location.assign`), que
 * remonta o provider e deixa ele hidratar a partir do token. Trocar isso de
 * volta por `router.push` é uma refatoração TENTADORA — parece mais idiomático
 * em Next e o teste continuaria "verde" sem este caso. É exatamente essa troca
 * que os dois testes abaixo derrubam.
 */
const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/setup",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/auth", () => ({
  authApi: {
    getSetupStatus: vi.fn(),
    setup: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

const mockedAuthApi = vi.mocked(authApi);

async function preencherOrganizacao(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByPlaceholderText("Razão social ou nome fantasia"),
    "Minha Empresa LTDA",
  );
  await user.type(
    screen.getByPlaceholderText("00.000.000/0000-00"),
    "11222333000181",
  );
}

async function preencherEEnviar() {
  const user = userEvent.setup();
  await preencherOrganizacao(user);
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.type(screen.getByPlaceholderText("Seu nome"), "Carlos Instalador");
  await user.type(
    screen.getByPlaceholderText("admin@organizacao.com"),
    "carlos@minhaempresa.com.br",
  );
  await user.type(
    screen.getByPlaceholderText(
      "8+ caracteres, com maiúscula, minúscula e número",
    ),
    "SenhaForte123",
  );
  await user.type(
    screen.getByPlaceholderText("Repita a senha"),
    "SenhaForte123",
  );
  await user.click(screen.getByRole("button", { name: "Revisar instalação" }));
  await user.click(
    screen.getByRole("checkbox", {
      name: /Confirmo que os dados informados estão corretos/,
    }),
  );
  await user.click(screen.getByRole("button", { name: /concluir/i }));
}

describe("Setup — conclusão da configuração inicial", () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    assign = vi.fn();
    // `window.location` não é reatribuível em jsdom; trocamos só o método de
    // navegação, que é o que queremos observar (e evita o "Not implemented:
    // navigation" do jsdom).
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign },
    });
    mockedAuthApi.getSetupStatus.mockResolvedValue({
      data: { setupRequired: true },
    } as never);
  });

  it("comunica a etapa atual como progresso e avança entre as abas", async () => {
    const user = userEvent.setup();

    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    const progress = screen.getByRole("progressbar", {
      name: "Progresso da configuração",
    });
    expect(progress).toHaveAttribute("aria-valuemin", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "5");
    expect(progress).toHaveAttribute("aria-valuenow", "1");

    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(progress).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByRole("heading", { name: "Aparência" }),
    ).toBeInTheDocument();
  });

  it("apresenta as abas de instalação e preenche as preferências padrão", async () => {
    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("tab", { name: /Dados da empresa/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Aparência/ })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Preferências/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Administrador/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /suporte@ezsoft\.com\.br/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/\+55 34 3218-7079/).length).toBeGreaterThan(0);

    const user = userEvent.setup();
    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("tab", { name: /Preferências/ }));
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveTextContent(
      "Português (Brasil)",
    );
    expect(
      screen.getByRole("combobox", { name: "Fuso horário" }),
    ).toHaveTextContent("São Paulo");
    expect(
      screen.getByRole("combobox", { name: "Formato de data" }),
    ).toHaveTextContent("DD/MM/YYYY");
  });

  it("bloqueia etapas futuras e permite voltar às etapas concluídas", async () => {
    const user = userEvent.setup();
    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    const appearanceTab = screen.getByRole("tab", { name: /Aparência/ });
    const preferencesTab = screen.getByRole("tab", { name: /Preferências/ });
    expect(appearanceTab).toBeDisabled();
    expect(preferencesTab).toBeDisabled();

    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(appearanceTab).not.toBeDisabled();
    expect(preferencesTab).toBeDisabled();
    await user.click(screen.getByRole("tab", { name: /Dados da empresa/ }));
    expect(
      screen.getByRole("heading", { name: "Dados da empresa" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Aparência/ }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(preferencesTab).not.toBeDisabled();
  });

  it("aceita logo e ícone por upload e usa a cor primary como padrão", async () => {
    const user = userEvent.setup();
    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    const colorTrigger = screen.getByRole("button", {
      name: "Cor principal: #4F46E5",
    });
    expect(colorTrigger).toBeInTheDocument();
    await user.click(colorTrigger);
    await user.click(
      screen.getByRole("button", { name: "Selecionar cor #2563eb" }),
    );
    expect(
      screen.getByRole("button", { name: "Cor principal: #2563EB" }),
    ).toBeInTheDocument();
    const logoInput = screen.getByLabelText("Logo") as HTMLInputElement;
    fireEvent.change(logoInput, {
      target: {
        files: [new File(["logo"], "logo.png", { type: "image/png" })],
      },
    });

    await waitFor(() =>
      expect(screen.getByText("Imagem selecionada")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Ícone / favicon")).toBeInTheDocument();
  });

  it("move o spotlight do painel de marca conforme o ponteiro", async () => {
    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    const brandMark = screen.getAllByRole("img", { name: "EZ Starter Kit" })[0];
    const brandPanel = brandMark.closest("div.group");
    expect(brandPanel).toBeTruthy();

    Object.defineProperty(brandPanel, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 500, height: 600 }),
    });
    fireEvent.pointerMove(brandPanel!, { clientX: 250, clientY: 300 });

    expect(brandPanel).toHaveStyle({
      "--spotlight-x": "50%",
      "--spotlight-y": "50%",
    });
  });

  it("abre a etapa de administrador sem marcar campos ainda não tocados", async () => {
    const user = userEvent.setup();

    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByRole("heading", { name: "Administrador da plataforma" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Campo obrigatório")).not.toBeInTheDocument();
  });

  it("mostra os requisitos da senha e alerta quando o Caps Lock está ativo", async () => {
    const user = userEvent.setup();

    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    await preencherOrganizacao(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    const passwordInput = screen.getByPlaceholderText(
      "8+ caracteres, com maiúscula, minúscula e número",
    );
    const showPasswordButtons = screen.getAllByRole("button", {
      name: "Mostrar senha",
    });
    expect(showPasswordButtons).toHaveLength(2);
    await user.click(showPasswordButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Ocultar senha" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(screen.getByText("Pelo menos 8 caracteres")).toBeInTheDocument();
    await user.type(passwordInput, "SenhaForte123");
    expect(screen.getByText("Uma letra maiúscula").parentElement).toHaveClass(
      "text-emerald-600",
    );
    expect(screen.getByText("Um número").parentElement).toHaveClass(
      "text-emerald-600",
    );

    fireEvent.keyDown(passwordInput, {
      key: "CapsLock",
      getModifierState: (key: string) => key === "CapsLock",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Caps Lock está ativado",
    );
  });

  it("entra no app com uma carga de página inteira, não com navegação client-side", async () => {
    mockedAuthApi.setup.mockResolvedValue({
      data: { access_token: "token-valido" },
    } as never);

    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    await preencherEEnviar();

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    // O ponto do teste: `router.push` levaria de volta ao login, porque o
    // AuthProvider não remonta e segue achando que ninguém está autenticado.
    expect(push).not.toHaveBeenCalled();
  });

  it("erro na API não navega para lugar nenhum — o formulário continua na tela", async () => {
    mockedAuthApi.setup.mockResolvedValue({
      error: "CNPJ já cadastrado",
    } as never);

    render(<Setup />);
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Razão social ou nome fantasia"),
      ).toBeInTheDocument(),
    );

    await preencherEEnviar();

    await waitFor(() => expect(mockedAuthApi.setup).toHaveBeenCalled());
    expect(assign).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("sistema já configurado manda para o login em vez de mostrar o formulário", async () => {
    mockedAuthApi.getSetupStatus.mockResolvedValue({
      data: { setupRequired: false },
    } as never);

    render(<Setup />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  /**
   * Falha de rede/timeout na checagem devolve `res.data` undefined —
   * `!res.data?.setupRequired` tratava isso como "não precisa mais de
   * setup" e mandava para /login por engano. O /login refazia a mesma
   * checagem, agora com sucesso, e voltava para /setup: um flicker
   * setup→login→setup visível em qualquer soluço passageiro do backend
   * (ex.: logo após o boot da API). Só `setupRequired === false` explícito
   * pode tirar o usuário do /setup.
   */
  it("falha na checagem de setup NÃO redireciona para o login", async () => {
    mockedAuthApi.getSetupStatus.mockResolvedValue({
      error: "Failed to fetch",
    } as never);

    render(<Setup />);

    await waitFor(() =>
      expect(mockedAuthApi.getSetupStatus).toHaveBeenCalled(),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("payload de instalação", () => {
  it("mantém a configuração de marca e preferências no payload do setup", () => {
    const payload = toRegisterPayload({
      organizationName: "Minha Empresa",
      cnpj: "11222333000181",
      organizationAddress: "Rua A, 10",
      logoUrl: "https://cdn.example.com/logo.png",
      iconUrl: "https://cdn.example.com/icon.png",
      primaryColor: "#123456",
      theme: "light",
      density: "compact",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      dateFormat: "DD/MM/YYYY",
      name: "Carlos Instalador",
      email: "carlos@minhaempresa.com.br",
      password: "SenhaForte123",
      confirmPassword: "SenhaForte123",
    });

    expect(payload).toMatchObject({
      logo_url: "https://cdn.example.com/logo.png",
      icon_url: "https://cdn.example.com/icon.png",
      primary_color: "#123456",
      theme: "light",
      density: "compact",
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      date_format: "DD/MM/YYYY",
    });
  });
});
