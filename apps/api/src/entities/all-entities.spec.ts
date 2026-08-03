import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { getMetadataArgsStorage } from 'typeorm';
import { ALL_ENTITIES, EntityClass } from './index';

/**
 * `ALL_ENTITIES` é a fonte única da lista de entities do app: as 3 conexões do
 * `DatabaseModule` (master/dashboards/reports, tanto em `forRootAsync` quanto em
 * `forFeature`) e o `scripts/recreate-dev-db.ts` todos a consomem.
 *
 * Antes disso a lista era escrita à mão em vários lugares, e o script ficou
 * incompleto. A consequência não era um erro claro: o `synchronize` criava um
 * schema sem algumas tabelas, o `policies.sql` seguinte falhava no meio, e —
 * como o arquivo é aplicado num único `ds.query(sql)`, portanto numa transação
 * implícita — o Postgres desfazia o lote inteiro. `npm run db:recreate`
 * entregava um banco SEM NENHUMA policy de RLS, em silêncio.
 *
 * Este teste é a trava mecânica que substitui a disciplina manual. Ele descobre
 * as entities pelo FILESYSTEM (não pelo barrel), então pega os dois sentidos do
 * erro: arquivo de entity que não foi exportado no barrel, e entity exportada
 * que ficou fora de `ALL_ENTITIES`.
 */
describe('ALL_ENTITIES', () => {
  /**
   * Importa todo `*.entity.ts` da pasta. O efeito colateral é o que interessa:
   * cada `@Entity()` avaliado registra a classe em `getMetadataArgsStorage()`,
   * que é o registro que o TypeORM realmente usa.
   */
  const declaredEntities = (): EntityClass[] => {
    const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.entity.ts'));

    // Sanidade do próprio teste: sem isso, um glob que não achasse nada faria
    // todas as asserções passarem vacuamente.
    expect(files.length).toBeGreaterThanOrEqual(5);

    for (const file of files) {
      require(path.join(__dirname, file));
    }

    return getMetadataArgsStorage()
      .tables.map((t) => t.target)
      .filter((target): target is EntityClass => typeof target === 'function');
  };

  it('contém toda entity declarada em src/entities/*.entity.ts', () => {
    const declared = declaredEntities();

    const missing = declared.filter((cls) => !ALL_ENTITIES.includes(cls)).map((cls) => cls.name);

    expect(missing).toEqual([]);
  });

  it('não contém entity que deixou de existir, nem repetição', () => {
    const declared = declaredEntities();

    const stale = ALL_ENTITIES.filter((cls) => !declared.includes(cls)).map((cls) => cls.name);
    expect(stale).toEqual([]);

    expect(new Set(ALL_ENTITIES).size).toBe(ALL_ENTITIES.length);
  });

  it('cobre as entidades base do template', () => {
    const names = ALL_ENTITIES.map((e) => e.name);

    expect(names).toContain('User');
    expect(names).toContain('Organization');
    expect(names).toContain('OrganizationUser');
    expect(names).toContain('AuditLog');
  });

  it('registers every mutirao domain entity', () => {
    const names = ALL_ENTITIES.map((entity) => entity.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'Clinic',
        'Slot',
        'Patient',
        'Offer',
        'Appointment',
        'WaitingListEntry',
        'IdempotencyRecord',
      ])
    );
  });
});
