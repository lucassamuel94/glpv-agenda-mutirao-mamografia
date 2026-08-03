/** Configuração inicial da instalação em uma única tela, dividida por abas. */

"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  LineChart,
  Mail,
  Moon,
  Palette,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import {
  Button,
  ColorPickerField,
  ImageUploadField,
  PasswordInputWithFeedback,
} from "@/components";
import { AppBrandMark } from "@/components/AppBrand";
import {
  Form,
  Input,
  MaskedInput,
  Select,
  type FormRef,
  useForm,
} from "@/components/Form";
import {
  requestAccessSchema,
  type RequestAccessFormValues,
} from "@/modules/auth/request-access-validation";
import { toRegisterPayload } from "@/modules/auth/request-access-payload";
import { authApi } from "@/lib/api/auth";
import { toast } from "@/lib/toast";
import { refreshBranding } from "@/app/actions";
import {
  APP_NAME,
  APP_VERSION,
  EMAIL_SUPPORT,
  WHATSAPP_SUPPORT,
} from "@/environments";
import { useTheme } from "@/providers/ThemeProvider";

const subscribeToHydration = () => () => {};

const TABS = [
  {
    id: "company",
    label: "Dados da empresa",
    title: "Dados da empresa",
    icon: Building2,
  },
  {
    id: "appearance",
    label: "Aparência",
    title: "Aparência do sistema",
    icon: Palette,
  },
  {
    id: "preferences",
    label: "Preferências",
    title: "Preferências do sistema",
    icon: Settings2,
  },
  {
    id: "admin",
    label: "Administrador",
    title: "Administrador da plataforma",
    icon: ShieldCheck,
  },
  {
    id: "review",
    label: "Revisão",
    title: "Revisão da instalação",
    icon: Check,
  },
] as const;

type SetupTab = (typeof TABS)[number]["id"];

const TAB_FIELDS: Record<SetupTab, (keyof RequestAccessFormValues)[]> = {
  company: ["organizationName", "cnpj", "organizationAddress"],
  appearance: ["logoUrl", "iconUrl", "primaryColor", "theme", "density"],
  preferences: ["locale", "timezone", "dateFormat"],
  admin: ["name", "email", "password", "confirmPassword"],
  review: [],
};

const DEFAULT_VALUES: Partial<RequestAccessFormValues> = {
  primaryColor: "#4f46e5",
  theme: "light",
  density: "compact",
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
  dateFormat: "DD/MM/YYYY",
};

