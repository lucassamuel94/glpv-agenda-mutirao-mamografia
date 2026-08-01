"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import {
  Menu,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  Sun,
  Moon,
  PanelLeft,
} from "lucide-react";

import SlideOver from "./SlideOver";
import { getHelpContent } from "@/services/helpData";
import { Button } from "./Button";
import { Separator } from "./ui/separator";
import { SkeletonBar } from "@/modules/common/skeleton";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  /**
   * Título da página. Quando omitido, o Layout renderiza um `<div>` vazio
   * no slot do título — usado pelo padrão de Portal (ver `PageHeader`).
   * Quando passado, renderiza normalmente.
   */
  title?: string;
  /**
   * Ações no header. Quando omitido, o Layout renderiza um `<div>` vazio
   * no slot das ações (padrão Portal). Quando passado, renderiza normal.
   */
  actions?: React.ReactNode;
  onBack?: () => void;
  full?: boolean; // Remove padding e max-width do container
  stickyFriendly?: boolean; // Remove overflow-hidden do main para position:sticky funcionar
  isLoading?: boolean;
  skeleton?: React.ReactNode;
  /**
   * Refs para os slots do header. Quando passados, o Layout registra os
   * elementos DOM correspondentes para que `PageHeader` (via Portal) possa
   * injetar título/ações. Geralmente vêm do `LayoutSlotsProvider`.
   */
  titleSlotRef?: (el: HTMLDivElement | null) => void;
  actionsSlotRef?: (el: HTMLDivElement | null) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  actions,
  onBack,
  full = false,
  stickyFriendly = false,
  isLoading = false,
  skeleton,
  titleSlotRef,
  actionsSlotRef,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const mainContentRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("app_sidebar_collapsed") === "true";
  });
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const closeMobileSidebar = useCallback(() => {
    if (!isSidebarOpen) return;
    setIsSidebarOpen(false);
    menuButtonRef.current?.focus();
  }, [isSidebarOpen]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("app_sidebar_collapsed", String(newState));
      }
      return newState;
    });
  }, []);

  const { theme, toggleTheme } = useTheme();

  // Zen Mode State
  const [isZenMode, setIsZenMode] = useState(false);

  // Help System State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const helpContent = React.useMemo(
    () => getHelpContent(pathname || "/"),
    [pathname],
  );

  // SCROLL TO TOP ON NAVIGATION
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [pathname]);

  // Handle window resize for responsive header
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      router.push(e.detail);
    };
    window.addEventListener("app-navigate", handleNavigate);
    return () => window.removeEventListener("app-navigate", handleNavigate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // router is stable, no need to include in deps

  // Keyboard Shortcuts (Cmd+K, Esc, Cmd+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebarCollapse();
      }
      if (e.key === "Escape") {
        setIsZenMode((prev) => (prev ? false : prev));
        closeMobileSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileSidebar, toggleSidebarCollapse]);

  // Normalizar role para comparação

  return (
    <>
      <div
        className={cn(
          full ? "h-screen" : "min-h-screen",
          "relative flex overflow-hidden bg-[hsl(var(--shell-bg))] font-sans text-sm text-foreground",
          stickyFriendly && "overflow-visible",
        )}
      >
        {/* Sidebar - Hidden when printing */}
        <div className={`${isZenMode ? "hidden" : "block"} no-print`}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={closeMobileSidebar}
            isCollapsed={isDesktop && isSidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <main
          ref={mainContentRef}
          className={cn(
            "app-shell-frame relative flex min-w-0 flex-1 flex-col bg-[hsl(var(--main-bg))]",
            stickyFriendly
              ? "h-auto min-h-screen overflow-visible"
              : "h-[100dvh] overflow-hidden",
            "md:my-2 md:mr-2 md:rounded-xl md:border",
            stickyFriendly ? "md:min-h-[calc(100dvh-1rem)]" : "md:h-[calc(100dvh-1rem)]",
            "md:transition-[margin] md:duration-200 md:ease-out",
            // Sidebar agora encosta na borda da janela (sem card flutuante):
            // a margem esquerda é exatamente a largura dela + o gap de 8px.
            !isZenMode &&
              (isSidebarCollapsed ? "md:ml-[72px]" : "md:ml-[244px]"),
            isZenMode && "ml-0 md:ml-2",
          )}
        >
          {/* Header - Z-30 to sit under modals but above content - Liquid Glass Effect */}
          {!isZenMode && (
            <header
              className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-[hsl(var(--main-bg))] px-3 md:px-4 no-print"
            >
              <div className="flex items-center flex-shrink-0">
                <Button
                  ref={menuButtonRef}
                  onClick={() => setIsSidebarOpen(true)}
                  variant="ghost"
                  size="icon"
                  className="mr-1 md:hidden"
                  aria-label="Abrir menu"
                  aria-expanded={isSidebarOpen}
                  aria-controls="app-sidebar"
                >
                  <Menu size={18} />
                </Button>

                {/* Recolher/expandir mora no topbar (não na sidebar): mesma
                    posição em ambos os estados, sem precisar caçar o botão
                    dentro de um menu que acabou de encolher. */}
                <Button
                  onClick={toggleSidebarCollapse}
                  variant="ghost"
                  size="icon-sm"
                  className="mr-1 hidden md:inline-flex"
                  aria-label={
                    isSidebarCollapsed ? "Expandir menu" : "Recolher menu"
                  }
                  aria-expanded={!isSidebarCollapsed}
                  aria-controls="app-sidebar"
                >
                  <PanelLeft size={16} />
                </Button>
                <Separator
                  orientation="vertical"
                  className="mr-3 hidden h-4 md:block"
                />

                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="ghost"
                    size="icon-sm"
                    className="mr-3 -ml-2 rounded-full"
                    title="Voltar"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                )}
                {isLoading ? (
                  <SkeletonBar className="w-40 h-6" />
                ) : title !== undefined ? (
                  <h2 className="mr-4 max-w-[180px] truncate text-[13px] font-medium text-foreground md:mr-8 md:max-w-xs">
                    {title}
                  </h2>
                ) : (
                  // Slot para Portal: PageHeader injeta o título aqui dentro.
                  // Mantém as mesmas classes do <h2> acima para preservar UI.
                  <div
                    ref={titleSlotRef}
                    className="mr-4 max-w-[180px] truncate text-[13px] font-medium text-foreground md:mr-8 md:max-w-xs"
                  />
                )}
              </div>

              <div className="flex items-center">
                {isLoading ? (
                  <SkeletonBar className="w-32 h-8 mr-3" />
                ) : actions !== undefined ? (
                  actions && (
                    <div className="mr-3 flex items-center">{actions}</div>
                  )
                ) : (
                  // Slot para Portal: PageHeader injeta as actions aqui.
                  // Wrapper sempre presente; vazio quando view não publica actions.
                  <div
                    ref={actionsSlotRef}
                    className="mr-3 flex items-center empty:hidden"
                  />
                )}

                {/* System Tray */}
                <div className="flex items-center gap-1 pl-2 border-l border-border">
                  <Button
                    onClick={(e) =>
                      toggleTheme({
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      theme === "dark"
                        ? "Ativar tema claro"
                        : "Ativar tema escuro"
                    }
                  >
                    {theme === "dark" ? (
                      <Sun size={16} />
                    ) : (
                      <Moon size={16} />
                    )}
                  </Button>

                  <Button
                    onClick={() => setIsZenMode(true)}
                    variant="ghost"
                    size="icon-sm"
                    className="hidden sm:inline-flex"
                    aria-label="Modo Zen"
                  >
                    <Maximize2 size={16} />
                  </Button>

                  {/* HELP BUTTON */}
                  <Button
                    onClick={() => setIsHelpOpen(true)}
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ajuda e Suporte"
                  >
                    <HelpCircle size={16} />
                  </Button>
                </div>
              </div>
            </header>
          )}

          {/* Zen Mode Float */}
          {isZenMode && (
            <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-card dark:bg-card p-2 rounded-lg shadow-popover border border-border dark:border-border animate-fadeIn no-print">
              <span className="text-xs font-bold text-muted-foreground dark:text-muted-foreground px-2">
                Modo Zen
              </span>
              <Button
                onClick={() => setIsZenMode(false)}
                variant="secondary"
                size="icon-sm"
                title="Sair do Modo Zen"
              >
                <Minimize2 size={16} />
              </Button>
            </div>
          )}

          <div
            className={cn(
              "main-content w-full flex-1",
              full
                ? "min-h-0 overflow-hidden"
                : stickyFriendly
                  ? "overflow-visible px-4 py-5 md:px-6 md:py-6 lg:px-8"
                  : "overflow-auto px-4 py-5 md:px-6 md:py-6 lg:px-8",
            )}
          >
            {isLoading ? skeleton : children}
          </div>
        </main>

        {/* HELP SYSTEM SLIDE OVER - Z-50 */}
        <SlideOver
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="Central de Ajuda"
          subtitle={helpContent.title}
          width="md"
        >
          <div className="flex flex-col h-full">
            {/* Tabs */}

            {/* Guide Content */}

            <div className="space-y-6 flex-1 overflow-y-auto">
              <div className="bg-secondary p-4 rounded-lg border border-border">
                <p className="text-sm text-foreground leading-relaxed">
                  {helpContent.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                  Funcionalidades Principais
                </h4>
                <ul className="space-y-3">
                  {helpContent.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-muted-foreground"
                    >
                      <div className="mt-1 mr-3 w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />
              {/* Perguntas e Respostas (FAQ) */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                  Relacionadas
                </h4>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push("/faq")}
                >
                  Ver FAQ (Perguntas e Respostas)
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </SlideOver>
      </div>
    </>
  );
};

export default Layout;
