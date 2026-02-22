-- ============================================================
--  TERRA ACADEMY — SCHEMA PATCH 01
--  Tarif: Frontend kodi bilan mos kelmaydigan ustunlarni tuzatish
--  Idempotent: xavfsiz tarzda qayta ishga tushirish mumkin
--  Supabase SQL Editor'da ishga tushiring.
-- ============================================================


-- ============================================================
-- 1. parent_student: relationship_type ustun qo'shish
--    Frontend StudentProfile.jsx va ParentProfile.jsx bu ustunni
--    fetch qiladi, lekin avvalgi schemada mavjud emas edi.
-- ============================================================
ALTER TABLE public.parent_student
    ADD COLUMN IF NOT EXISTS relationship_type TEXT DEFAULT 'parent'
        CHECK (relationship_type IN ('parent', 'guardian', 'other'));


-- ============================================================
-- 2. grades: recorded_by FK indeksi (performance)
--    Frontend profiles!grades_recorded_by_fkey FK aliasini
--    ishlatadi — indeks so'rovlarni tezlashtiradi.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_grades_recorded_by ON public.grades(recorded_by);
CREATE INDEX IF NOT EXISTS idx_grades_student_id  ON public.grades(student_id);


-- ============================================================
-- 3. payment_transactions: indekslar (performance)
--    FinanceList.jsx payment_id orqali join qiladi.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payment_tx_created_at ON public.payment_transactions(created_at DESC);


-- ============================================================
-- 4. monthly_payments: ustunlarni majburiy qo'shish
--    FinanceList.jsx upsert: amount, paid_amount, paid_date fieldlarini
--    ishlatadi. Agar eski schema bo'lsa bu ustunlar yo'q bo'lishi mumkin.
-- ============================================================
ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS amount       NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS paid_amount  NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS paid_date    TIMESTAMPTZ;

ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS discount     NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS notes        TEXT;

ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS due_date     DATE;

-- ============================================================
-- 5. Schema Cache qayta yuklash (PostgREST)
--    "Could not find column in schema cache" xatosini tuzatadi.
--    Bu NOTIFY avtomatik yangilaydi — qo'shimcha harakat shart emas.
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- Tasdiqlash
DO $$
BEGIN
    RAISE NOTICE '✅ PATCH 01 muvaffaqiyatli qo''llandi.';
    RAISE NOTICE '   + parent_student.relationship_type ustun';
    RAISE NOTICE '   + grades, payment_transactions indekslari';
    RAISE NOTICE '   + monthly_payments: amount, paid_amount, paid_date, discount, notes, due_date';
    RAISE NOTICE '   + PostgREST schema cache qayta yuklandi';
END $$;
