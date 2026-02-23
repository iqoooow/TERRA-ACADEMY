-- ============================================================
--  TERRA ACADEMY — SCHEMA PATCH 02 (Metadata & Sync Fix)
--  Fixes: Missing columns, Enum migration, and updated_at error
-- ============================================================

-- 1. Ensure Metadata columns exists for all relevant tables
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. payment_transactions: method (Enum -> Text)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' AND column_name = 'method' AND data_type != 'text'
    ) THEN
        ALTER TABLE public.payment_transactions ADD COLUMN method_new TEXT;
        UPDATE public.payment_transactions SET method_new = method::text;
        ALTER TABLE public.payment_transactions DROP COLUMN method CASCADE;
        ALTER TABLE public.payment_transactions RENAME COLUMN method_new TO method;
        ALTER TABLE public.payment_transactions ALTER COLUMN method SET DEFAULT 'cash';
        ALTER TABLE public.payment_transactions ALTER COLUMN method SET NOT NULL;
        ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_method_check 
            CHECK (method IN ('cash', 'card', 'transfer', 'online'));
    END IF;
END $$;

-- 3. monthly_payments: status (Enum -> Text)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'monthly_payments' AND column_name = 'status' AND data_type != 'text'
    ) THEN
        ALTER TABLE public.monthly_payments ADD COLUMN status_new TEXT;
        UPDATE public.monthly_payments SET status_new = status::text;
        ALTER TABLE public.monthly_payments DROP COLUMN status CASCADE;
        ALTER TABLE public.monthly_payments RENAME COLUMN status_new TO status;
        ALTER TABLE public.monthly_payments ALTER COLUMN status SET DEFAULT 'pending';
        ALTER TABLE public.monthly_payments ADD CONSTRAINT monthly_payments_status_check 
            CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'unpaid', 'cancelled'));
    END IF;
END $$;

-- 4. monthly_payments: payment_year va payment_month migration
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS payment_year INTEGER;

DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'monthly_payments' AND column_name = 'payment_month' AND data_type = 'date'
    ) THEN
        UPDATE public.monthly_payments SET payment_year = EXTRACT(YEAR FROM payment_month) WHERE payment_year IS NULL;
        ALTER TABLE public.monthly_payments ADD COLUMN payment_month_new INTEGER;
        UPDATE public.monthly_payments SET payment_month_new = EXTRACT(MONTH FROM payment_month)::INTEGER;
        ALTER TABLE public.monthly_payments DROP COLUMN payment_month CASCADE;
        ALTER TABLE public.monthly_payments RENAME COLUMN payment_month_new TO payment_month;
        ALTER TABLE public.monthly_payments ALTER COLUMN payment_month SET NOT NULL;
    END IF;
END $$;

-- 5. RE-CREATE SYNC TRIGGER (In case CASCADE dropped it)
CREATE OR REPLACE FUNCTION public.sync_payment_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_id UUID;
    v_paid       NUMERIC;
    v_total      NUMERIC;
    v_discount   NUMERIC;
    v_new_status TEXT;
BEGIN
    v_payment_id := COALESCE(NEW.payment_id, OLD.payment_id);

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.payment_transactions
    WHERE payment_id = v_payment_id;

    SELECT amount, COALESCE(discount, 0) INTO v_total, v_discount
    FROM public.monthly_payments
    WHERE id = v_payment_id;

    v_new_status := CASE
        WHEN v_paid <= 0 THEN 'pending'
        WHEN v_paid >= (v_total - v_discount) THEN 'paid'
        ELSE 'partially_paid'
    END;

    UPDATE public.monthly_payments
    SET
        paid_amount = v_paid,
        status      = v_new_status,
        paid_date   = CASE WHEN v_new_status = 'paid' AND paid_date IS NULL THEN NOW() ELSE paid_date END,
        updated_at  = NOW()
    WHERE id = v_payment_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_payment_paid_amount ON public.payment_transactions;
CREATE TRIGGER trg_sync_payment_paid_amount
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_payment_paid_amount();

-- 6. Unique Constraint
DO $$ 
DECLARE 
    constraint_name TEXT;
BEGIN 
    FOR constraint_name IN 
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'public.monthly_payments'::regclass AND contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE public.monthly_payments DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

ALTER TABLE public.monthly_payments 
    ADD CONSTRAINT monthly_payments_student_year_month_key UNIQUE (student_id, payment_year, payment_month);

-- 7. Reload cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ PATCH 02 (Metadata Fix) applied successfully.' as status;
