/**
 * Ponto ÚNICO de captura de erro do frontend. Hoje loga estruturado no
 * console (nenhum APM real está configurado nesta instalação — plugar
 * Sentry/Datadog/etc. exige conta e DSN, que este projeto não tem). O ganho
 * de centralizar aqui: todo `catch` do app já reporta pro mesmo lugar, e
 * trocar "console.error" por um SDK de verdade é uma mudança de UM arquivo,
 * não uma varredura em cada `catch` espalhado.
 *
 * Pra ligar um provedor real: instale o SDK, inicialize em
 * `app/layout.tsx` (ou instrumentation.ts), e troque o `console.error`
 * abaixo pela chamada dele (ex.: `Sentry.captureException`).
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("[reportError]", err.message, {
    stack: err.stack,
    ...context,
  });
}

/**
 * Captura erros não tratados (exceptions síncronas fora de qualquer
 * try/catch e promises rejeitadas sem `.catch`) — chame uma vez, no mount
 * do layout raiz.
 */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, { source: "window.onerror" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, { source: "unhandledrejection" });
  });
}
