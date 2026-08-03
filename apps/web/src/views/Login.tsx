/**
 * Login Page
 *
 * Página de autenticação do sistema.
 * Permite login de usuários e redireciona para dashboard após autenticação bem-sucedida.
 *
 * @module views/Login
 */

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LineChart,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { Button } from "@/components/Button";
import { AppBrandMark } from "@/components/AppBrand";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/ThemeProvider";
import { ForgotPasswordDialog } from "@/modules/auth";
import { Input, Checkbox } from "@/components/Form";
import { APP_VERSION, EMAIL_SUPPORT } from "@/environments";
import { authApi } from "@/lib/api/auth";

const REMEMBERED_EMAIL_KEY = "remembered_email";
const LOGIN_BRAND_NAME = "Grupo Luta Pela Vida - Mutirão de Mamografia 2026";
const LOGIN_BRAND_ORGANIZATION = "Grupo Luta Pela Vida";
const LOGIN_BRAND_CAMPAIGN = "Mutirão de Mamografia 2026";
const subscribeToHydration = () => () => {};

const Login = () => {
  const router = useRouter();
  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
    isSa,
    orgBranding,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const brandPanelRef = useRef<HTMLDivElement>(null);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const displayedTheme = isHydrated ? theme : "light";

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Preenche o e-mail lembrado da última sessão com "Manter conectado" ativo
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    // Hidratação de um sistema externo (localStorage), não espelho de estado
    // do próprio componente; não roda de novo em re-render, só no mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (rememberedEmail) setEmail(rememberedEmail);
  }, []);

  const handlePasswordKeyEvent = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    },
    [],
  );

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirect = localStorage.getItem("redirect_after_login");
      if (redirect) {
        localStorage.removeItem("redirect_after_login");
        router.push(redirect);
      } else {
        router.push(isSa() ? "/super-admin" : "/");
      }
    }
  }, [isAuthenticated, authLoading, isSa, router]);

  // Se não está autenticado e o sistema não foi configurado, redireciona para /setup
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    authApi.getSetupStatus().then((res) => {
      if (res.data?.setupRequired) {
        router.replace("/setup");
      }
    });
  }, [authLoading, isAuthenticated, router]);

  // Handlers - memoized
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        const result = await login(email, password);

        if (result.success) {
          if (rememberMe) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
          } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          }
          toast("Login realizado com sucesso!", "success");
          // Redireciona após login bem-sucedido (SA vai para /super-admin)
          const redirect = localStorage.getItem("redirect_after_login");
          if (redirect) {
            localStorage.removeItem("redirect_after_login");
            router.push(redirect);
          } else {
            router.push(result.isSa ? "/super-admin" : "/");
          }
        } else {
          // Erro fica só no bloco inline do formulário — o toast dizia a
          // mesma frase ao mesmo tempo, duplicando a mensagem.
          setError(
            result.error || "Erro ao fazer login. Verifique suas credenciais.",
          );
        }
      } catch (err) {
        setError("Erro de conexão com o servidor");
      } finally {
        setLoading(false);
      }
    },
    [email, password, rememberMe, login, router],
  );

  const handleForgotPassword = useCallback(() => {
    setIsForgotPasswordOpen(true);
  }, []);

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

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6 font-sans">
      <div className="relative flex min-h-[640px] w-full max-w-5xl overflow-hidden rounded-2xl bg-card shadow-2xl shadow-black/10">
        {/* Painel de marca — tom secundário, acompanha o tema (não fixo escuro) */}
        <div
          ref={brandPanelRef}
          onPointerMove={handleBrandPanelPointerMove}
          className="group relative hidden w-1/2 flex-col justify-between overflow-hidden bg-secondary p-11 md:flex"
        >
          {/* Brilhos ambiente e spotlight seguem atrás da grade e do conteúdo. */}
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
          {/* A grade permanece legível sobre a iluminação. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2] text-foreground opacity-[0.05] [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:20px_20px]"
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AppBrandMark
                title={LOGIN_BRAND_NAME}
                logoUrl={orgBranding?.logoUrl}
                className="h-8 rounded-lg"
              />
              <span className="text-sm font-semibold leading-5 tracking-tight text-foreground">
                <span className="block">{LOGIN_BRAND_ORGANIZATION}</span>
                <span className="block">{LOGIN_BRAND_CAMPAIGN}</span>
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
              <div className="mt-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Painel de Alta Performance
                </h2>
                <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  +34% Produtividade
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Gerencie seus projetos e acompanhe resultados em tempo real com
                máxima fluidez.
              </p>
            </div>
            <p className="text-center text-xs tracking-wide text-muted-foreground">
              Simplicidade e eficiência para sua equipe.
            </p>
          </div>

          {EMAIL_SUPPORT && (
            <a
              href={`mailto:${EMAIL_SUPPORT}`}
              className="relative z-10 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail size={14} />
              {EMAIL_SUPPORT}
            </a>
          )}
        </div>

        {/* Formulário */}
        <div className="relative flex w-full flex-col p-8 sm:p-12 md:w-1/2">
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

          {/* No mobile o painel de marca some — a marca reaparece aqui */}
          <div className="mb-10 flex items-center gap-3 md:hidden">
            <AppBrandMark
              title={LOGIN_BRAND_NAME}
              logoUrl={orgBranding?.logoUrl}
              className="h-9 rounded-lg"
            />
            <span className="text-base font-semibold leading-5 tracking-tight text-foreground">
              <span className="block">{LOGIN_BRAND_ORGANIZATION}</span>
              <span className="block">{LOGIN_BRAND_CAMPAIGN}</span>
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4 justify-center">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Entrar na conta
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Insira suas credenciais para acessar o painel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
                >
                  <AlertCircle
                    size={16}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-destructive"
                  />
                  {error}
                </div>
              )}

              <Input
                name="email"
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                disabled={loading}
                className="active:scale-[0.99]"
                icon={
                  isEmailValid ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : undefined
                }
                iconPosition="end"
              />

              <div>
                <div className="relative">
                  <Input
                    name="password"
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyEvent}
                    onKeyDown={handlePasswordKeyEvent}
                    disabled={loading}
                    className="pr-10 active:scale-[0.99]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isCapsLockOn && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={12} aria-hidden />
                    Caps Lock ativado
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Checkbox
                  name="rememberMe"
                  label="Manter conectado"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  disabled={loading}
                  onClick={handleForgotPassword}
                  className="h-auto gap-1.5 px-0 text-xs font-normal text-muted-foreground hover:text-foreground"
                >
                  <Lock size={12} />
                  Esqueceu sua senha?
                </Button>
              </div>


              <div className="lg:pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="xl"
                  className="w-full transition-all active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Entrando...
                    </span>
                  ) : (
                    <>
                      Entrar <ArrowRight size={16} />
                    </>
                  )}
                </Button>

              </div>

            </form>
          </div>

          <p className="text-xs text-muted-foreground">
            Conexão segura criptografada (TLS 1.3).
          </p>
        </div>
      </div>

      {/* Modals */}
      <ForgotPasswordDialog
        open={isForgotPasswordOpen}
        onOpenChange={(open) => setIsForgotPasswordOpen(open)}
      />
    </div>
  );
};

export default Login;
