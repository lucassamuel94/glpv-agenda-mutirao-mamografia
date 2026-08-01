-- ============================================================================
-- Role de teste de RLS — SEM superuser e SEM bypassrls
-- ============================================================================
-- O role de dev (`DB_USERNAME`, default `app`) tem rolsuper e rolbypassrls, então as policies de
-- policies.sql ficam inertes nessa conexão. Este role existe para que os
-- testes de isolamento sejam REAIS. Idempotente.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ezcrm_rls_test') THEN
    CREATE ROLE ezcrm_rls_test LOGIN PASSWORD 'rlstest';
  END IF;
END $$;

ALTER ROLE ezcrm_rls_test NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;

GRANT USAGE ON SCHEMA public TO ezcrm_rls_test;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ezcrm_rls_test;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ezcrm_rls_test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ezcrm_rls_test;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ezcrm_rls_test;