function TabPanel({
  tab,
  children,
}: {
  tab: SetupTab;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${tab}-title`} className="space-y-4">
      {children}
    </section>
  );
}

function SetupReview({
  confirmed,
  onConfirmedChange,
}: {
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  const { watch } = useForm<RequestAccessFormValues>();
  const values = watch();
  return (
    <div className="space-y-4" aria-label="Resumo da instalação">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Empresa
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {values.organizationName || "Não informado"}
        </p>
        <p className="text-xs text-muted-foreground">
          {values.cnpj || "CNPJ não informado"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aparência
        </p>
        <p className="mt-2 text-sm text-foreground">
          Tema {values.theme} · Interface {values.density}
        </p>
        <p className="text-xs text-muted-foreground">
          {values.primaryColor || "Cor principal padrão"}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preferências
        </p>
        <p className="mt-2 text-sm text-foreground">
          {values.locale} · {values.timezone}
        </p>
        <p className="text-xs text-muted-foreground">
          Formato: {values.dateFormat}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Administrador
        </p>
        <p className="mt-2 text-sm text-foreground">
          {values.name || "Não informado"}
        </p>
        <p className="text-xs text-muted-foreground">
          {values.email || "E-mail não informado"} · Super Admin
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="text-sm leading-5 text-foreground">
          Confirmo que os dados informados estão corretos e autorizo a conclusão
          da instalação.
        </span>
      </label>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<SetupTab>("company");
  const [completedTabs, setCompletedTabs] = useState<Set<SetupTab>>(
    () => new Set(),
  );
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const formRef = useRef<FormRef>(null);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const displayedTheme = isHydrated ? theme : "light";

  const handleBrandPanelPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const panel = brandPanelRef.current;
      if (!panel) return;

      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--spotlight-x",
        `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
      );
      panel.style.setProperty(
        "--spotlight-y",
        `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
      );
    },
    [],
  );

  useEffect(() => {
    authApi.getSetupStatus().then((res) => {
      setChecking(false);
      if (res.data?.setupRequired === false) router.replace("/login");
    });
  }, [router]);

  const goToTab = (tab: SetupTab) => {
    const targetIndex = TABS.findIndex((item) => item.id === tab);
    const currentIndex = TABS.findIndex((item) => item.id === activeTab);
    const maxAccessibleIndex = completedTabs.size;

    if (targetIndex <= currentIndex || targetIndex <= maxAccessibleIndex) {
      setActiveTab(tab);
    }
  };

  const goForward = async () => {
    const index = TABS.findIndex((tab) => tab.id === activeTab);
    const next = TABS[index + 1];
    const valid = await formRef.current?.trigger(TAB_FIELDS[activeTab]);
    if (next && valid) {
      setCompletedTabs((previous) => {
        const nextCompleted = new Set(previous);
        nextCompleted.add(activeTab);
        return nextCompleted;
      });
      if (next.id === "review") setReviewConfirmed(false);
      setActiveTab(next.id);
    }
  };

  const handleSubmit = async (data: RequestAccessFormValues) => {
    setLoading(true);
    try {
      const response = await authApi.setup(toRegisterPayload(data));
      if (response.error) {
        toast(response.error, "error");
        return;
      }
      toast("Configuração concluída! Redirecionando...", "success");
      // Título da aba vem do nome da organização (ver generateMetadata em
      // app/layout.tsx) — invalida o cache antes do reload.
      await refreshBranding().catch(() => {});
      window.location.assign("/");
    } catch {
      toast("Erro ao concluir configuração. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary px-6 font-sans">
        <p className="text-sm text-muted-foreground" role="status">
          Carregando configuração...
        </p>
      </main>
    );
  }

  const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const currentTab = TABS[currentIndex];

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-6 font-sans">
      <div className="relative flex min-h-[680px] w-full max-w-7xl overflow-hidden rounded-2xl bg-card shadow-2xl shadow-black/10 lg:min-h-[760px]">
        <div
          ref={brandPanelRef}
          onPointerMove={handleBrandPanelPointerMove}
          className="group relative hidden w-2/5 flex-col justify-between overflow-hidden bg-secondary p-11 md:flex"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-32 z-0 size-80 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-28 z-0 size-96 rounded-full bg-violet-500/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none"
            style={{
              backgroundImage:
                "radial-gradient(520px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), hsl(var(--primary) / 0.22), transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] text-foreground opacity-[0.05] [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:20px_20px]"
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AppBrandMark title={APP_NAME} className="h-8 rounded-lg" />
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />v
              {APP_VERSION}
            </span>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex h-28 items-center justify-center gap-4 rounded-lg bg-gradient-to-br from-primary/10 via-violet-500/10 to-emerald-500/10">
                <span className="flex size-14 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <LineChart size={22} />
                </span>
                <span className="flex size-14 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
                  <Sparkles size={22} />
                </span>
                <span className="flex size-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Zap size={22} />
                </span>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-foreground">
                Configure sua instalação
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Defina a identidade, a aparência e o administrador do sistema em
                poucos passos.
              </p>
            </div>
            <p className="text-center text-xs tracking-wide text-muted-foreground">
              Simplicidade e eficiência para sua equipe.
            </p>
          </div>

          <a
            href={`mailto:${EMAIL_SUPPORT}`}
            className="relative z-10 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail size={14} />
            {EMAIL_SUPPORT} · {WHATSAPP_SUPPORT}
          </a>
        </div>

        <div className="relative flex w-full flex-col p-8 sm:p-12 md:w-3/5">
          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label={
              displayedTheme === "dark"
                ? "Ativar tema claro"
                : "Ativar tema escuro"
            }
            className="absolute right-6 top-6 flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {displayedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="mb-10 flex items-center gap-3 md:hidden">
            <AppBrandMark title={APP_NAME} className="h-9 rounded-lg" />
            <span className="text-base font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="mb-6">
              <h1
                id="setup-title"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                Configuração inicial
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure a empresa antes de acessar o painel.
              </p>
            </div>

            <div className="mb-2 overflow-x-auto border-b border-border pb-2">
              <div
                role="tablist"
                aria-label="Etapas da configuração"
                className="flex min-w-max gap-1"
              >
                {TABS.map((tab, index) => {
                  const Icon = tab.icon;
                  const selected = tab.id === activeTab;
                  const isLocked = index > completedTabs.size;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`${tab.id}-panel`}
                      aria-disabled={isLocked}
                      disabled={isLocked}
                      onClick={() => goToTab(tab.id)}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${selected ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"} ${isLocked ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>
                        {index + 1}. {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-2 flex items-baseline justify-between gap-4">
              <p className="text-xs font-medium text-muted-foreground">
                Etapa {currentIndex + 1} de {TABS.length}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {currentTab.title}
              </p>
            </div>

            <div
              role="progressbar"
              aria-label="Progresso da configuração"
              aria-valuemin={1}
              aria-valuemax={TABS.length}
              aria-valuenow={currentIndex + 1}
              className="mb-5 grid grid-cols-5 gap-2"
            >
              {TABS.map((tab, index) => (
                <span
                  key={tab.id}
                  aria-hidden="true"
                  className={`h-1 rounded-full ${index <= currentIndex ? "bg-primary" : "bg-border"}`}
                />
              ))}
            </div>

            <Form
              ref={formRef}
              id="setup-form"
              schema={requestAccessSchema}
              defaultValues={DEFAULT_VALUES}
              onSubmit={handleSubmit}
              showDefaultButtons={false}
              isLoading={loading}
              className="w-full"
            >
              <div
                id={`${activeTab}-panel`}
                role="tabpanel"
                aria-labelledby={`${activeTab}-title`}
              >
                {activeTab === "company" && (
                  <TabPanel tab="company">
                    <h2
                      id="company-title"
                      className="sr-only flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <Building2 size={16} aria-hidden="true" />
                      Dados da empresa
                    </h2>
                    <Input
                      name="organizationName"
                      label="Nome da empresa"
                      required
                      placeholder="Razão social ou nome fantasia"
                    />
                    <MaskedInput
                      type="cnpj"
                      name="cnpj"
                      label="CNPJ"
                      required
                      placeholder="00.000.000/0000-00"
                    />
                    <Input
                      name="organizationAddress"
                      label="Endereço (opcional)"
                      placeholder="Endereço completo"
                    />
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <strong className="text-foreground">
                        Suporte EZ Soft:
                      </strong>{" "}
                      {EMAIL_SUPPORT} · {WHATSAPP_SUPPORT}
                    </div>
                  </TabPanel>
                )}
                {activeTab === "appearance" && (
                  <TabPanel tab="appearance">
                    <h2
                      id="appearance-title"
                      className="sr-only flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <Palette size={16} aria-hidden="true" />
                      Aparência
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ImageUploadField
                        name="logoUrl"
                        label="Logo"
                        helper="Imagem principal da empresa"
                      />
                      <ImageUploadField
                        name="iconUrl"
                        label="Ícone / favicon"
                        helper="Imagem quadrada usada também como favicon"
                      />
                    </div>
                    <ColorPickerField
                      name="primaryColor"
                      label="Cor principal"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        name="theme"
                        label="Tema padrão"
                        options={[
                          { value: "light", label: "Claro" },
                          { value: "dark", label: "Escuro" },
                          { value: "system", label: "Sistema" },
                        ]}
                      />
                      <Select
                        name="density"
                        label="Densidade da interface"
                        options={[
                          { value: "compact", label: "Compacta" },
                          { value: "comfortable", label: "Confortável" },
                          { value: "spacious", label: "Espaçosa" },
                        ]}
                      />
                    </div>
                  </TabPanel>
                )}
                {activeTab === "preferences" && (
                  <TabPanel tab="preferences">
                    <h2
                      id="preferences-title"
                      className="sr-only flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <Settings2 size={16} aria-hidden="true" />
                      Preferências do sistema
                    </h2>
                    <Select
                      name="locale"
                      label="Idioma"
                      options={[
                        { value: "pt-BR", label: "Português (Brasil)" },
                      ]}
                    />
                    <Select
                      name="timezone"
                      label="Fuso horário"
                      options={[
                        {
                          value: "America/Sao_Paulo",
                          label: "São Paulo (GMT-03:00)",
                        },
                      ]}
                    />
                    <Select
                      name="dateFormat"
                      label="Formato de data"
                      options={[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }]}
                    />
                  </TabPanel>
                )}
                {activeTab === "admin" && (
                  <TabPanel tab="admin">
                    <h2
                      id="admin-title"
                      className="sr-only flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <ShieldCheck size={16} aria-hidden="true" />
                      Administrador da plataforma
                    </h2>
                    <p className="text-xs leading-5 text-muted-foreground">
                      O usuário criado aqui terá o perfil Super Admin e acesso
                      total ao sistema.
                    </p>
                    <Input
                      name="name"
                      label="Nome completo"
                      required
                      placeholder="Seu nome"
                    />
                    <Input
                      name="email"
                      label="E-mail"
                      type="email"
                      required
                      placeholder="admin@organizacao.com"
                    />
                    <PasswordInputWithFeedback
                      name="password"
                      label="Senha"
                      required
                      placeholder="8+ caracteres, com maiúscula, minúscula e número"
                    />
                    <PasswordInputWithFeedback
                      name="confirmPassword"
                      label="Confirmar senha"
                      required
                      placeholder="Repita a senha"
                      showRequirements={false}
                    />
                  </TabPanel>
                )}
                {activeTab === "review" && (
                  <SetupReview
                    confirmed={reviewConfirmed}
                    onConfirmedChange={setReviewConfirmed}
                  />
                )}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    setActiveTab(TABS[Math.max(0, currentIndex - 1)].id)
                  }
                  disabled={currentIndex === 0 || loading}
                >
                  Voltar
                </Button>
                {activeTab === "review" ? (
                  <Button
                    type="submit"
                    form="setup-form"
                    variant="primary"
                    className="w-full sm:w-auto"
                    disabled={loading || !reviewConfirmed}
                  >
                    {loading ? "Configurando..." : "Concluir instalação"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={() => void goForward()}
                    disabled={loading}
                  >
                    {currentIndex === TABS.length - 2
                      ? "Revisar instalação"
                      : "Continuar"}
                  </Button>
                )}
              </div>
            </Form>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Instalação segura e protegida pela EZ Soft.
          </p>
        </div>
      </div>
    </main>
  );
}
