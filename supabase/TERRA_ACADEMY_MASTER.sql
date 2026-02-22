-- ============================================================
--  TERRA ACADEMY — MASTER DATABASE SCHEMA
--  Version: 3.0 (Unified)
--  Barcha SQL fayllar birlashtirilib, idempotent (xavfsiz qayta
--  ishga tushiriladigan) qilib yozildi.
--  Supabase SQL Editor'da to'liq nusxalab ishga tushiring.
-- ============================================================


-- ============================================================
-- SECTION 0: EXTENSIONS & TYPES
-- ============================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Payment status enum (faqat bir marta yaratiladi)
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 'paid', 'overdue', 'partially_paid', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment method enum
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash', 'card', 'transfer', 'online'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- SECTION 1: PROFILES TABLE
-- (auth.users bilan bog'langan asosiy foydalanuvchi jadvali)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    first_name  TEXT,
    last_name   TEXT,
    role        TEXT DEFAULT 'student'
                    CHECK (role IN ('owner', 'admin', 'teacher', 'student', 'parent')),
    status      TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'blocked')),
    phone           TEXT,
    birth_date      DATE,
    student_code    TEXT UNIQUE,
    monthly_fee     NUMERIC DEFAULT 0,
    -- Payment tracking (updated by triggers)
    last_payment_date       TIMESTAMPTZ,
    next_payment_due_date   DATE,
    -- Onboarding
    is_first_login      BOOLEAN DEFAULT TRUE,
    login_username      TEXT UNIQUE,
    -- Timestamps
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3)
);

-- Ensure columns exist on pre-existing tables (idempotent migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_code       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_fee        NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_first_login     BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_username     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_payment_date  TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_payment_due_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

-- Normalize existing roles to lowercase
UPDATE public.profiles SET role = LOWER(role) WHERE role != LOWER(role);


-- ============================================================
-- SECTION 2: SUBJECTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    price       NUMERIC DEFAULT 0,   -- Oylik kurs narxi (so'm)
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add price column if missing
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;


-- ============================================================
-- SECTION 3: GROUPS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    teacher_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    schedule_days    TEXT[],  -- ['Mon', 'Wed', 'Fri']
    time            TEXT,     -- '09:00-11:00'
    price           NUMERIC DEFAULT 0,  -- Guruhga xos narx (overrides subject price)
    max_students    INT DEFAULT 20,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing groups table
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS price        NUMERIC DEFAULT 0;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 20;


-- ============================================================
-- SECTION 4: ENROLLMENTS TABLE
-- (O'quvchi-Guruh ko'p-ko'p munosabati)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, group_id)
);


-- ============================================================
-- SECTION 5: MONTHLY PAYMENTS TABLE
-- (Har bir o'quvchining oylik to'lov hisobi)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.monthly_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_month   DATE NOT NULL, -- Har doim oyning 1-kuni: '2026-02-01'
    amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount        NUMERIC(12, 2) DEFAULT 0,
    -- final_amount = amount - discount (bazada hisoblanadi)
    final_amount    NUMERIC(12, 2) GENERATED ALWAYS AS (amount - COALESCE(discount, 0)) STORED,
    paid_amount     NUMERIC(12, 2) DEFAULT 0,
    status          TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'cancelled')),
    due_date        DATE,
    paid_date       TIMESTAMPTZ,
    notes           TEXT,
    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES public.profiles(id),
    UNIQUE(student_id, payment_month),
    -- Har doim oyning 1-kuni bo'lishi shart
    CONSTRAINT valid_payment_month CHECK (EXTRACT(DAY FROM payment_month) = 1)
);

-- Add missing columns to existing monthly_payments table
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS discount      NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS notes         TEXT;
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS created_by    UUID REFERENCES public.profiles(id);

-- Status constraint ni yangilash (partially_paid qo'shish)
ALTER TABLE public.monthly_payments DROP CONSTRAINT IF EXISTS monthly_payments_status_check;
ALTER TABLE public.monthly_payments ADD CONSTRAINT monthly_payments_status_check
    CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'cancelled'));


