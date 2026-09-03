ALTER TABLE cash_closes ADD COLUMN IF NOT EXISTS close_date DATE;

UPDATE cash_closes
SET close_date = created_at::date
WHERE close_date IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cash_closes
    GROUP BY organization_id, branch_id, close_date
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'No se puede crear la unicidad de cierres: existen cierres duplicados por sucursal y fecha.';
  END IF;
END $$;

ALTER TABLE cash_closes ALTER COLUMN close_date SET DEFAULT CURRENT_DATE;
ALTER TABLE cash_closes ALTER COLUMN close_date SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_closes_one_per_day
  ON cash_closes(organization_id, branch_id, close_date);
