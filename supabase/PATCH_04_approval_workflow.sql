-- ============================================================
-- PATCH 04: Approval workflow for grades and attendance
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add approval_status to grades table
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2. Add approval_status to attendance table
ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 3. Mark all existing records as approved (legacy data)
UPDATE public.grades SET approval_status = 'approved' WHERE approval_status IS NULL;
UPDATE public.attendance SET approval_status = 'approved' WHERE approval_status IS NULL;