-- ============================================================
-- SECTION 6: PAYMENT TRANSACTIONS TABLE
-- (Har bir to'lov harakati — audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id  UUID NOT NULL REFERENCES public.monthly_payments(id) ON DELETE CASCADE,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    method      TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'online')),
    note        TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SECTION 7: PAYMENT AUDIT LOGS
-- (Barcha to'lov o'zgarishlarining to'liq tarixi)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    payment_id  UUID REFERENCES public.monthly_payments(id) ON DELETE CASCADE,
    changed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL, -- 'create', 'update', 'delete', 'auto'
    old_values  JSONB,
    new_values  JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SECTION 8: PARENT-STUDENT LINKS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_student (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);


-- ============================================================
-- SECTION 9: ATTENDANCE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status      TEXT NOT NULL DEFAULT 'present'
                    CHECK (status IN ('present', 'absent', 'late')),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, group_id, date)
);


-- ============================================================
-- SECTION 10: GRADES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.grades (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    score       TEXT NOT NULL,
    grade_type  TEXT DEFAULT 'cefr'
                    CHECK (grade_type IN ('cefr', 'ielts', 'test', 'exam', 'quiz', 'homework', 'other')),
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Update grades constraint (if grades table already existed with old constraint)
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_grade_type_check;
ALTER TABLE public.grades ADD CONSTRAINT grades_grade_type_check
    CHECK (grade_type IN ('cefr', 'ielts', 'test', 'exam', 'quiz', 'homework', 'other'));
ALTER TABLE public.grades ALTER COLUMN grade_type SET DEFAULT 'cefr';


-- ============================================================
-- SECTION 11: SMS LOGS TABLE (opsional)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sms_logs (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    phone       TEXT,
    message     TEXT,
    status      TEXT CHECK (status IN ('sent', 'failed', 'pending')),
    provider    TEXT,        -- 'eskiz', 'playmobile'
    trigger_event TEXT,      -- 'reminder', 'overdue', 'paid'
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS trigger_event TEXT;


-- ============================================================
-- SECTION 12: INDEXES (Performance)
-- ============================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status     ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Subjects & Groups
CREATE INDEX IF NOT EXISTS idx_subjects_name       ON public.subjects(name);
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id   ON public.groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_subject_id   ON public.groups(subject_id);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_group_id   ON public.enrollments(group_id);

-- Monthly Payments
CREATE INDEX IF NOT EXISTS idx_monthly_payments_student_id    ON public.monthly_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_payment_month ON public.monthly_payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_status        ON public.monthly_payments(status);

-- Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_tx_payment_id  ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_created_at  ON public.payment_transactions(created_at DESC);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_group_date ON public.attendance(group_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student    ON public.attendance(student_id);

-- Grades
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_group   ON public.grades(group_id);
CREATE INDEX IF NOT EXISTS idx_grades_date    ON public.grades(date DESC);


-- ============================================================
-- SECTION 13: FUNCTIONS & TRIGGERS
-- ============================================================

-- 13.1: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    IF char_length(v_full_name) < 3 THEN
        v_full_name := NEW.email || ' User';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, status, is_first_login)
    VALUES (
        NEW.id,
        v_full_name,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        'pending',
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 13.2: Auto-sync paid_amount in monthly_payments when transactions change
CREATE OR REPLACE FUNCTION public.sync_payment_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_id UUID;
    v_paid       NUMERIC;
    v_total      NUMERIC;
    v_discount   NUMERIC;
    v_new_status TEXT;
BEGIN
    -- Qaysi payment_id ni yangilash kerakligini aniqlash
    IF TG_OP = 'DELETE' THEN
        v_payment_id := OLD.payment_id;
    ELSE
        v_payment_id := NEW.payment_id;
    END IF;

    -- Jami to'langan summani hisoblash
    SELECT COALESCE(SUM(pt.amount), 0)
    INTO v_paid
    FROM public.payment_transactions pt
    WHERE pt.payment_id = v_payment_id;

    -- Umumiy va chegirma summalarini olish
    SELECT amount, COALESCE(discount, 0)
    INTO v_total, v_discount
    FROM public.monthly_payments
    WHERE id = v_payment_id;

    -- Yangi statusni aniqlash
    v_new_status := CASE
        WHEN v_paid <= 0 THEN 'pending'
        WHEN v_paid >= (v_total - v_discount) THEN 'paid'
        ELSE 'partially_paid'
    END;

    -- monthly_payments ni yangilash
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

DROP TRIGGER IF EXISTS tr_sync_payment_amount ON public.payment_transactions;
CREATE TRIGGER tr_sync_payment_amount
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_payment_paid_amount();


-- 13.3: Overdue payments checker (cron yoki qo'lda chaqirish)
CREATE OR REPLACE FUNCTION public.mark_overdue_payments()
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.monthly_payments
    SET status     = 'overdue',
        updated_at = NOW()
    WHERE status IN ('pending', 'partially_paid')
      AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 13.4: Generate next month payment when current month is paid
CREATE OR REPLACE FUNCTION public.generate_next_month_payment(
    p_student_id   UUID,
    p_current_month DATE
) RETURNS VOID AS $$
DECLARE
    v_next_month DATE;
    v_fee        NUMERIC;
BEGIN
    v_next_month := date_trunc('month', p_current_month + INTERVAL '1 month');

    -- O'quvchining oylik to'lovini olish
    SELECT COALESCE(monthly_fee, 0) INTO v_fee
    FROM public.profiles
    WHERE id = p_student_id;

    IF v_fee > 0 THEN
        INSERT INTO public.monthly_payments (
            student_id, payment_month, amount, status, due_date
        ) VALUES (
            p_student_id,
            v_next_month,
            v_fee,
            'pending',
            v_next_month + INTERVAL '10 days'
        )
        ON CONFLICT (student_id, payment_month) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 13.5: Payment audit log trigger
CREATE OR REPLACE FUNCTION public.log_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.payment_audit_logs (payment_id, changed_by, action, new_values)
        VALUES (NEW.id, auth.uid(), 'create', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.payment_audit_logs (payment_id, changed_by, action, old_values, new_values)
        VALUES (NEW.id, auth.uid(), 'update', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.payment_audit_logs (payment_id, changed_by, action, old_values)
        VALUES (OLD.id, auth.uid(), 'delete', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_payment_audit ON public.monthly_payments;
CREATE TRIGGER tr_payment_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.monthly_payments
    FOR EACH ROW EXECUTE FUNCTION public.log_payment_changes();


-- 13.6: Initialize current month payments for all active students (bir marta ishga tushiring)
CREATE OR REPLACE FUNCTION public.init_monthly_payments_for_all()
RETURNS TEXT AS $$
DECLARE
    r          RECORD;
    v_count    INT := 0;
    v_month    DATE := date_trunc('month', CURRENT_DATE);
BEGIN
    FOR r IN
        SELECT id, COALESCE(monthly_fee, 0) AS fee
        FROM public.profiles
        WHERE role = 'student'
          AND status IN ('approved', 'active')
          AND COALESCE(monthly_fee, 0) > 0
    LOOP
        INSERT INTO public.monthly_payments (
            student_id, payment_month, amount, due_date, status
        ) VALUES (
            r.id, v_month, r.fee, v_month + INTERVAL '10 days', 'pending'
        )
        ON CONFLICT (student_id, payment_month) DO NOTHING;
        v_count := v_count + 1;
    END LOOP;

    RETURN 'OK: ' || v_count || ' payment records initialized for ' || v_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- SECTION 14: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ── MUHIM: Rekursiyani oldini olish uchun SECURITY DEFINER ──
-- Bu funksiyalar RLS ni aylab o'tadi (SECURITY DEFINER).
-- Barcha policylar shu funksiyalarni ishlatishi SHART.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'owner'
    );
$$;

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades               ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles: public read"   ON public.profiles;
DROP POLICY IF EXISTS "Profiles: self update"   ON public.profiles;
DROP POLICY IF EXISTS "Profiles: self insert"   ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin all"     ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can delete any profile" ON public.profiles;

-- SELECT: Hamma ko'ra oladi (rekursiya yo'q)
CREATE POLICY "Profiles: public read"
    ON public.profiles FOR SELECT USING (TRUE);

-- INSERT: Faqat o'zi uchun
CREATE POLICY "Profiles: self insert"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: O'zi yoki admin (SECURITY DEFINER funksiya)
CREATE POLICY "Profiles: update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- DELETE: Faqat owner
CREATE POLICY "Profiles: delete"
    ON public.profiles FOR DELETE
    USING (public.is_owner());

-- ── SUBJECTS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Subjects: read all"   ON public.subjects;
DROP POLICY IF EXISTS "Subjects: admin all"  ON public.subjects;

CREATE POLICY "Subjects: read all"
    ON public.subjects FOR SELECT USING (TRUE);

CREATE POLICY "Subjects: admin all"
    ON public.subjects FOR ALL
    USING (public.is_admin());

-- ── GROUPS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Groups: read all"   ON public.groups;
DROP POLICY IF EXISTS "Groups: admin all"  ON public.groups;

CREATE POLICY "Groups: read all"
    ON public.groups FOR SELECT USING (TRUE);

CREATE POLICY "Groups: admin all"
    ON public.groups FOR ALL
    USING (public.is_admin());

-- ── ENROLLMENTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Enrollments: student self"  ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: teacher view"  ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: admin all"     ON public.enrollments;

CREATE POLICY "Enrollments: student self"
    ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Enrollments: teacher view"
    ON public.enrollments FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_id AND groups.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Enrollments: admin all"
    ON public.enrollments FOR ALL
    USING (public.is_admin());

-- ── MONTHLY PAYMENTS ────────────────────────────────────────
DROP POLICY IF EXISTS "Monthly payments: student self"  ON public.monthly_payments;
DROP POLICY IF EXISTS "Monthly payments: parent view"   ON public.monthly_payments;
DROP POLICY IF EXISTS "Monthly payments: admin all"     ON public.monthly_payments;

CREATE POLICY "Monthly payments: student self"
    ON public.monthly_payments FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Monthly payments: parent view"
    ON public.monthly_payments FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.parent_student
            WHERE parent_student.parent_id = auth.uid()
              AND parent_student.student_id = monthly_payments.student_id
              AND parent_student.status = 'approved'
        )
    );

CREATE POLICY "Monthly payments: admin all"
    ON public.monthly_payments FOR ALL
    USING (public.is_admin());

-- ── PAYMENT TRANSACTIONS ────────────────────────────────────
DROP POLICY IF EXISTS "Transactions: student self"  ON public.payment_transactions;
DROP POLICY IF EXISTS "Transactions: parent view"   ON public.payment_transactions;
DROP POLICY IF EXISTS "Transactions: admin all"     ON public.payment_transactions;

CREATE POLICY "Transactions: student self"
    ON public.payment_transactions FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.monthly_payments mp
            WHERE mp.id = payment_id AND mp.student_id = auth.uid()
        )
    );

CREATE POLICY "Transactions: parent view"
    ON public.payment_transactions FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.monthly_payments mp
            JOIN public.parent_student ps ON ps.student_id = mp.student_id
            WHERE mp.id = payment_id
              AND ps.parent_id = auth.uid()
              AND ps.status = 'approved'
        )
    );

