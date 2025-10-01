-- =====================================================
-- FIX USER_ROLE ENUM - Add Missing Values
-- PIXEL CRM - FARMAP v1.2.1
-- =====================================================
-- Run this BEFORE ENABLE_RLS_SECURITY.sql if you get:
-- ERROR: invalid input value for enum user_role
-- =====================================================
-- IMPORTANT: Run each ALTER TYPE separately and COMMIT 
-- before running the next one or using the values
-- =====================================================

-- Check current enum values first
SELECT 'Current user_role values:' as info, unnest(enum_range(NULL::user_role)) as value;

-- Add 'admin' if missing (should already exist, but check)
-- Run this, then COMMIT before continuing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
        RAISE NOTICE 'Added admin to user_role enum';
    ELSE
        RAISE NOTICE 'admin already exists in user_role enum';
    END IF;
END $$;

-- COMMIT HERE (in Supabase, each statement auto-commits)
-- Then run the next block:

-- Add 'commerciale' if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'commerciale' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'commerciale';
        RAISE NOTICE 'Added commerciale to user_role enum';
    ELSE
        RAISE NOTICE 'commerciale already exists in user_role enum';
    END IF;
END $$;

-- COMMIT HERE
-- Then run the next block:

-- Add 'lettore' if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'lettore' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'lettore';
        RAISE NOTICE 'Added lettore to user_role enum';
    ELSE
        RAISE NOTICE 'lettore already exists in user_role enum';
    END IF;
END $$;

-- COMMIT HERE
-- Then run the next block:

-- Add 'label_user' if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'label_user' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'label_user';
        RAISE NOTICE 'Added label_user to user_role enum';
    ELSE
        RAISE NOTICE 'label_user already exists in user_role enum';
    END IF;
END $$;

-- Verify all values are present
SELECT 'Final user_role values:' as info, unnest(enum_range(NULL::user_role)) as value;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. PostgreSQL doesn't allow removing enum values easily
-- 2. Enum values are added in order and cannot be reordered
-- 3. After adding values, you can proceed with ENABLE_RLS_SECURITY.sql
-- =====================================================

