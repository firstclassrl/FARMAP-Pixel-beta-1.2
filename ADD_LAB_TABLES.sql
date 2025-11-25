-- =====================================================
-- LAB DATA STRUCTURES (RAW MATERIALS, RECIPES, SAMPLES)
-- PIXEL CRM - FARMAP
-- =====================================================
-- This script creates the base schema for the LAB area:
--   * lab_raw_materials          -> master data for ingredients
--   * lab_recipes                -> recipes with batch details
--   * lab_recipe_ingredients     -> % / qty per recipe
--   * lab_samples                -> custom batches for third-party clients
--   * lab_recipe_costs_view      -> aggregate cost helper for UI/PDF sheets
-- =====================================================

-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lab_sample_status') THEN
    CREATE TYPE lab_sample_status AS ENUM (
      'draft',
      'pending',
      'in_progress',
      'ready',
      'sent',
      'approved',
      'rejected',
      'archived'
    );
  END IF;
END $$;

-- -----------------------------------------------------
-- 2. LAB RAW MATERIALS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  supplier text,
  unit text NOT NULL DEFAULT 'kg',
  cost_per_unit numeric(12,4) NOT NULL DEFAULT 0,
  density numeric(10,4),
  lead_time_days integer,
  safety_notes text,
  sds_url text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_raw_materials_supplier ON lab_raw_materials (supplier);
CREATE INDEX IF NOT EXISTS idx_lab_raw_materials_name ON lab_raw_materials USING gin (to_tsvector('simple', name));

-- -----------------------------------------------------
-- 3. LAB RECIPES
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  batch_size numeric(12,3) NOT NULL DEFAULT 100,
  unit text NOT NULL DEFAULT 'kg',
  target_cost numeric(14,4),
  yield_percentage numeric(5,2),
  notes text,
  instructions text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  last_review_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, version)
);

CREATE INDEX IF NOT EXISTS idx_lab_recipes_code ON lab_recipes (code);

-- -----------------------------------------------------
-- 4. RECIPE INGREDIENTS (PERCENTAGES + COST)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES lab_recipes(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES lab_raw_materials(id),
  percentage numeric(10,4) NOT NULL,
  quantity numeric(12,3),
  cost_share numeric(14,4),
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_recipe_ingredients_recipe ON lab_recipe_ingredients (recipe_id);

-- -----------------------------------------------------
-- 5. LAB SAMPLES (CUSTOM BATCHES)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES lab_recipes(id),
  customer_id uuid REFERENCES customers(id),
  project_name text NOT NULL,
  status lab_sample_status NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'normal',
  customization_notes text,
  customizations jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  requested_by uuid REFERENCES profiles(id),
  due_date date,
  produced_at timestamptz,
  shipped_at timestamptz,
  cost_override numeric(14,4),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_samples_recipe ON lab_samples (recipe_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_customer ON lab_samples (customer_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_status ON lab_samples (status);

-- -----------------------------------------------------
-- 6. COST VIEW FOR UI/PDF SHEETS
-- -----------------------------------------------------
CREATE OR REPLACE VIEW lab_recipe_costs_view AS
SELECT
  r.id AS recipe_id,
  r.code,
  r.name,
  r.version,
  r.batch_size,
  r.unit,
  r.target_cost,
  COALESCE(SUM(ing.percentage), 0)::numeric(10,4) AS total_percentage,
  COALESCE(SUM(ing.quantity), 0)::numeric(12,3) AS total_quantity,
  COALESCE(SUM(rm.cost_per_unit * COALESCE(ing.quantity, 0)), 0)::numeric(14,4) AS estimated_batch_cost,
  CASE 
    WHEN r.batch_size > 0 
      THEN (COALESCE(SUM(rm.cost_per_unit * COALESCE(ing.quantity, 0)), 0) / r.batch_size)::numeric(14,4)
    ELSE 0
  END AS estimated_unit_cost,
  COUNT(ing.id) AS ingredients_count,
  MAX(ing.updated_at) AS last_ingredient_update,
  r.updated_at AS recipe_updated_at
FROM lab_recipes r
LEFT JOIN lab_recipe_ingredients ing ON ing.recipe_id = r.id
LEFT JOIN lab_raw_materials rm ON rm.id = ing.raw_material_id
GROUP BY r.id;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

