/**
 * Testes de `usePlatformContext` (spec 2026-07-28; ver o comentário
 * completo no hook para o histórico da corrida de "Entrar na organização"
 * e por que o latch é defesa em profundidade, não a correção dela).
 *
 * O caso "LATCH" abaixo é sintético: pina a semântica "uma vez ready, o
 * effect não reage mais a `currentTenant`" para o hipotético contexto
 * trocado com o console MONTADO e SEM remount. Ele não reproduz a corrida
 * real medida no navegador em 2026-07-28 — aquela era
 * `useAuth().switchOrganization` setando `isLoading` → `RequireAuth`
 * desmontando o console → `PlatformGate` remontando ZERADO (um latch por
 * `useState` não sobrevive a esse remount). A correção de verdade ficou em
 * `SuperAdmin.handleEnterOrganization` (chama a API direto, sem estado do
 * React). Ainda assim, sem o `if (status === "ready") return;` no hook,
 * este caso fica VERMELHO — é isso que ele prova.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { PLATFORM_TENANT_ID, usePlatformContext } from "./use-platform-context";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

const ORG_TENANT_ID = "22222222-2222-2222-2222-222222222222";

function setAuth(over: Record<string, unknown>) {
  mockedUseAuth.mockReturnValue({
    isLoading: false,
    isSa: () => true,
    switchOrganization: vi.fn(),
    currentTenant: { id: ORG_TENANT_ID, name: "Cliente", is_primary: false },
    ...over,
  } as never);
}

describe("usePlatformContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SA em org operacional → dispara switchOrganization(PLATFORM) uma vez; ready quando o auth confirma a Platform", async () => {
    const switchOrganization = vi.fn().mockResolvedValue({ success: true });
    setAuth({ switchOrganization });

    const { result, rerender } = renderHook(() => usePlatformContext());

    expect(result.current.status).toBe("pending");
    expect(switchOrganization).toHaveBeenCalledTimes(1);
    expect(switchOrganization).toHaveBeenCalledWith(PLATFORM_TENANT_ID);

    // Deixa o `.then` da promise assentar antes de simular o auth atualizado
    // (é isso que o `await switchOrganization(...)` do próprio hook produz).
    await act(async () => {});

    // Estado de auth muda como consequência do switch bem-sucedido.
    setAuth({
      switchOrganization,
      currentTenant: { id: PLATFORM_TENANT_ID, name: "Platform", is_primary: true },
    });
    rerender();

    expect(result.current.status).toBe("ready");
    expect(result.current.isReady).toBe(true);
    // Não disparou de novo — um único switch para chegar lá.
    expect(switchOrganization).toHaveBeenCalledTimes(1);
  });

  it("LATCH: uma vez ready, uma travessia deliberada para outra org NÃO reaciona o switch para a Platform", () => {
    const switchOrganization = vi.fn().mockResolvedValue({ success: true });
    setAuth({
      switchOrganization,
      currentTenant: { id: PLATFORM_TENANT_ID, name: "Platform", is_primary: true },
    });

    const { result, rerender } = renderHook(() => usePlatformContext());

    expect(result.current.status).toBe("ready");
    expect(switchOrganization).not.toHaveBeenCalled();

    // Simula "Entrar na organização": o auth troca de tenant com o console
    // ainda montado (mesma instância do hook) — é exatamente a corrida
    // medida no navegador.
    setAuth({
      switchOrganization,
      currentTenant: { id: ORG_TENANT_ID, name: "Cliente", is_primary: false },
    });
    rerender();

    // O latch trava: nenhum switch de volta para a Platform, status
    // permanece ready. Sem o `if (status === "ready") return;`, este
    // asserto fica vermelho (ver cabeçalho do arquivo).
    expect(switchOrganization).not.toHaveBeenCalled();
    expect(result.current.status).toBe("ready");
    expect(result.current.isReady).toBe(true);
  });

  it("não-SA → forbidden (regressão)", () => {
    const switchOrganization = vi.fn();
    setAuth({ isSa: () => false, switchOrganization });

    const { result } = renderHook(() => usePlatformContext());

    expect(result.current.status).toBe("forbidden");
    expect(result.current.isReady).toBe(false);
    expect(switchOrganization).not.toHaveBeenCalled();
  });
});
