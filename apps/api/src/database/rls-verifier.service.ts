import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { readPolicyTables } from './rls/parse-policy-tables';

/** Erro de segurança fatal — precisa atravessar o catch genérico do boot sem ser engolido. */
class RlsBypassError extends Error {}

/**
 * Verifica no boot se RLS está habilitado nas tabelas tenant-scoped.
 * Se não estiver, loga WARNING bem visível — mas não aborta.
 *
 * Justificativa: `synchronize: true` recria tabelas em dev e pode deixar
 * RLS desabilitado após mudanças de entity. O desenvolvedor deve rodar
 * `npm run db:recreate` para restaurar.
 *
 * Em produção (`synchronize: false`), essa verificação é mais uma safety
 * net para confirmar que o release deploy aplicou as migrations de RLS.
 */
@Injectable()
export class RlsVerifierService implements OnApplicationBootstrap {
  private readonly logger = new Logger('RlsVerifier');

  /**
   * TODA tabela com `organization_id` e policy em `policies.sql` entra aqui —
   * a lista é a rede de segurança do boot, e uma tabela ausente dela é uma
   * tabela cuja RLS pode ter caído no `synchronize` sem ninguém notar.
   */
  private readonly tenantScopedTables = readPolicyTables();

  constructor(@InjectDataSource('master') private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      // Conta as policies junto com o flag. `rowsecurity` sozinho não prova
      // isolamento: tabela com `ENABLE ROW LEVEL SECURITY` e ZERO policies nega
      // tudo para quem não é owner e libera tudo para o owner — e o app conecta
      // como owner. O verificador aprovaria a leitura da base inteira.
      const rows: Array<{ tablename: string; rowsecurity: boolean; policies: number }> =
        await this.dataSource.query(
          `SELECT t.tablename,
                  t.rowsecurity,
                  (SELECT count(*)::int FROM pg_policies p
                    WHERE p.schemaname = 'public' AND p.tablename = t.tablename) AS policies
             FROM pg_tables t
            WHERE t.schemaname = 'public'
              AND t.tablename = ANY($1::text[])`,
          [this.tenantScopedTables]
        );

      const byTable = new Map(rows.map((r) => [r.tablename, r]));

      const absent: string[] = [];
      const disabled: string[] = [];
      const withoutPolicy: string[] = [];

      for (const table of this.tenantScopedTables) {
        const row = byTable.get(table);
        if (!row) absent.push(table);
        else if (!row.rowsecurity) disabled.push(table);
        else if (row.policies === 0) withoutPolicy.push(table);
      }

      if (absent.length || disabled.length || withoutPolicy.length) {
        const detail = [
          absent.length ? `tabela ausente: ${absent.join(', ')}` : null,
          disabled.length ? `RLS desabilitada: ${disabled.join(', ')}` : null,
          withoutPolicy.length
            ? `RLS habilitada mas SEM policy (equivale a sem isolamento para o owner): ${withoutPolicy.join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' | ');

        this.logger.warn(
          `⚠️  Isolamento por tenant incompleto — ${detail}. ` +
            'Rode `npm run db:recreate` para recriar o schema e reaplicar as policies.'
        );
        return;
      }

      const total = rows.reduce((sum, r) => sum + r.policies, 0);

      // Policies existirem não basta: um role com BYPASSRLS ou superuser
      // ignora RLS inteiramente, mesmo com policy escrita e `rowsecurity`
      // ligado — é exatamente o papel usado por padrão em dev (ver
      // `test-role.sql`, que existe por causa disso). Em produção isso
      // precisa abortar o boot: reportar "RLS ativa" nesse cenário é dar
      // falso positivo de isolamento entre empresas clientes.
      const [{ rolsuper, rolbypassrls }] = await this.dataSource.query<
        Array<{ rolsuper: boolean; rolbypassrls: boolean }>
      >(`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`);

      if (rolsuper || rolbypassrls) {
        const reason = rolsuper ? 'é superuser' : 'tem BYPASSRLS';
        if (process.env.NODE_ENV === 'production') {
          throw new RlsBypassError(
            `Role de conexão do banco ${reason} — RLS fica inerte independente das policies. ` +
              'Em produção, conecte com um role restrito (NOSUPERUSER NOBYPASSRLS), como o criado ' +
              'em src/database/rls/test-role.sql. Abortando boot: subir assim expõe dados entre organizações.'
          );
        }
        this.logger.warn(
          `⚠️  Role de conexão do banco ${reason} — RLS está inerte nesta conexão (normal em dev; ` +
            'nunca use este role em produção). Policies existem, mas não têm efeito para este role.'
        );
        return;
      }

      this.logger.log(
        `✅ RLS ativa em ${this.tenantScopedTables.length} tabelas (${total} policies).`
      );
    } catch (err) {
      // RlsBypassError é intencional (produção + role sem isolamento real) —
      // precisa atravessar e derrubar o boot, não ser tratada como falha de
      // diagnóstico igual às demais.
      if (err instanceof RlsBypassError) throw err;

      // Falha ao rodar a verificação em si (ex.: sem permissão pra ler
      // pg_roles/pg_policies) não aborta — boot continua, mas loga claro.
      this.logger.error(
        `Falha ao verificar RLS: ${(err as Error).message}. ` +
          'App continua, mas isolamento por tenant pode estar comprometido.'
      );
    }
  }
}