CREATE POLICY "Transactions: admin all"
    ON public.payment_transactions FOR ALL
    USING (public.is_admin());

-- ── ATTENDANCE ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Attendance: student self"   ON public.attendance;
DROP POLICY IF EXISTS "Attendance: teacher manage" ON public.attendance;
DROP POLICY IF EXISTS "Attendance: admin all"      ON public.attendance;

CREATE POLICY "Attendance: student self"
    ON public.attendance FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Attendance: teacher manage"
    ON public.attendance FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_id AND groups.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Attendance: admin all"
    ON public.attendance FOR ALL
    USING (public.is_admin());

-- ── GRADES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Grades: student self"   ON public.grades;
DROP POLICY IF EXISTS "Grades: teacher manage" ON public.grades;
DROP POLICY IF EXISTS "Grades: admin all"      ON public.grades;

CREATE POLICY "Grades: student self"
    ON public.grades FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Grades: teacher manage"
    ON public.grades FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_id AND groups.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Grades: admin all"
    ON public.grades FOR ALL
    USING (public.is_admin());

-- ── PARENT-STUDENT ──────────────────────────────────────────
DROP POLICY IF EXISTS "Parent-student: self"      ON public.parent_student;
DROP POLICY IF EXISTS "Parent-student: admin all" ON public.parent_student;

