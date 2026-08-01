/**
 * Resolução do modo SSL das conexões Postgres (master/dashboards/reports).
 *
 * Achado em smoke de boot real: com `NODE_ENV=production` e Postgres sem TLS
 * (docker/rede privada — caso comum, inclusive no `docker/` deste repo), o
 * SSL era hardcoded por ambiente em `database.module.ts`
 * (`NODE_ENV === 'production' ? { rejectUnauthorized: false } : false`), sem
 * nenhum knob para desligar. Resultado: 15x "Error: The server does not
 * support SSL connections" nas 3 conexões (master, dashboards, reports) e o
 * boot em retry eterno — produção nunca sobe.
 *
 * `DB_SSL` dá esse knob, com compatibilidade total quando ausente:
 * - `DB_SSL=true`  → SSL ligado em qualquer ambiente.
 * - `DB_SSL=false` → SSL desligado em qualquer ambiente (o caso do Postgres
 *   sem TLS em produção).
 * - ausente/vazio/valor inválido → comportamento histórico por ambiente:
 *   produção liga, o resto desliga.
 */
export function resolveDbSsl(env: {
  DB_SSL?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined;
}): false | { rejectUnauthorized: false } {
  if (env.DB_SSL === 'true') {
    return { rejectUnauthorized: false };
  }

  if (env.DB_SSL === 'false') {
    return false;
  }

  return env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}
