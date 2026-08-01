"use client";

import { PlatformGate } from "@/modules/super-admin/platform-gate";

/**
 * Todas as rotas do console (/super-admin/*) passam pelo PlatformGate —
 * ver o comentário do gate. Layout aninhado do App Router: roda DENTRO do
 * (protected)/layout.tsx (RequireAuth continua valendo).
 */
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformGate>{children}</PlatformGate>;
}
