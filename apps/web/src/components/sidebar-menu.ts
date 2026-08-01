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
  FileText,
  LayoutDashboard,
  Palette,
  ScrollText,
  Shield,
  UserPlus,
} from "lucide-react";
import { Resource } from "@/config/permissions";

export interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  resource: Resource;
  badge?: number;
  children?: MenuItem[];
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
      { icon: UserPlus, label: "Equipe", path: "/team", resource: "settings" },
    ],
  },
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
