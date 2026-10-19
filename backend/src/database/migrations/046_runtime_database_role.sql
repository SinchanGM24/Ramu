-- Neon-managed login roles have BYPASSRLS enabled. Keep their credentials for
-- migrations only, and give the application a plain PostgreSQL role instead.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ramu_runtime_permissions') THEN
    CREATE ROLE ramu_runtime_permissions NOLOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ramu_runtime_permissions;

DO $$
DECLARE
  privilege_grant record;
  function_grant record;
BEGIN
  -- Copy only explicit table privileges from the legacy application role.
  -- This preserves restrictions on platform-administration tables.
  FOR privilege_grant IN
    SELECT
      table_schema,
      table_name,
      string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE grantee = 'ramu_app'
    GROUP BY table_schema, table_name
  LOOP
    EXECUTE format(
      'GRANT %s ON TABLE %I.%I TO ramu_runtime_permissions',
      privilege_grant.privileges,
      privilege_grant.table_schema,
      privilege_grant.table_name
    );
  END LOOP;

  -- Copy only explicit EXECUTE grants, never PostgreSQL's PUBLIC default.
  FOR function_grant IN
    SELECT
      namespace.nspname AS schema_name,
      procedure.proname AS function_name,
      pg_get_function_identity_arguments(procedure.oid) AS arguments
    FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
    JOIN LATERAL aclexplode(COALESCE(procedure.proacl, acldefault('f', procedure.proowner))) privilege
      ON true
    JOIN pg_roles grantee ON grantee.oid = privilege.grantee
    WHERE namespace.nspname = 'public'
      AND grantee.rolname = 'ramu_app'
      AND privilege.privilege_type = 'EXECUTE'
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO ramu_runtime_permissions',
      function_grant.schema_name,
      function_grant.function_name,
      function_grant.arguments
    );
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ramu_runtime_permissions;
