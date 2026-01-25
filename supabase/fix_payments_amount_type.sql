-- Fix: payments.amount was smallint (max 32_767). Change to numeric for large sums (e.g. 5_000_000 so'm).
-- Run in Supabase SQL Editor.

ALTER TABLE public.payments
  ALTER COLUMN amount TYPE numeric(12, 2) USING amount::numeric(12, 2);
