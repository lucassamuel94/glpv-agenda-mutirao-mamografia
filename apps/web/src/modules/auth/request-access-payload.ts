/**
 * Payload de API para solicitação de acesso — alinhado com backend RegisterDto.
 * Mapeia valores do formulário (camelCase) para o esperado pela API (snake_case).
 */

import type { RequestAccessFormValues } from "./request-access-validation";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  organization_name: string;
  cnpj: string;
  organization_address?: string;
  logo_url?: string;
  icon_url?: string;
  primary_color?: string;
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable" | "spacious";
  locale: "pt-BR";
  timezone: "America/Sao_Paulo";
  date_format: "DD/MM/YYYY";
};

/**
 * Converte valores do formulário para o payload do POST /auth/register.
 * CNPJ é enviado apenas com dígitos (backend normaliza).
 */
export function toRegisterPayload(
  data: RequestAccessFormValues,
): RegisterPayload {
  const cnpjDigits = (data.cnpj || "").replace(/\D/g, "");
  return {
    name: data.name,
    email: data.email,
    password: data.password,
    organization_name: data.organizationName,
    cnpj: cnpjDigits.length === 14 ? cnpjDigits : data.cnpj,
    organization_address: data.organizationAddress?.trim() || undefined,
    logo_url: data.logoUrl?.trim() || undefined,
    icon_url: data.iconUrl?.trim() || undefined,
    primary_color: data.primaryColor?.trim() || undefined,
    theme: data.theme,
    density: data.density,
    locale: data.locale,
    timezone: data.timezone,
    date_format: data.dateFormat,
  };
}