CREATE POLICY "Parent-student: self"
    ON public.parent_student FOR SELECT
    USING (parent_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Parent-student: admin all"
    ON public.parent_student FOR ALL
    USING (public.is_admin());

-- ── AUDIT LOGS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Audit logs: admin all" ON public.payment_audit_logs;

CREATE POLICY "Audit logs: admin all"
    ON public.payment_audit_logs FOR ALL
    USING (public.is_admin());


-- ============================================================
-- SECTION 15: ADMIN PROMOTION HELPER
-- O'quvchini admin qilish uchun (kerakli o'rinlarda ishlating)
-- ============================================================

-- Foydalanish: SELECT promote_to_admin('user-uuid-here');
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_id UUID, p_role TEXT DEFAULT 'admin')
RETURNS TEXT AS $$
BEGIN
    IF p_role NOT IN ('owner', 'admin') THEN
        RETURN 'ERROR: Faqat owner yoki admin rolini berish mumkin';
    END IF;

    UPDATE public.profiles
    SET role   = p_role,
        status = 'approved'
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN 'ERROR: Foydalanuvchi topilmadi: ' || p_user_id;
    END IF;

    RETURN 'OK: ' || p_user_id || ' foydalanuvchisi ' || p_role || ' qilindi';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Asosiy Owner: ixa@gmail.com ─────────────────────────────
