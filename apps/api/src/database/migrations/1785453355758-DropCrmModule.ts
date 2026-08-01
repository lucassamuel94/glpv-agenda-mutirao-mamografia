import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove o módulo CRM (contacts/companies/deals + funil + campos
 * customizados) do template. Decisão do time: o template passou a ter um
 * módulo de exemplo genérico (`reports`, sobre `audit_logs`) no lugar do
 * CRM, que era específico demais de um domínio para um template whitelabel.
 *
 * Ordem de DROP é FK-safe: tabelas filhas antes das mães. `CASCADE` não é
 * necessário porque a ordem já resolve as dependências, mas cada `DROP TABLE
 * IF EXISTS` é idempotente por si só.
 *
 * `down()` NÃO recria o schema — dado apagado por `DROP TABLE` não volta.
 * Rollback real é restaurar backup, não uma migration `down`.
 */
export class DropCrmModule1785453355758 implements MigrationInterface {
  name = 'DropCrmModule1785453355758';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.deal_field_values;
      DROP TABLE IF EXISTS public.deal_stage_history;
      DROP TABLE IF EXISTS public.deals;
      DROP TABLE IF EXISTS public.contact_field_values;
      DROP TABLE IF EXISTS public.contact_emails;
      DROP TABLE IF EXISTS public.contact_phones;
      DROP TABLE IF EXISTS public.contacts;
      DROP TABLE IF EXISTS public.company_field_values;
      DROP TABLE IF EXISTS public.companies;
      DROP TABLE IF EXISTS public.interactions;
      DROP TABLE IF EXISTS public.tasks;
      DROP TABLE IF EXISTS public.pipeline_stages;
      DROP TABLE IF EXISTS public.pipelines;
      DROP TABLE IF EXISTS public.custom_field_definitions;
    `);
  }

  public async down(): Promise<void> {
    throw new Error(
      'DropCrmModule1785453355758 não é reversível por migration: as tabelas do CRM ' +
        'e os dados nelas foram apagados por DROP TABLE. Restaure de um backup se precisar do CRM de volta.'
    );
  }
}
