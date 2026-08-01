/**
 * O fail-fast do JWT_SECRET é load-bearing: sem ele, produção subiria assinando
 * tokens com um segredo público do repositório (forjável por qualquer pessoa
 * com acesso ao código). Estes testes garantem que a recusa continua existindo
 * — remover o `throw` de `getJwtSecret` deixa o primeiro caso vermelho.
 */
import { getJwtSecret, getJwtExpiresIn } from './jwt-secret';

describe('getJwtSecret', () => {
  const original = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };

  afterEach(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    if (original.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.JWT_SECRET;
  });

  it('produção SEM JWT_SECRET recusa o boot com mensagem acionável', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET é obrigatório em produção/);
  });

  it('produção COM JWT_SECRET usa exatamente o valor configurado', () => {
    process.env.JWT_SECRET = 'segredo-de-producao';
    process.env.NODE_ENV = 'production';
    expect(getJwtSecret()).toBe('segredo-de-producao');
  });

  it('desenvolvimento sem JWT_SECRET usa o fallback ÚNICO compartilhado', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';
    // Quem assina (auth.module) e quem verifica (jwt.strategy, websocket)
    // importam esta MESMA função — a divergência de fallbacks que existia
    // produzia 401 em tudo logo após um login "bem-sucedido".
    expect(getJwtSecret()).toBe('template-dev-only-secret-nao-use-em-producao');
  });
});

describe('getJwtExpiresIn', () => {
  it('usa 7d quando não configurado', () => {
    const original = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;
    expect(getJwtExpiresIn()).toBe('7d');
    if (original !== undefined) process.env.JWT_EXPIRES_IN = original;
  });
});
