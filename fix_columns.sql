-- Fix missing columns in profiles table
-- This resolves the 400 Bad Request error when fetching students/teachers

-- 1. Ensure first_name exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;

-- 2. Ensure last_name exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- 3. Ensure full_name exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 4. Ensure phone exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 5. Ensure others are present just in case
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';

-- 6. Re-apply RLS just to be safe
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
