-- Fix: Add missing 'type' column to payments table
-- Run this SQL in Supabase SQL Editor if you get "Could not find the 'type' column" error

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS type text;

-- Optional: Set default value for existing rows
UPDATE public.payments 
SET type = 'tuition' 
WHERE type IS NULL;

