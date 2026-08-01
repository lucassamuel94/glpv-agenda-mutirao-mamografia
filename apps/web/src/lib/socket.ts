/**
 * URL base para conexão WebSocket (mesmo host da API para envio do cookie auth-token).
 * Socket.IO no backend está no root do servidor (/socket.io), não sob o prefixo /api.
 * Por isso removemos /api da BASE_URL quando presente.
 */
import { BASE_URL } from "@/environments";

export function getWsUrl(): string {
  let base = BASE_URL;
  if (typeof window !== "undefined" && !base.startsWith("http")) {
    base = window.location.origin;
  } else if (!base.startsWith("http")) {
    base = "http://localhost:3001";
  }
  try {
    const u = new URL(base);
    if (u.pathname === "/api" || u.pathname.startsWith("/api/")) {
      u.pathname = "/";
      return u.toString().replace(/\/$/, "") || u.origin;
    }
    return base;
  } catch {
    return base;
  }
}
