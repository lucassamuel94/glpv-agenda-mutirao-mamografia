import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Extrai do `policies.sql` toda tabela que recebe RLS de tenant.
 *
 * Existe para que ninguém precise manter uma segunda lista: o `policies.sql` é
 * a fonte de verdade do isolamento, e tanto o spec do `RlsVerifierService`
 * quanto o `scripts/recreate-dev-db.ts` derivam dele em vez de repetir nomes.
 *
 * Duas formas aparecem no arquivo e as duas contam:
 *   1. `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;` — tabelas declaradas uma a uma.
 *   2. `FOREACH t IN ARRAY ARRAY['a', 'b'] LOOP` — o bloco `DO $$` que aplica a
 *      mesma policy às filhas de `contacts`. Foram essas 4 que ficaram fora da
 *      rede de segurança de boot no achado I9.
 */
export function parsePolicyTables(sql: string): string[] {
  const explicit = [...sql.matchAll(/ALTER TABLE (\w+) ENABLE ROW LEVEL SECURITY/g)].map(
    (m) => m[1]
  );

  const looped = [...sql.matchAll(/FOREACH \w+ IN ARRAY ARRAY\[([^\]]+)\]/g)].flatMap((m) =>
    m[1].split(',').map((t) => t.trim().replace(/^'|'$/g, ''))
  );

  return [...new Set([...explicit, ...looped])].sort();
}

/** Caminho canônico do `policies.sql`, relativo a este módulo. */
export const POLICIES_SQL_PATH = join(__dirname, 'policies.sql');

/** Lê o `policies.sql` do disco e devolve as tabelas com RLS de tenant. */
export function readPolicyTables(sqlPath: string = POLICIES_SQL_PATH): string[] {
  const tables = parsePolicyTables(readFileSync(sqlPath, 'utf8'));

  // Um parser que devolve lista vazia transformaria toda verificação a jusante
  // num falso verde — é exatamente o modo de falha que este módulo existe para
  // evitar, então falha alto.
  if (tables.length === 0) {
    throw new Error(
      `Nenhuma tabela com RLS encontrada em ${sqlPath}. ` +
        'O arquivo mudou de formato e o parser precisa ser atualizado.'
    );
  }

  return tables;
}
