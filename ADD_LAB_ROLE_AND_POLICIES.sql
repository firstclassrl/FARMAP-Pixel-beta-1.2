-- =====================================================
-- ADD LAB ROLE + BASE POLICIES FOR LAB TABLES
-- PIXEL CRM - FARMAP
-- =====================================================
-- 1) Adds the 'lab' value to the user_role enum (idempotent)
-- 2) Prepares RLS policies for LAB tables (executed only if tables exist)
--    Tables covered: lab_raw_materials, lab_recipes, lab_recipe_ingredients, lab_samples
-- =====================================================

-- 1. Ensure 'lab' exists inside user_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'lab'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'lab';
    RAISE NOTICE 'Added value ''lab'' to user_role enum';
  ELSE
    RAISE NOTICE 'Value ''lab'' already present in user_role enum, skipping';
  END IF;
END $$;

-- 2. Helper block that enables RLS + policies for LAB tables
DO $$
DECLARE
  target_table text;
  tables text[] := ARRAY['lab_raw_materials', 'lab_recipes', 'lab_recipe_ingredients', 'lab_samples'];
BEGIN
  FOREACH target_table IN ARRAY tables LOOP
    IF to_regclass('public.' || target_table) IS NULL THEN
      RAISE NOTICE 'Table % not found. Policies will be applied automatically when the table is created.', target_table;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', target_table);

    -- Drop existing policies so the script can be re-run safely
    EXECUTE format('DROP POLICY IF EXISTS "LAB access %I" ON %I;', target_table, target_table);

    EXECUTE format($policy$
      CREATE POLICY "LAB access %1$I" ON %1$I
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'lab')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'lab')
          )
        );
    $policy$, target_table);

    RAISE NOTICE 'RLS policy applied to table %', target_table;
  END LOOP;
END $$;

-- =====================================================
-- END OF SCRIPT
-- =====================================================


