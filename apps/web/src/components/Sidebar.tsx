"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBrand, { AppBrandMark } from "./AppBrand";
import {
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { OrganizationSwitcherDialog } from "@/modules/users";
import { ProfileDialog } from "@/modules/profile";
import { Button } from "./Button";
import { Confirm } from "./Dialog";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/environments";
import { Avatar } from "@/components/Avatar";
import { SaOrgBanner } from "@/modules/super-admin/sa-org-banner";
import {
  buildMenuGroups,
  getWorld,
  type MenuSection,
} from "@/components/sidebar-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

// Item ativo: fundo com tint de Signal Indigo (seleção atual, um dos três
// usos legítimos do acento — The One Signal Rule) + ícone indigo. Texto
// FICA na cor de alto contraste do sidebar, não indigo — `text-primary`
// (L 67%) sobre o fundo quase preto do sidebar dá ~4:1 de contraste, abaixo
// do mínimo de leitura (4.5:1 para texto normal); o ícone já carrega o
// sinal, o texto precisa continuar legível.
const ACTIVE_NAV_CLASSES =
  "rounded-lg bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-text))] shadow-none ring-1 ring-primary";

// Estado inativo/hover — um único par de tokens para TODO item de navegação
// (pai, filho, colapsado). Antes cada nível repetia a mesma tripla à mão e
// divergia: o item filho ganhava um hover, o flyout outro.
const IDLE_NAV_CLASSES =
  "text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))]";

// Dentro do flyout/popover a superfície é `bg-popover`, não a sidebar — usar
// os tokens da sidebar ali deixava o item ativo quase invisível (o contraste
// foi calculado contra outro fundo). Mesma semântica, tokens do popover.
const POPOVER_ACTIVE_CLASSES = "bg-accent text-accent-foreground";
const POPOVER_IDLE_CLASSES =
  "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

const navigationItemClass = (active: boolean, collapsed: boolean) =>
  cn(
    "relative flex h-10 w-full items-center rounded-md text-[13px] font-medium md:h-8",
    "transition-colors duration-150",
    collapsed ? "justify-center px-0" : "gap-2 px-2 text-left",
    active ? ACTIVE_NAV_CLASSES : IDLE_NAV_CLASSES,
  );

const tooltipClass =
  "absolute left-full top-1/2 z-[110] ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-popover transition-opacity pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100";

// Painel flyout do modo colapsado (item com filhos): mesmo trigger/posição do
// tooltip, mas com pointer-events habilitado e conteúdo clicável — sem isso o
// usuário nunca alcança os filhos além do primeiro sem expandir a sidebar.
const flyoutClass =
  "absolute left-full top-0 z-[110] ml-2 min-w-[180px] rounded-md border border-border bg-popover p-1 text-popover-foreground opacity-0 shadow-popover transition-opacity pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto";


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermission();
  const {
    user: currentUserFromAuth,
    isSa,
    orgBranding,
    currentTenant,
    logout: authLogout,
  } = useAuth();

  /**
   * Semente do primeiro paint, lida UMA vez — evita o menu do usuário piscar
   * vazio entre o mount e a resposta do `/auth/check`.
   */
  const [storedUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("app_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Sobreposição vinda de `app-user-update` (tema/avatar, disparado pelo
   * `ThemeProvider`). Só isto precisa ser estado: é evento de sistema externo.
   */
  const [userPatch, setUserPatch] = useState<Record<string, unknown> | null>(
    null,
  );

  /**
   * DERIVADO da sessão, não espelhado — conserto de um bug real, registrado para
   * não voltar: havia um `useState` + efeito copiando o usuário da sessão para
   * estado local, e o refactor de react-hooks trocou o efeito por
   * `useResetOnChange`, que dispara só na MUDANÇA e **não no mount**. Com
   * `app_user` já no `localStorage` (todo usuário que já usou o app), o estado
   * ficava preso no valor do storage. Ver o JSDoc de `usePermission`, onde a
   * mesma troca deixou `can()` devolvendo `false` para tudo e a sidebar sem
   * conteúdo.
   */
  const currentUser = useMemo(() => {
    const base = currentUserFromAuth ?? storedUser;
    if (!base) return base;
    return userPatch ? { ...base, ...userPatch } : base;
  }, [currentUserFromAuth, storedUser, userPatch]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isOrganizationSwitcherModalOpen, setIsOrganizationSwitcherModalOpen] =
    useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown aberto quando a rota atual pertence a um grupo com children
  // (derivado de menuGroups — ver effect após a declaração do menu).
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Assinar evento de janela é sincronização com sistema externo — efeito é a
  // ferramenta correta aqui. O que mudou é o QUE ele guarda: só a sobreposição
  // (tema/avatar), nunca uma cópia do usuário da sessão.
  useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const payload = (e as CustomEvent).detail;
      if (!payload) return;
      setUserPatch((prev) => ({ ...(prev ?? {}), ...payload }));
    };

    window.addEventListener("app-user-update", handleUserUpdate);

    return () => {
      window.removeEventListener("app-user-update", handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape fecha popover do usuário e devolve foco ao trigger — sem isso,
  // usuário de teclado fica preso tendo que Tab através do popover inteiro.
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsUserMenuOpen(false);
      userMenuRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isUserMenuOpen]);

  // O mundo console só existe de fato para SA: ADMIN tem PERMISSIONS['*']
  // (mesmo wildcard do SA), então se a Sidebar (persistente) computasse
  // world a partir só do pathname, um ADMIN navegando manualmente para
  // /super-admin veria o menu da Plataforma piscar antes do guard da
  // página redirecionar. Os guards de página continuam sendo a barreira
  // de acesso real — isto é só reforço de render para não-SA.
  const world = isSa() ? getWorld(pathname) : "crm";
  const menuGroups: MenuSection[] = buildMenuGroups(world);

  // Abre o grupo cujo filho corresponde à rota atual (menu do template é plano;
  // isto ativa quando um projeto-filho agrupa itens via `children`). O setState
  // fica em efeito de propósito: depende de `menuGroups`, que é recriado a cada
  // render — derivar no render seria recalcular a cada passada.
  useEffect(() => {
    if (!pathname) return;
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.children?.some((c) => c.path && pathname.startsWith(c.path))) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setOpenDropdown(item.label);
          return;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (path: string) =>
    (pathname?.startsWith(path) && (path === "/" ? pathname === "/" : true)) ||
    false;

  const handleLogout = () => {
    authLogout();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar Container 
            Z-Index Logic: 
            - Mobile: z-[100] to sit on top of everything (backdrop is z-90).
            - Desktop: z-40 to sit above content (z-0) and header (z-30), but BELOW SlideOver (z-50) and Modal (z-60).
      */}
      <aside
        id="app-sidebar"
        aria-label="Navegação principal"
        className={cn(
          "pointer-events-auto fixed left-0 top-0 z-[100] flex h-[100dvh] w-[236px] flex-col",
          // Sem card flutuante: a sidebar É o fundo do shell, e só o painel de
          // conteúdo (Layout) tem borda/raio — mesma leitura do layout "inset".
          "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text-muted))]",
          "transition-[width,transform] duration-200 ease-out",
          "md:z-40 md:translate-x-0 md:overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-[64px]" : "md:w-[236px]",
        )}
      >
        {/* Header — mesma altura (h-12) e alinhamento vertical do topbar do
            conteúdo (ver Layout.tsx). Recolher/expandir mora aqui, nunca
            solto num rail ou flutuando fora da sidebar. */}
        <div className="relative flex h-16 flex-shrink-0 items-center justify-between px-4">
          <div
            className={cn(
              "flex min-w-0 items-center overflow-hidden",
              isCollapsed && "w-full justify-center",
            )}
            aria-label={APP_NAME}
          >
            {isCollapsed ? (
              <AppBrandMark
                title={APP_NAME}
                className="animate-fadeIn"
                logoUrl={orgBranding?.logoUrl}
              />
            ) : (
              <AppBrand
                title={currentTenant?.name ?? APP_NAME}
                className="animate-fadeIn text-[hsl(var(--sidebar-text))]"
                logoUrl={orgBranding?.logoUrl}
              />
            )}
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Fechar menu"
            aria-controls="app-sidebar"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-3 py-5">
          {menuGroups.map((group, groupIdx) => {
            // Filter items in this group based on permissions
            const visibleItems = group.items.filter((item) => {
              if (!can(item.resource)) return false;
              if (item.children?.length) {
                return item.children.some((c) => can(c.resource));
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-2">
                {!isCollapsed ? (
                  <div className="px-2">
                    <p className="text-xs font-medium text-[hsl(var(--sidebar-text-muted))]">
                      {group.title}
                    </p>
                  </div>
                ) : (
                  <div className="mx-2 my-2 border-t border-[hsl(var(--shell-border))]" />
                )}

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const hasChildren =
                      item.children && item.children.length > 0;
                    const visibleChildren = hasChildren
                      ? item.children!.filter((c) => can(c.resource))
                      : [];
                    const isDropdownOpen =
                      !isCollapsed && openDropdown === item.label;
                    const submenuId = `submenu-${item.label
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`;
                    const tooltipId = `sidebar-tooltip-${item.label
                      .replace(/\s+/g, "-")
                      .toLowerCase()}`;
                    const active = hasChildren
                      ? visibleChildren.some((c) =>
                          c.path ? isActive(c.path) : false,
                        )
                      : item.path
                        ? isActive(item.path)
                        : false;

                    if (hasChildren && visibleChildren.length === 0)
                      return null;

                    if (hasChildren) {
                      return (
                        <div key={item.label} className="relative group">
                          <Button
                            asChild
                            variant="ghost"
                            className={navigationItemClass(
                              active,
                              isCollapsed,
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                isCollapsed
                                  ? handleNavigation(visibleChildren[0]?.path!)
                                  : setOpenDropdown((prev) =>
                                      prev === item.label ? null : item.label,
                                    )
                              }
                              aria-expanded={isDropdownOpen}
                              aria-controls={submenuId}
                              aria-label={
                                isCollapsed ? item.label : undefined
                              }
                            >
                              <item.icon
                                size={16}
                                className="flex-shrink-0"
                              />
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1 animate-fadeIn text-left">
                                    {item.label}
                                  </span>
                                  <ChevronDown
                                    size={12}
                                    className={`flex-shrink-0 transition-transform ${
                                      isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </>
                              )}
                            </button>
                          </Button>
                          {isCollapsed && (
                            <div
                              id={tooltipId}
                              role="group"
                              aria-label={item.label}
                              className={flyoutClass}
                            >
                              <p className="px-2 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">
                                {item.label}
                              </p>
                              {visibleChildren.map((child) => {
                                const childActive = child.path
                                  ? isActive(child.path)
                                  : false;
                                return (
                                  <button
                                    key={child.path}
                                    type="button"
                                    onClick={() =>
                                      handleNavigation(child.path!)
                                    }
                                    aria-current={
                                      childActive ? "page" : undefined
                                    }
                                    className={cn(
                                      "block w-full whitespace-nowrap rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors duration-150",
                                      childActive
                                        ? POPOVER_ACTIVE_CLASSES
                                        : POPOVER_IDLE_CLASSES,
                                    )}
                                  >
                                    {child.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {isDropdownOpen && (
                            <div
                              id={submenuId}
                              role="group"
                              className="ml-6 mt-1 space-y-1"
                            >
                              {visibleChildren.map((child) => {
                                const childActive = child.path
                                  ? isActive(child.path)
                                  : false;
                                return (
                                  <Button
                                    key={child.path}
                                    type="button"
                                    onClick={() =>
                                      handleNavigation(child.path!)
                                    }
                                    variant="ghost"
                                    aria-current={
                                      childActive ? "page" : undefined
                                    }
                                    className={cn(
                                      "flex h-10 w-full items-center rounded-md px-2 text-left text-[13px] font-medium transition-colors duration-150 md:h-[30px]",
                                      childActive
                                        ? ACTIVE_NAV_CLASSES
                                        : IDLE_NAV_CLASSES,
                                    )}
                                  >
                                    <span className="flex-1 text-left">
                                      {child.label}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.path!} className="relative group">
                        <Button
                          asChild
                          variant="ghost"
                          className={navigationItemClass(active, isCollapsed)}
                        >
                          <button
                            type="button"
                            onClick={() => handleNavigation(item.path!)}
                            aria-current={active ? "page" : undefined}
                            aria-label={isCollapsed ? item.label : undefined}
                          >
                            <item.icon
                              size={16}
                              className="flex-shrink-0"
                            />
                            {!isCollapsed && (
                              <span className="flex-1 animate-fadeIn">
                                {item.label}
                              </span>
                            )}

                            {item.badge && item.badge > 0 && (
                              <span
                                className={cn(
                                  "min-w-[18px] rounded-md bg-secondary px-1.5 text-center text-[10px] font-medium text-secondary-foreground",
                                  isCollapsed &&
                                    "absolute right-0.5 top-0.5 min-w-0 px-1",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        </Button>

                        {isCollapsed && (
                          <div
                            id={tooltipId}
                            role="tooltip"
                            className={tooltipClass}
                          >
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-[hsl(var(--shell-border))]">
          {/* Banner: SA navegando o CRM de uma org (sem grant) — spec 2026-07-28 */}
          <SaOrgBanner isCollapsed={isCollapsed} />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label={
                isUserMenuOpen
                  ? "Fechar menu do usuário"
                  : "Abrir menu do usuário"
              }
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-controls="sidebar-user-menu"
              className={cn(
                // Superfície própria (borda + tom), não só um hover que some
                // no fundo escuro da sidebar — sem isso o controle mais usado
                // do rodapé (perfil, trocar org, sair) não lia como clicável
                // em repouso.
                "mx-2 mb-2 flex h-12 w-[calc(100%-1rem)] cursor-pointer items-center rounded-lg border border-transparent bg-transparent px-2 text-left transition-colors duration-150 hover:border-[hsl(var(--shell-border))] hover:bg-[hsl(var(--sidebar-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isCollapsed ? "justify-center" : "justify-between",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name ?? "Usuário"}
                  size="sm"
                  className="size-7 flex-shrink-0 ring-1 ring-[hsl(var(--shell-border))]"
                />
                {!isCollapsed && (
                  // `leading-tight` + `gap-1`: sem isso, o line-height padrão
                  // de cada `<span>` soma folga abaixo do próprio texto — o
                  // bloco nome+e-mail "pesa" mais pra cima e destoa do centro
                  // geométrico do avatar/chevron ao lado, mesmo com
                  // `items-center` no pai (ele centra a CAIXA, não o texto
                  // dentro dela).
                  <div className="flex flex-col justify-center gap-1 animate-fadeIn min-w-0">
                    <span className="truncate text-[13px] font-medium leading-tight text-[hsl(var(--sidebar-text))]">
                      {(currentUser?.name ?? "Usuário").split(" ")[0] ||
                        "Usuário"}
                    </span>
                    <span className="max-w-[150px] truncate text-xs leading-tight text-[hsl(var(--sidebar-text-muted))]">
                      {currentUser?.email || ""}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                // Sem pastilha de fundo: `--sidebar-active` é o token do item
                // selecionado; usá-lo como enfeite aqui competia com o único
                // sinal de "onde eu estou" do menu.
                <ChevronUp
                  size={16}
                  className="shrink-0 text-[hsl(var(--sidebar-text-muted))]"
                />
              )}
            </button>

            {/* Popover Menu */}
            {isUserMenuOpen && (
              <div
                id="sidebar-user-menu"
                role="menu"
                className="absolute bottom-full left-3 right-3 z-[110] mb-2 min-w-[220px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-popover animate-fadeIn"
              >
                <div className="p-1 space-y-0.5">
                  <Button
                    onClick={() => {
                      setIsProfileModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <User size={16} /> Meu Perfil
                  </Button>

                  {/* Troca de organização é coisa do mundo CRM (no console o contexto é a
                      plataforma — não há o que selecionar). SA também vê: acesso direto e
                      livre entre orgs operacionais é decisão do spec 2026-07-28. A Platform
                      (SYSTEM) não conta — é infraestrutura, não destino. */}
                  {world === "crm" &&
                    (currentUserFromAuth?.organizations ?? []).filter(
                      (o) => o.status !== "SYSTEM",
                    ).length > 1 && (
                      <Button
                        onClick={() => {
                          setIsOrganizationSwitcherModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <Building2 size={16} /> Trocar organização
                      </Button>
                    )}

                  <div className="my-1 h-px bg-border"></div>

                  <Button
                    onClick={() => {
                      setIsLogoutConfirmOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <LogOut size={16} /> Sair
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileDialog
        open={isProfileModalOpen}
        onOpenChange={(open) => setIsProfileModalOpen(open)}
      />

      {/* Organization Switcher Modal */}
      <OrganizationSwitcherDialog
        open={isOrganizationSwitcherModalOpen}
        onOpenChange={(open) => setIsOrganizationSwitcherModalOpen(open)}
      />

      {/* Logout Confirmation Modal */}
      <Confirm
        open={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Confirmar Saída"
        message="Tem certeza que deseja sair do sistema? Você precisará fazer login novamente para acessar."
        confirmText="Sair"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
};

export default Sidebar;
