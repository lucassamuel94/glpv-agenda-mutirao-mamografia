import { resolveDbSsl } from './db-ssl';

describe('resolveDbSsl', () => {
  it('DB_SSL=true liga SSL mesmo em desenvolvimento', () => {
    expect(resolveDbSsl({ DB_SSL: 'true', NODE_ENV: 'development' })).toEqual({
      rejectUnauthorized: false,
    });
  });

  it('DB_SSL=false desliga SSL mesmo em produção (Postgres sem TLS)', () => {
    expect(resolveDbSsl({ DB_SSL: 'false', NODE_ENV: 'production' })).toBe(false);
  });

  it('DB_SSL ausente em produção mantém o comportamento atual: ligado', () => {
    expect(resolveDbSsl({ NODE_ENV: 'production' })).toEqual({ rejectUnauthorized: false });
  });

  it('DB_SSL ausente fora de produção mantém o comportamento atual: desligado', () => {
    expect(resolveDbSsl({ NODE_ENV: 'development' })).toBe(false);
  });

  it('DB_SSL com valor inválido é tratado como ausente (produção liga)', () => {
    expect(resolveDbSsl({ DB_SSL: 'yes-please', NODE_ENV: 'production' })).toEqual({
      rejectUnauthorized: false,
    });
  });
});
