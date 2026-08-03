/**
 * Única fonte de verdade para variáveis de ambiente.
 * Nenhum outro arquivo deve usar process.env diretamente; importe daqui ou de @/lib/api/config.
 *
 * Variáveis esperadas no .env / .env.local:
 * - NEXT_PUBLIC_API_URL ou NEXT_PUBLIC_SERVER_URL (URL base da API)
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Google Maps JS SDK — client-side)
 * - GOOGLE_MAPS_SERVER_API_KEY (Geocoding/Places API — server-side only, NÃO exportar aqui)
 */
import { UserRole } from "./types";
/**
 * NEXT_PUBLIC_API_URL | NEXT_PUBLIC_SERVER_URL — URL base (client e API routes, ex.: reports)
 *
 * Conserto (catálogo de correções, item 3): o fallback de dev não incluía o
 * prefixo `/api` (backend usa `app.setGlobalPrefix('api')`, `src/main.ts`) —
 * quem clonava o template (`cp -r`) e rodava sem criar `.env.local` batia em
 * `http://localhost:3001/auth/login` em vez de `http://localhost:3001/api/auth/login`,
 * e o login quebrava na primeira tentativa. Validado empiricamente: login
 * real sem `.env.local`, com o fallback já incluindo `/api`.
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:3001/api";

/** NEXT_PUBLIC_API_URL | NEXT_PUBLIC_SERVER_URL */
export const CLIENT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "/api";

/**
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — chave CLIENT-SIDE para Google Maps JS SDK.
 * Usada apenas em componentes de mapa (Map, RouteMap, MonitoringMap).
 * Restringir no Google Cloud Console: apenas Maps JavaScript API + restricao de referrer HTTP.
 *
 * IMPORTANTE: Para chamadas server-side (Geocoding, Places), usar GOOGLE_MAPS_SERVER_API_KEY
 * diretamente via process.env em lib/server/geocoding.ts (NÃO exportar aqui).
 */
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** NODE_ENV */
export const NODE_ENV = process.env.NODE_ENV;

/** true em desenvolvimento (NODE_ENV === 'development') */
export const IS_DEV = process.env.NODE_ENV === "development";

/**
 * NEXT_PUBLIC_APP_NAME — nome da aplicação. O default é genérico de
 * propósito: este é um template whitelabel (ver `scripts/create-project.mjs`)
 * e um fallback com marca de um cliente específico é o tipo de coisa que só
 * aparece pra quem sobe sem configurar `.env.local`, na hora errada.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "EZ Starter Kit";

/** NEXT_PUBLIC_APP_DESCRIPTION — descrição da aplicação */
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
  "EZ Starter Kit é uma plataforma de CRM para gestão de clientes e leads.";

/** NEXT_PUBLIC_APP_URL — URL da aplicação */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

/** NEXT_PUBLIC_EMAIL_SUPPORT — email de suporte */
export const EMAIL_SUPPORT =
  "suporte@ezsoft.com.br";

/** Canal fixo de suporte da EZ Soft. Não é configuração da organização. */
export const WHATSAPP_SUPPORT = "+55 34 3218-7079";

/** NEXT_PUBLIC_APP_VERSION — versão da aplicação */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

/** NEXT_PUBLIC_APP_AUTHOR — autor da aplicação */
export const APP_AUTHOR = process.env.NEXT_PUBLIC_APP_AUTHOR ?? "";

/** Título da aba (fallback quando ainda não há organização — ver
 *  `generateMetadata` em `app/layout.tsx`). */
export const APP_TITLE = APP_NAME;

export const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: "Administrador" },
  { value: UserRole.MANAGER, label: "Gerente" },
  { value: UserRole.COORDINATOR, label: "Coordenador" },
  { value: UserRole.USER, label: "Usuário (Agente)" },
];
