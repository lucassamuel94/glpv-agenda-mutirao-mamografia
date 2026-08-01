import { BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { GlobalExceptionFilter } from './exception.filter';

/**
 * O filtro global é o último ponto onde um erro de banco ainda pode virar uma
 * resposta útil. Antes, violação de unicidade chegava aqui como `Error` genérico
 * e saía como **500** com a mensagem crua do Postgres
 * (`duplicate key value violates unique constraint "uq_algo"`):
 * o cliente não sabia o que corrigir e o nome interno do índice vazava na API.
 *
 * `UNIQUE_CONSTRAINT_MESSAGES` está vazio no template (nenhum índice único de
 * negócio ainda) — os testes abaixo cobrem os dois caminhos possíveis: uma
 * constraint mapeada (mensagem de negócio) e uma desconhecida (fallback
 * genérico), sem depender de nenhuma constraint real do schema.
 */
describe('GlobalExceptionFilter — violação de unicidade (23505)', () => {
  let filter: GlobalExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: { switchToHttp: () => { getResponse: () => unknown; getRequest: () => unknown } };

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          method: 'PUT',
          url: '/api/reports/abc',
          body: {},
          params: {},
          query: {},
        }),
      }),
    };
  });

  const captured = () => json.mock.calls[0][0] as { statusCode: number; message: string };

  /**
   * Dublê fiel ao que o TypeORM realmente entrega: `QueryFailedError` embrulha
   * o erro do driver `pg` e o expõe em `driverError`. Um dublê que só pusesse
   * `code` no objeto de fora "provaria" o filtro funcionando por um caminho que
   * a produção não usa.
   */
  const pgUniqueViolation = (constraint: string) => {
    const driverError = Object.assign(
      new Error(`duplicate key value violates unique constraint "${constraint}"`),
      { code: '23505', constraint }
    );
    return new QueryFailedError('UPDATE reports SET ...', [], driverError);
  };

  it('não vaza o nome do índice na mensagem', () => {
    filter.catch(pgUniqueViolation('uq_alguma_coisa_nova'), host as never);
    expect(captured().message).not.toMatch(/uq_|duplicate key|constraint/i);
  });

  it('constraint desconhecida também vira 409, com mensagem genérica', () => {
    filter.catch(pgUniqueViolation('uq_alguma_coisa_nova'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(captured().message).toMatch(/já existe um cadastro/i);
  });

  it('erro de banco com OUTRO código continua 500', () => {
    const driverError = Object.assign(new Error('value too long'), { code: '22001' });
    filter.catch(new QueryFailedError('INSERT ...', [], driverError), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('não interfere em HttpException (404 e 400 seguem iguais)', () => {
    filter.catch(new NotFoundException('não achou'), host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

    json.mockClear();
    status.mockClear();
    filter.catch(new BadRequestException('entrada ruim'), host as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(captured().message).toBe('entrada ruim');
  });
});
