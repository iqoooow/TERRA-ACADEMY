-- ============================================================
--  TERRA ACADEMY — SCHEMA PATCH 03
--  Yetishmayotgan ustunlarni qo'shish:
--    1. profiles: address, bio, subject_specialty, experience_years
--    2. groups: room
--    3. monthly_payments: group_id (moliya bo'limi uchun)
--  Idempotent: xavfsiz tarzda qayta ishga tushirish mumkin
-- ============================================================


-- ============================================================
-- 1. profiles: yetishmayotgan ustunlar
--    ProfileSettings.jsx bu ustunlarni ishlatadi.
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject_specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years  INTEGER;


-- ============================================================
-- 2. groups: xona (room) ustuni
--    TeacherDashboard.jsx jadval ko'rsatishda ishlatadi.
-- ============================================================
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS room TEXT;


-- ============================================================
-- 3. monthly_payments: group_id ustuni
--    FinancialCenter.jsx har bir fan bo'yicha alohida to'lov
--    yaratishi va ko'rsatishi uchun zarur.
--    UNIQUE constraint: bir o'quvchi, bir guruh, bir oy — bitta yozuv.
-- ============================================================
ALTER TABLE public.monthly_payments
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Eski unique constraint (student_id, payment_year, payment_month) ni o'chirish
-- (bir o'quvchi bir oyda bir nechta guruh uchun to'lov qila olsin)
ALTER TABLE public.monthly_payments
    DROP CONSTRAINT IF EXISTS monthly_payments_student_year_month_key;

-- Yangi unique constraint qo'shish: student + group + year + month
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'monthly_payments_student_group_year_month_key'
          AND conrelid = 'public.monthly_payments'::regclass
    ) THEN
        ALTER TABLE public.monthly_payments
            ADD CONSTRAINT monthly_payments_student_group_year_month_key
            UNIQUE (student_id, group_id, payment_year, payment_month);
    END IF;
END $$;

-- ============================================================
-- 4. RLS: yangi ustunlar uchun qo'shimcha cheklov shart emas
--    (mavjud RLS siyosatlari jadval darajasida ishlaydi)
-- ============================================================

-- ============================================================
-- 5. Schema Cache qayta yuklash
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- Tasdiqlash
DO $$
BEGIN
    RAISE NOTICE '✅ PATCH 03 muvaffaqiyatli qo''llandi.';
    RAISE NOTICE '   + profiles: address, bio, subject_specialty, experience_years';
    RAISE NOTICE '   + groups: room';
    RAISE NOTICE '   + monthly_payments: group_id (FK → groups)';
    RAISE NOTICE '   + monthly_payments UNIQUE: (student_id, group_id, payment_year, payment_month)';
    RAISE NOTICE '   + PostgREST schema cache qayta yuklandi';
END $$;
