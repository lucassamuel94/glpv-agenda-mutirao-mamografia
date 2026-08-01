"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

/**
 * UUID fixo da Platform tenant — deve bater com backend
 * (`PLATFORM_TENANT_ID` em `backend/src/entities/organization.entity.ts`).
 */
export const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

type PlatformContextStatus = "pending" | "ready" | "forbidden";

/**
 * Garante que o SA esteja operando com contexto = Platform tenant em TODA
 * rota /super-admin/* — aplicado uma única vez pelo `PlatformGate`, em
 * `app/(protected)/super-admin/layout.tsx` (não mais só
 * /super-admin/grants e /super-admin/audit; essa era a cobertura antiga,
 * de antes da spec 2026-07-28).
 *
 * Fluxo:
 *   - Não-SA → `forbidden` (caller decide redirecionar).
 *   - SA já na Platform → `ready` imediatamente.
 *   - SA em outra org → dispara `switchOrganization(PLATFORM)` uma vez e
 *     fica em `pending` até concluir.
 *
 * Desde o backend `ad86842`, o SA já loga com contexto = Platform (o
 * console é o hub); não é mais "SA loga numa org operacional por padrão".
 * A aquisição aqui cobre o SA chegar em /super-admin já fora da Platform
 * por outro caminho (URL direta, back/forward do browser) — não o login.
 *
 * Segurança: o backend continua validando via `isActingOnPlatform`. O hook
 * não bypassa — apenas automatiza a ida ao contexto correto.
 *
 * LATCH (one-way, garante na ENTRADA — não vigia): uma vez que o status
 * atinge `"ready"`, o effect trava e NUNCA mais dispara `switchOrganization`
 * neste ciclo de vida do hook, mesmo que `currentTenant` mude depois.
 *
 * HISTÓRIA CORRETA da corrida (corrigida em 2026-07-28 — a versão anterior
 * deste comentário estava refutada por medição real no navegador):
 *
 *   1. `useAuth().switchOrganization` (chamado por
 *      `SuperAdmin.handleEnterOrganization`) seta `isLoading=true`.
 *   2. `RequireAuth`, ainda envolvendo o console, vê `isLoading` e
 *      renderiza a tela de loading de página inteira NO LUGAR dos
 *      children — o que DESMONTA o console (e, com ele, o `PlatformGate` e
 *      esta instância do hook).
 *   3. Quando o switch termina e o console remonta, o `PlatformGate` nasce
 *      FRESH: `status` volta a `"pending"` do zero e o effect readquire a
 *      Platform — desfazendo a travessia que o usuário acabou de fazer.
 *
 *   Um latch por `useState` não sobrevive a um remount (o estado inteiro é
 *   descartado e recriado). Por isso esta defesa, por si só, NUNCA teria
 *   resolvido essa corrida — ela vive num componente que a própria corrida
 *   destrói antes do latch entrar em ação.
 *
 *   A correção de verdade tirou a travessia console → CRM do caminho de
 *   estado do React: `SuperAdmin.handleEnterOrganization` chama a API
 *   direto (`authApi.switchOrganization`), sem passar por
 *   `useAuth().switchOrganization`, e navega com
 *   `window.location.assign("/")`. Sem o `switchOrganization` do hook em
 *   voo, não há `isLoading`, não há desmonte, não há corrida.
 *
 * Com a corrida real resolvida na origem, o latch passa a ser DEFESA EM
 * PROFUNDIDADE: cobre o caso hipotético de `currentTenant` mudar com o
 * console MONTADO e SEM remount. Hoje nenhum caminho de produção exercita
 * essa condição — o teste "LATCH" abaixo pina a semântica com uma travessia
 * sintética (não uma reprodução do fluxo real) para garantir que, se algo
 * assim voltar a existir, o hook não briga com ele.
 *
 * "Voltar ao console" (`SaOrgBanner`) é navegação client-side
 * (`router.push`, sem reload de página); funciona porque é o REMOUNT do
 * layout do console (App Router troca de árvore) que faz o hook nascer
 * fresh — `status` volta a `"pending"` e o fluxo pending → switch → ready
 * roda de novo normalmente.
 *
 * Se algo externo trocar o contexto com o console aberto (sem passar pelo
 * fluxo de travessia), o backend continua recusando via `isActingOnPlatform`
 * (403) — degradação segura: o hook garante a entrada, o backend garante
 * sempre.
 */
export function usePlatformContext(): {
  status: PlatformContextStatus;
  isReady: boolean;
} {
  const { currentTenant, switchOrganization, isSa, isLoading } = useAuth();
  const [status, setStatus] = useState<PlatformContextStatus>("pending");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // Latch: uma vez pronto, o effect nunca mais reage a mudanças de
    // currentTenant. Defesa em profundidade para o hipotético "contexto
    // trocado com o console montado, sem remount" — não é o que resolve a
    // corrida de "Entrar na organização" (ver histórico completo no
    // comentário do hook, acima): aquela corrida se resolve porque a
    // travessia não passa mais pelo `switchOrganization` do useAuth.
    if (status === "ready") return;
    if (isLoading) return;
    if (!isSa()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("forbidden");
      return;
    }
    if (currentTenant?.id === PLATFORM_TENANT_ID) {
      setStatus("ready");
      return;
    }
    if (!attempted) {
      setAttempted(true);
      switchOrganization(PLATFORM_TENANT_ID).then((result) => {
        if (!result.success) {
          // Se falhou (ex.: SA sem vínculo na Platform tenant por migração
          // incompleta), bloqueia acesso ao invés de loop infinito.
          setStatus("forbidden");
        }
        // Caso de sucesso: o estado de auth re-renderiza e o effect detecta
        // currentTenant.id = PLATFORM → vira 'ready' na próxima passagem.
      });
    }
  }, [
    status,
    isLoading,
    currentTenant?.id,
    attempted,
    isSa,
    switchOrganization,
  ]);

  return { status, isReady: status === "ready" };
}
