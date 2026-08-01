/**
 * O fuso do processo é load-bearing, e este spec é o alarme.
 *
 * As colunas de instante são `timestamp` SEM timezone, e numa coluna sem
 * timezone não existe "instante": existe data/hora de parede, e quem decide o
 * que ela significa é o fuso de quem escreve e de quem lê. O schema tem DUAS
 * origens de tempo — o Postgres (`clock_timestamp()`, `DEFAULT now()`) e o Node
 * (`new Date()` serializado pelo driver `pg`) — e elas só concordam se o
 * processo Node estiver no mesmo fuso da sessão Postgres.
 *
 * Com o Node em `America/Sao_Paulo` a divergência medida era de 3h exatas entre
 * `deals.closed_at` e `deal_stage_history.moved_at` do MESMO evento, na MESMA
 * transação — e passou por quatro planos sem ninguém ver, porque cada coluna
 * isolada parecia plausível. A correção está no topo de `src/main.ts` e no
 * prefixo `TZ=UTC` dos scripts do `package.json`.
 *
 * Este spec falha se alguém rodar sem `TZ=UTC`, e é a única coisa que impede a
 * regressão silenciosa: um script novo sem o prefixo grava instantes deslocados
 * e nenhuma outra asserção do repositório percebe.
 */
import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from '@/entities';

describe('Alinhamento de fuso entre o processo Node e a sessão Postgres', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: ALL_ENTITIES,
      synchronize: false,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('o processo Node roda em UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });

  it('a sessão Postgres roda em UTC', async () => {
    const [{ TimeZone }] = await dataSource.query('SHOW TimeZone');
    expect(TimeZone).toBe('UTC');
  });

  it('os relógios do Node e do Postgres concordam (não há deriva)', async () => {
    const antes = Date.now();
    const [{ ms }] = await dataSource.query(
      'SELECT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint AS ms'
    );
    const depois = Date.now();
    // Janela generosa: o alvo é deriva de RELÓGIO (horas), não latência (ms).
    expect(Number(ms)).toBeGreaterThanOrEqual(antes - 60_000);
    expect(Number(ms)).toBeLessThanOrEqual(depois + 60_000);
  });

  it('um Date do JS e o clock_timestamp() do Postgres gravam o MESMO instante numa coluna sem timezone', async () => {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('CREATE TEMP TABLE tz_probe (origem text, ts timestamp)');
      await runner.query('INSERT INTO tz_probe VALUES ($1, $2)', ['node', new Date()]);
      await runner.query("INSERT INTO tz_probe VALUES ('postgres', clock_timestamp())");

      const [{ delta_seg }] = await runner.query(`
        SELECT ABS(EXTRACT(EPOCH FROM (
          (SELECT ts FROM tz_probe WHERE origem = 'node')
          - (SELECT ts FROM tz_probe WHERE origem = 'postgres')
        )))::int AS delta_seg
      `);

      // Sem TZ=UTC este número é 10800 (3h). É a asserção que importa.
      expect(Number(delta_seg)).toBeLessThan(60);
    } finally {
      await runner.release();
    }
  });
});
