-- Normalize the geographic catalog active flags.
-- Early deployments created these columns as BOOLEAN while the canonical
-- schema and the rest of the application use INTEGER 0/1. Convert only when
-- needed so the migration is safe for both existing and empty databases.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'countries'
      AND column_name = 'active' AND data_type = 'boolean'
  ) THEN
    ALTER TABLE countries ALTER COLUMN active TYPE INTEGER USING CASE WHEN active THEN 1 ELSE 0 END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'provinces'
      AND column_name = 'active' AND data_type = 'boolean'
  ) THEN
    ALTER TABLE provinces ALTER COLUMN active TYPE INTEGER USING CASE WHEN active THEN 1 ELSE 0 END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_zones'
      AND column_name = 'active' AND data_type = 'boolean'
  ) THEN
    ALTER TABLE service_zones ALTER COLUMN active TYPE INTEGER USING CASE WHEN active THEN 1 ELSE 0 END;
  END IF;
END $$;
