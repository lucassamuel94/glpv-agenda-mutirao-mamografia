import { resolveListSort } from './list-sort';

const ALLOWED = new Set(['name', 'segment', 'updated_at', 'created_at']);

describe('resolveListSort', () => {
  it('usa a coluna pedida quando está na allowlist', () => {
    expect(resolveListSort(ALLOWED, 'created_at', 'name', 'ASC')).toEqual({
      column: 'name',
      direction: 'ASC',
    });
  });

  it('cai no default quando a coluna NÃO está na allowlist (não devolve erro)', () => {
    // URL antiga/compartilhada com uma coluna que já não existe tem que abrir a
    // listagem, não estourar.
    expect(resolveListSort(ALLOWED, 'created_at', 'coluna_que_nao_existe', 'ASC')).toEqual({
      column: 'created_at',
      direction: 'ASC',
    });
  });

  it('nenhuma tentativa de injeção sobrevive à allowlist', () => {
    for (const attempt of [
      'name; DROP TABLE companies',
      'password_hash',
      '(SELECT 1)',
      'company.name, users.email',
      '"name"',
    ]) {
      expect(resolveListSort(ALLOWED, 'created_at', attempt, 'ASC').column).toBe('created_at');
    }
  });

  it('sortBy ausente usa o default', () => {
    expect(resolveListSort(ALLOWED, 'created_at', undefined, undefined)).toEqual({
      column: 'created_at',
      direction: 'DESC',
    });
  });

  it('direção é fechada em ASC/DESC — qualquer outra coisa vira DESC', () => {
    expect(resolveListSort(ALLOWED, 'created_at', 'name', 'asc').direction).toBe('DESC');
    expect(resolveListSort(ALLOWED, 'created_at', 'name', 'DESC; DROP').direction).toBe('DESC');
    expect(resolveListSort(ALLOWED, 'created_at', 'name', 'ASC').direction).toBe('ASC');
  });

  it('string vazia em sortBy não vence o default', () => {
    expect(resolveListSort(ALLOWED, 'created_at', '', 'ASC').column).toBe('created_at');
  });
});
