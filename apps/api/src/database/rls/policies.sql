-- ============================================================================
-- Row-Level Security Policies — Base
-- ============================================================================
--
-- As policies abaixo impõem isolamento de tenant no nível do banco. Toda
-- request autenticada passa pelo `TenantContextInterceptor`, que abre uma
-- transação e seta `SET LOCAL app.current_tenant_id = '<uuid>'`. As queries
-- da request veem apenas linhas onde `organization_id::text = app.current_tenant_id`.
--
-- IMPORTANTE (produção): as policies SÓ são respeitadas se o role Postgres
-- usado pelo app NÃO for superuser nem tiver `BYPASSRLS`. Em dev usamos
-- `postgres` (superuser) por conveniência — RLS vira "policies declaradas mas
-- inertes". Em staging/prod, criar um role `app_user` sem BYPASSRLS e migrar
-- `DB_USERNAME` para ele.
--
-- Este arquivo é IDEMPOTENTE — pode ser rodado múltiplas vezes sem erro.
-- Isso permite re-aplicar após `synchronize()` sem drop-and-recreate.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper function: retorna o tenant atual ou NULL se não setado.
-- Encapsula `current_setting` com fallback seguro (is_missing_ok=true).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------------------
-- Tabela: organization_users
-- ----------------------------------------------------------------------------
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_organization_users ON organization_users;
CREATE POLICY tenant_isolation_organization_users ON organization_users
  USING (organization_id = app_current_tenant())
  WITH CHECK (organization_id = app_current_tenant());

-- ----------------------------------------------------------------------------
-- Tabela: audit_logs
-- Políticas separadas para leitura e escrita:
--
-- READ (SELECT):
--   - Tenant comum: vê apenas logs da própria org.
--   - SA na Platform: vê TODOS os logs (necessário para o painel de auditoria
--     cross-tenant). Identificado via `app_current_tenant() = PLATFORM_ID`.
--
-- WRITE (INSERT/UPDATE/DELETE):
--   - Sempre exige que `organization_id` bata com o contexto atual (ou ambos
--     NULL em rotas pre-auth). Isso evita inserir log em tenant errado.
-- ----------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Policies antigas (de iterações anteriores) — removidas pra começar limpo.
DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
DROP POLICY IF EXISTS audit_logs_read ON audit_logs;
DROP POLICY IF EXISTS audit_logs_write ON audit_logs;

-- Leitura: tenant próprio OU contexto = Platform (SA dashboard).
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT
  USING (
    organization_id = app_current_tenant()
    OR app_current_tenant() = '00000000-0000-0000-0000-000000000001'::uuid
    OR (organization_id IS NULL AND app_current_tenant() IS NULL)
  );

-- Escrita: restrita ao tenant atual (evita log "plantado" em outro tenant).
CREATE POLICY audit_logs_write ON audit_logs
  FOR ALL
  USING (
    organization_id = app_current_tenant()
    OR (organization_id IS NULL AND app_current_tenant() IS NULL)
  )
  WITH CHECK (
    organization_id = app_current_tenant()
    OR (organization_id IS NULL AND app_current_tenant() IS NULL)
  );

-- ----------------------------------------------------------------------------
-- Tabela: admin_grants — REMOVIDA em 2026-07-28
-- O acesso cross-tenant do SA passou a ser exclusivamente
-- `POST /auth/switch-organization` (spec 2026-07-28-remocao-grants-design).
-- Os DROPs abaixo são idempotentes e existem para que produção
-- (`synchronize: false`) chegue ao mesmo estado que dev.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS platform_only_admin_grants ON admin_grants;
DROP TABLE IF EXISTS admin_grants CASCADE;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS grant_id;

-- ----------------------------------------------------------------------------
-- Tabelas globais (sem RLS):
--   - organizations — listadas em fluxos cross-tenant (switch-org, SA)
--   - users         — globais; filtragem efetiva vem via JOIN com organization_users
--   - plans         — catálogo global
--
-- Essas tabelas NÃO habilitam RLS. Proteção vem da camada de autorização
-- (guards + policies) que já existem.
-- ----------------------------------------------------------------------------
