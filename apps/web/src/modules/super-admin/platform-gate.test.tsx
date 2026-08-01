/**
 * Metade console da regra mundo ⇔ contexto (spec 2026-07-28): TODA rota
 * /super-admin/* opera na Platform tenant. Antes, só grants/audit garantiam
 * isso (usePlatformContext por página); a Central de Operações aceitava
 * contexto de cliente — era o estado "no console, mas com JWT de um cliente".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { PlatformGate } from "./platform-gate";
import { usePlatformContext } from "@/hooks/use-platform-context";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/hooks/use-platform-context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-platform-context")>();
  return {
    ...actual,
    usePlatformContext: vi.fn(),
  };
});

const mockedCtx = vi.mocked(usePlatformContext);

describe("PlatformGate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ready → renderiza o console", () => {
    mockedCtx.mockReturnValue({ status: "ready", isReady: true });
    render(<PlatformGate><p>console</p></PlatformGate>);
    expect(screen.getByText("console")).toBeInTheDocument();
  });

  it("pending (switch para a Platform em andamento) → segura a renderização", () => {
    mockedCtx.mockReturnValue({ status: "pending", isReady: false });
    render(<PlatformGate><p>console</p></PlatformGate>);
    expect(screen.queryByText("console")).not.toBeInTheDocument();
  });

  it("forbidden (não-SA) → expulsa para o CRM", () => {
    mockedCtx.mockReturnValue({ status: "forbidden", isReady: false });
    render(<PlatformGate><p>console</p></PlatformGate>);
    expect(replace).toHaveBeenCalledWith("/");
    expect(screen.queryByText("console")).not.toBeInTheDocument();
    // forbidden não é loading: o gate retorna null direto, sem passar pela
    // tela "Carregando..." do estado pending.
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
  });
});
