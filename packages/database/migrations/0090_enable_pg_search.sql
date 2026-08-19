DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_search;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_search is not supported or deprecated';
END $$;