-- Bu so'rov SQL ishga tushganda ixa@gmail.com ni owner qiladi
UPDATE public.profiles
SET role          = 'owner',
    status        = 'approved',
    is_first_login = FALSE
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'ixa@gmail.com'
);

-- Agar profil yo'q bo'lsa (birinchi marta), yaratib qo'yamiz
INSERT INTO public.profiles (id, full_name, role, status, is_first_login)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'full_name', 'Owner'),
    'owner',
    'approved',
    FALSE
FROM auth.users
WHERE email = 'ixa@gmail.com'
ON CONFLICT (id) DO UPDATE
    SET role          = 'owner',
        status        = 'approved',
        is_first_login = FALSE;


-- ============================================================
-- SECTION 16: FINAL VERIFICATION
-- Jadvallar mavjudligini tekshirish
-- ============================================================

DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'profiles', 'subjects', 'groups', 'enrollments',
        'monthly_payments', 'payment_transactions', 'payment_audit_logs',
        'parent_student', 'attendance', 'grades', 'sms_logs'
    ];
    t TEXT;
    v_exists BOOLEAN;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '✅  Table: % — OK', t;
        ELSE
            RAISE WARNING '❌  Table: % — MISSING!', t;
        END IF;
    END LOOP;
    RAISE NOTICE '=== TERRA ACADEMY DB VERIFICATION COMPLETE ===';
END $$;


-- ============================================================
-- SECTION 17: ACCOUNT ACTIVATION
-- "Hisobingiz hali faollashtrilmagan" xatosini hal qilish
-- Bu bo'limni faqat birinchi sozlashda yoki kerak bo'lganda
-- ishga tushiring.
-- ============================================================

-- 17.1: Barcha mavjud foydalanuvchilarni ko'rish
-- SELECT id, full_name, role, status FROM public.profiles ORDER BY created_at DESC;

-- 17.2: Barcha pending foydalanuvchilarni approved qilish
UPDATE public.profiles
SET status = 'approved'
WHERE status = 'pending';

