/**
 * Navegação por mundo — regra central do spec 2026-07-28 (mundo ⇔ contexto):
 *
 *   console (/super-admin/*)  → só itens de Plataforma; contexto = Platform tenant
 *   crm     (demais rotas)    → itens do app operacional; contexto = org operacional
 *
 * Módulo puro (sem hooks) de propósito: os grupos por mundo são testáveis sem
 * renderizar a Sidebar inteira (767 linhas). A seção "Plataforma" não existe
 * no mundo crm nem para SA — a travessia é pelo console ("Entrar na
 * organização") e pelo banner ("Voltar ao console"), nunca pelo menu.
 */
import {
  BarChart3,
  CalendarDays,
  FileText,
  Hospital,
  LayoutDashboard,
  Palette,
  ScrollText,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { Resource } from "@/config/permissions";

export interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  resource: Resource;
  badge?: number;
  children?: MenuItem[];
  superAdminOnly?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export type SidebarWorld = "console" | "crm";

export function getWorld(pathname: string | null): SidebarWorld {
  return pathname?.startsWith("/super-admin") ? "console" : "crm";
}

const CONSOLE_GROUPS: MenuSection[] = [
  {
    title: "Plataforma",
    items: [
      {
        icon: Shield,
        label: "Central de Operações",
        path: "/super-admin",
        resource: "superadmin" as Resource,
      },
      {
        icon: ScrollText,
        label: "Auditoria",
        path: "/super-admin/audit",
        resource: "superadmin" as Resource,
      },
    ],
  },
];

const CRM_GROUPS: MenuSection[] = [
  {
    title: "Geral",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/",
        resource: "dashboard",
      },
      {
        icon: BarChart3,
        label: "Relatórios",
        path: "/reports",
        resource: "reports",
      },
    ],
  },
  {
    title: "Mutirão",
    items: [
      { icon: CalendarDays, label: "Agenda", path: "/agenda", resource: "agenda" as Resource },
      { icon: Users, label: "Pacientes", path: "/pacientes", resource: "pacientes" as Resource },
      {
        icon: Hospital,
        label: "Clínicas",
        path: "/clinics",
        resource: "superadmin" as Resource,
        superAdminOnly: true,
      },
    ],
  },
];

/** Itens que ficam no rodapé do nav, separados dos grupos principais. */
const CRM_BOTTOM_ITEMS: MenuItem[] = [
  { icon: UserPlus, label: "Equipe", path: "/team", resource: "settings" },
];

const DEV_GUIDE_GROUP: MenuSection = {
  title: "Guia de Estilo",
  items: [
    {
      icon: Palette,
      label: "Style Guide",
      path: "/super-admin/style-guide",
      resource: "*",
    },
    {
      icon: FileText,
      label: "Form Guide",
      path: "/super-admin/form-guide",
      resource: "*",
    },
  ],
};

export function buildMenuGroups(
  world: SidebarWorld,
  options: { includeDevGuides?: boolean } = {},
): MenuSection[] {
  const includeDevGuides = options.includeDevGuides ?? true;

  if (world === "console") {
    return includeDevGuides ? [...CONSOLE_GROUPS, DEV_GUIDE_GROUP] : CONSOLE_GROUPS;
  }

  return CRM_GROUPS;
}

/** Itens isolados exibidos no fundo da sidebar (antes do footer/user menu). */
export function buildBottomItems(world: SidebarWorld): MenuItem[] {
  if (world === "console") return [];
  return CRM_BOTTOM_ITEMS;
}
