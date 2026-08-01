/**
 * Fonte ÚNICA do segredo JWT.
 *
 * ## Por que este arquivo existe
 *
 * Havia TRÊS fallbacks hardcoded e DIVERGENTES espalhados pelo código:
 * `auth.module.ts` assinava com um ('ezfrotas-secret-key-...', resíduo de outro
 * projeto), enquanto `jwt.strategy.ts` e `websocket.module.ts` verificavam com
 * outro ('sua_chave_secreta'). Consequência com `JWT_SECRET` ausente do
 * ambiente: o login "funciona" (token é emitido) e TODA requisição seguinte
 * falha com 401 — o token foi assinado com um segredo e conferido com outro.
 * É o pior tipo de erro de configuração: o sintoma aparece longe da causa.
 *
 * ## As regras
 *
 * - **Produção sem `JWT_SECRET` não sobe.** Fallback hardcoded em produção
 *   significa token forjável por qualquer pessoa com acesso ao repositório.
 *   O boot falha com mensagem dizendo exatamente o que configurar.
 * - **Dev/test usam UM fallback compartilhado**, exportado daqui e importado
 *   por todos os consumidores — nunca reescrito localmente.
 */

const DEV_ONLY_FALLBACK = 'template-dev-only-secret-nao-use-em-producao';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET é obrigatório em produção. Gere um valor forte (ex.: ' +
        '`openssl rand -base64 48`) e defina a variável de ambiente antes de subir. ' +
        'Sem isso os tokens seriam assinados com um segredo público do repositório.'
    );
  }

  return DEV_ONLY_FALLBACK;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}