-- 17.3: Agar profiles jadvalida satrlar yo'q bo'lsa —
-- auth.users dan profillarni qayta yaratish (trigger o'rniga)
INSERT INTO public.profiles (id, full_name, role, status, is_first_login)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
    COALESCE(u.raw_user_meta_data->>'role', 'owner'),
    'approved',
    FALSE
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE
    SET status = 'approved';

-- 17.4: Birinchi foydalanuvchini (siz) owner va approved qilish
-- (Email bo'yicha — o'z emailingizni kiriting)
-- UPDATE public.profiles
-- SET role = 'owner', status = 'approved', is_first_login = FALSE
-- WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- 17.5: Natijani tekshirish
SELECT role, status, COUNT(*) AS count
FROM public.profiles
GROUP BY role, status
ORDER BY role, status;


-- ============================================================
-- SECTION 18: LEGACY PAYMENTS TABLE
-- (Eski to'lov tizimi — ba'zi sahifalar hali ishlatadi)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount      NUMERIC(12, 2) NOT NULL,
    type        TEXT DEFAULT 'tuition',
    status      TEXT DEFAULT 'pending',
    date        TIMESTAMPTZ DEFAULT NOW(),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add type column if missing on existing payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'tuition';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments: admin all" ON public.payments;
CREATE POLICY "Payments: admin all"
    ON public.payments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

DROP POLICY IF EXISTS "Payments: student self" ON public.payments;
CREATE POLICY "Payments: student self"
    ON public.payments FOR SELECT USING (student_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);


-- ============================================================
-- SECTION 19: PARENT_STUDENTS TABLE (alias / compatibility)
-- (Ba'zi eski kodlar parent_students nomini ishlatadi)
-- parent_student jadvali allaqachon §8 da yaratilgan.
-- Bu alias view eski kodni buzmaslik uchun.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parent_students (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parent_students: admin all" ON public.parent_students;
CREATE POLICY "Parent_students: admin all"
    ON public.parent_students FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

DROP POLICY IF EXISTS "Parent_students: self" ON public.parent_students;
CREATE POLICY "Parent_students: self"
    ON public.parent_students FOR SELECT
    USING (parent_id = auth.uid() OR student_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_parent_students_parent_id  ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON public.parent_students(student_id);


-- ============================================================
-- SECTION 20: EXAMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    group_id    UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    teacher_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date        DATE NOT NULL,
    time        TIME,
    duration    INT DEFAULT 60,    -- daqiqada
    room        TEXT,
    type        TEXT DEFAULT 'Exam'
                    CHECK (type IN ('Exam', 'Test', 'Quiz', 'Final', 'Midterm')),
    status      TEXT DEFAULT 'Upcoming'
                    CHECK (status IN ('Upcoming', 'Completed', 'Draft', 'Cancelled')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exams: public view"    ON public.exams;
DROP POLICY IF EXISTS "Exams: teacher manage" ON public.exams;
DROP POLICY IF EXISTS "Exams: admin all"      ON public.exams;

CREATE POLICY "Exams: public view"
    ON public.exams FOR SELECT USING (TRUE);

CREATE POLICY "Exams: teacher manage"
    ON public.exams FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Exams: admin all"
    ON public.exams FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));

CREATE INDEX IF NOT EXISTS idx_exams_group_id   ON public.exams(group_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_date       ON public.exams(date);


-- ============================================================
-- SECTION 21: APPLICATIONS TABLE
-- (Ro'yxatdan o'tish so'rovlari)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.applications (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent')),
    full_name   TEXT NOT NULL,
    first_name  TEXT,
    last_name   TEXT,
    email       TEXT,
    phone       TEXT,
    birth_date  DATE,
    student_code TEXT,
    status      TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applications: self insert" ON public.applications;
DROP POLICY IF EXISTS "Applications: self view"   ON public.applications;
DROP POLICY IF EXISTS "Applications: admin all"   ON public.applications;

CREATE POLICY "Applications: self insert"
    ON public.applications FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Applications: self view"
    ON public.applications FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Applications: admin all"
    ON public.applications FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    ));


-- ============================================================
-- SECTION 22: EXTRA INDEXES (Global Search + Performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_full_name         ON public.profiles USING btree (full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone             ON public.profiles USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at   ON public.profiles(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_name                ON public.groups USING btree (name);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at        ON public.subjects(created_at DESC);


-- ============================================================
-- SECTION 23: STUDENT CODE GENERATOR
-- O'quvchi kodlarini (STU-XXXXXX) avtomatik berish
-- ============================================================

-- Student kodi generator funksiyasi
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TEXT AS $$
DECLARE
    chars  TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'STU-';
    i      INT;
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        result := 'STU-';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
        END LOOP;

        -- Takrorlanmasligini tekshirish
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE student_code = result
        ) INTO v_exists;

        EXIT WHEN NOT v_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Barcha o'quvchilar uchun kod berish (kodi yo'qlar uchun)
UPDATE public.profiles
SET student_code = public.generate_student_code()
WHERE role = 'student'
  AND (student_code IS NULL OR student_code = '');


-- ============================================================
-- SECTION 24: GROUPS TIME COLUMN FIX
-- ============================================================

-- groups.time ustunini text tipiga o'zgartirish
-- (HH:MM - HH:MM formatida saqlash uchun)
ALTER TABLE public.groups ALTER COLUMN time TYPE text USING time::text;


-- ============================================================
-- FINAL: Owner RLS (profiles update/delete uchun)
-- ============================================================

DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
CREATE POLICY "Owners can update any profile"
    ON public.profiles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'owner'
    ));

DROP POLICY IF EXISTS "Owners can delete any profile" ON public.profiles;
CREATE POLICY "Owners can delete any profile"
    ON public.profiles FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'owner'
    ));

-- ============================================================
-- DONE. Terra Academy Master Schema — To'liq va Tayyor.
-- ============================================================
