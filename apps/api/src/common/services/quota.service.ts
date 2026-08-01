import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class QuotaService {
  constructor(@InjectDataSource('master') private readonly dataSource: DataSource) {}

  /**
   * Retorna o limite do plano para um recurso (ex.: users).
   * Se a organização não tiver plano ou o plano não definir limite, retorna Infinity.
   */
  private async getPlanLimit(organizationId: string, resourceKey: string): Promise<number> {
    const row = await this.dataSource.query(
      `SELECT p.limits FROM plans p
       INNER JOIN organizations o ON o.plan_id = p.id
       WHERE o.id = $1`,
      [organizationId]
    );
    if (!row?.length) return Infinity;
    const limits = row[0]?.limits || {};
    const limit = limits[resourceKey];
    return typeof limit === 'number' ? limit : Infinity;
  }

  /**
   * A tabela usa exclusão lógica? Derivado da METADATA da entity, não de uma
   * lista à mão: `@DeleteDateColumn` na entity é a fonte de verdade do schema
   * (CLAUDE.md §Exclusão), então uma entity que passe a ter soft delete entra
   * no filtro sozinha, e uma que não tem nunca ganha um `AND deleted_at IS
   * NULL` que o Postgres rejeitaria.
   *
   * Importa porque o filtro NÃO pode ser cego: em `organization_users` a
   * condição viraria `column "deleted_at" does not exist` se aplicada sem
   * checar a metadata, o `catch` abaixo engoliria o erro e a contagem
   * voltaria ZERO — quota de usuários desligada em silêncio.
   */
  private hasSoftDelete(table: string): boolean {
    return this.dataSource.entityMetadatas.some(
      (metadata) => metadata.tableName === table && metadata.deleteDateColumn != null
    );
  }

  /**
   * Conta uso atual do recurso na organização.
   *
   * Registro excluído logicamente NÃO conta: para qualquer tabela com
   * `@DeleteDateColumn`, um COUNT(*) sem filtro faria a vaga do plano vazar —
   * a org bateria o limite e excluir o registro não devolveria a vaga.
   */
  private async countOrganizationResources(
    organizationId: string,
    resourceKey: string
  ): Promise<number> {
    const tableMap: Record<string, string> = {
      users: 'organization_users',
    };
    const table = tableMap[resourceKey];
    if (!table) return 0;

    const softDeleteFilter = this.hasSoftDelete(table) ? ' AND deleted_at IS NULL' : '';
    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = $1${softDeleteFilter}`,
        [organizationId]
      );
      return result?.[0]?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Verifica se o usuário/organização pode criar mais um recurso (respeitando quota do plano).
   */
  async checkQuota(
    userId: string,
    organizationId: string,
    resourceKey: string,
    amount: number = 1
  ): Promise<boolean> {
    const limit = await this.getPlanLimit(organizationId, resourceKey);
    if (limit === Infinity) return true;

    await this.lockQuotaSlot(organizationId, resourceKey);

    const used = await this.countOrganizationResources(organizationId, resourceKey);
    return used + amount <= limit;
  }

  /**
   * Serializa a decisão de quota por (organização, recurso).
   *
   * ## O problema que isto conserta
   *
   * A checagem e o INSERT são duas operações separadas: quem chama faz
   * `checkQuota` → (outras validações) → `INSERT`. Dois pedidos simultâneos com
   * `used = limite - 1` executam a checagem antes de qualquer um inserir: ambos
   * contam `limite - 1`, ambos concluem que cabe, e ambos inserem. O cliente
   * termina com `limite + 1` recursos e nada reclama depois. Medido em
   * `quota.service.race.integration.spec.ts` — sem este lock, as duas criações
   * na última vaga passam.
   *
   * ## Por que advisory lock, e não outra coisa
   *
   * Não há linha para travar: o limite é uma CONTAGEM, não um registro. `SELECT
   * ... FOR UPDATE` precisa de linha; travar a organização inteira serializaria
   * operações sem relação; e um `CHECK` de banco não consegue contar. Advisory
   * lock é o mecanismo do Postgres para exatamente isto — um mutex nomeado pela
   * aplicação, sem tabela de apoio.
   *
   * `pg_advisory_xact_lock` (a variante `_xact_`) libera no fim da transação,
   * sozinho. A versão sem `_xact_` exigiria `unlock` explícito e vazaria o lock
   * em qualquer caminho de exceção.
   *
   * ## Duas decisões que a granularidade explica
   *
   * A chave é `(hashtext(org), hashtext(recurso))`, então criações de contato de
   * uma organização não bloqueiam nem as de outra organização nem as de empresa
   * da mesma. Colisão de `hashtext` é possível e INÓCUA: o pior caso é dois
   * pares sem relação se serializarem, o que custa latência e nunca correção.
   *
   * ## A precondição que faz isto funcionar
   *
   * O lock precisa ser tomado DENTRO da transação que também faz o INSERT —
   * `pg_advisory_xact_lock` numa transação de um comando só liberaria na hora e
   * não protegeria nada.
   *
   * Usamos `this.dataSource.manager` porque é o que o `backend/CLAUDE.md` §1.1
   * prescreve para se juntar à transação ambiente: `typeorm-transactional`
   * patcheia esse getter (`Object.defineProperty(dataSource, 'manager', ...)`).
   *
   * **Medido em 2026-07-28, e o resultado corrige uma suposição intuitiva:**
   * `this.dataSource.query` teria o MESMO efeito aqui. Contando
   * `pg_locks WHERE locktype='advisory'` de outra conexão, os dois caminhos dão
   * lock retido dentro da transação e liberado depois do commit. Ou seja: trocar
   * um pelo outro NÃO é a armadilha silenciosa que parecia ser, e não vale
   * escrever isso como se fosse.
   *
   * Ficamos com `manager` por convenção do projeto — é o caminho explícito e
   * documentado, em vez de depender de como o `DataSource.query` do TypeORM
   * resolve o query runner internamente, que é detalhe de implementação da lib.
   *
   * Se não houver transação ambiente (script, chamada fora de request), o lock
   * degrada para no-op: pega e solta em seguida. Em produção o
   * `TenantContextInterceptor` abre a transação por request, então o caminho HTTP
   * está coberto; um script que crie recursos em massa precisa envolver a criação
   * em `runInTransaction` para ter a garantia.
   */
  private async lockQuotaSlot(organizationId: string, resourceKey: string): Promise<void> {
    await this.dataSource.manager.query(
      'SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))',
      [organizationId, resourceKey]
    );
  }

  /**
   * Incrementa contador de uso (no-op; o uso é sempre contado em tempo real).
   */
  async incrementUsage(
    userId: string,
    organizationId: string,
    resourceKey: string,
    amount: number = 1
  ): Promise<void> {
    return;
  }

  /**
   * Verifica quota da organização para um recurso.
   */
  async checkOrganizationQuota(organizationId: string, resourceKey: string): Promise<boolean> {
    return this.checkQuota('', organizationId, resourceKey, 1);
  }

  /**
   * Retorna o limite do recurso para a organização (baseado no plano).
   */
  async getResourceLimit(
    userId: string,
    organizationId: string,
    resourceKey: string
  ): Promise<number> {
    return this.getPlanLimit(organizationId, resourceKey);
  }

  /**
   * Retorna uso atual e limite do recurso para a organização.
   */
  async getResourceUsage(
    userId: string,
    organizationId: string,
    resourceKey: string
  ): Promise<{ used: number; limit: number }> {
    const limit = await this.getPlanLimit(organizationId, resourceKey);
    const used = await this.countOrganizationResources(organizationId, resourceKey);
    return {
      used,
      limit: limit === Infinity ? 0 : limit,
    };
  }
}
