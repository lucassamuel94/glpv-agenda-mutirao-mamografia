import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Campos que NUNCA devem sair em respostas HTTP. Aplicado recursivamente
 * em todos os níveis do objeto de resposta (incluindo relações aninhadas).
 *
 * Critério: qualquer campo com valor semelhante a segredo, hash, token ou
 * dado de identidade confidencial. Mantemos uma lista explícita (whitelist
 * de remoção) em vez de heurística para evitar falsos positivos.
 */
export const SENSITIVE_FIELDS: ReadonlySet<string> = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  // `hash` no contexto User é o rotating security hash usado para invalidar
  // JWTs antigos — se vazar, atacante consegue forjar tokens e burlar logout.
  'hash',
  // API keys e secrets armazenados em entidades (ex.: integrações de terceiros).
  'api_key',
  'apiKey',
  'secret',
  'client_secret',
  'clientSecret',
  'refresh_token',
  'refreshToken',
  // NOTA: `access_token`/`accessToken` NÃO estão na lista. São tokens JWT
  // que o próprio backend EMITE em respostas de login/switch-organization —
  // removê-los quebra autenticação. Tokens de terceiros (ex.: OAuth de
  // integração) devem ser salvos em campos nomeados explicitamente
  // (como `integration_token`) ou marcados via class-transformer @Exclude.
]);

/**
 * Campos de BOOKKEEPING de schema que vazam no payload porque nenhum
 * controller deste backend mapeia a resposta para um DTO explícito — eles
 * devolvem a entity crua do repositório (`return this.service.findOne(id)`),
 * e o TypeORM carrega TODAS as colunas por padrão. Categoria DIFERENTE de
 * `SENSITIVE_FIELDS` (não é segredo/credencial — por isso um Set separado,
 * para não confundir o critério documentado ali): é dado de IMPLEMENTAÇÃO
 * (soft delete, RLS) que nunca fez parte do CONTRATO da API.
 *
 * `deleted_at`: MEDIDO vazando (sempre `null` para qualquer linha viva, já
 * que toda leitura filtra `deleted_at IS NULL`) em todo módulo com
 * `@DeleteDateColumn` cujo controller devolve a entity direto.
 *
 * O MECANISMO de remoção (interceptor global, recursivo) é reaproveitado do
 * que já existe para campos sensíveis — criar um DTO de resposta por
 * controller para consertar isto teria que tocar cada um dos módulos
 * afetados (e o próximo que esquecer reabre o mesmo vazamento); um Set aqui
 * cobre todos de uma vez, inclusive futuros.
 */
const SCHEMA_ONLY_FIELDS: ReadonlySet<string> = new Set(['deleted_at']);

/**
 * Limite de profundidade para recursão — protege contra ciclos nas entidades
 * TypeORM (ex.: `user.organizationUsers[0].user.organizationUsers...`).
 */
const MAX_DEPTH = 8;

/**
 * Interceptor global que remove campos sensíveis E campos de schema que não
 * fazem parte do contrato (`SCHEMA_ONLY_FIELDS`) de TODAS as respostas.
 *
 * Defense-in-depth: mesmo quando um controller esquece de usar DTOs ou
 * `ClassSerializerInterceptor`, este interceptor serve como safety net —
 * garante que `password_hash`, `hash` de segurança, tokens e `deleted_at`
 * nunca vazam.
 *
 * Percorre a estrutura inteira (arrays, objetos aninhados, resultados
 * paginados). Lida com `PaginatedResponse<T>` preservando metadados de
 * paginação e sanitizando apenas o array `data`.
 */
@Injectable()
export class ResponseSanitizerInterceptor implements NestInterceptor {
  private sanitize(data: unknown, depth = 0): unknown {
    if (data === null || data === undefined || depth >= MAX_DEPTH) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    // Preserva tipos primitivos e "boxed" (Date, Buffer, etc.)
    if (typeof data !== 'object') return data;
    if (data instanceof Date) return data;
    if (Buffer.isBuffer(data)) return data;

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key) || SCHEMA_ONLY_FIELDS.has(key)) continue;
      result[key] = this.sanitize(value, depth + 1);
    }
    return result;
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.sanitize(data)));
  }
}
