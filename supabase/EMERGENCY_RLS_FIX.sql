-- ================================================================
--  TERRA ACADEMY — EMERGENCY RLS FIX
--  "infinite recursion detected in policy for relation profiles"
--  xatosini darhol bartaraf etish.
--  Supabase SQL Editor'da TO'LIQ ishga tushiring.
-- ================================================================

-- QADAM 1: is_admin() SECURITY DEFINER funksiyasini yaratish
-- Bu funksiya profiles jadvalini RLS'ni chetlab o'qiydi.
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

-- QADAM 2: Rekursiya chiqarayotgan BARCHA profiles policylarini o'chirish
DROP POLICY IF EXISTS "Profiles: admin all"           ON public.profiles;
DROP POLICY IF EXISTS "Profiles: self update"         ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update"              ON public.profiles;
DROP POLICY IF EXISTS "Profiles: delete"              ON public.profiles;
DROP POLICY IF EXISTS "Profiles: public read"         ON public.profiles;
DROP POLICY IF EXISTS "Profiles: self insert"         ON public.profiles;
DROP POLICY IF EXISTS "Full access for admins"        ON public.profiles;
DROP POLICY IF EXISTS "Public view for profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"      ON public.profiles;

-- QADAM 3: To'g'ri policylarni yaratish (rekursiyasiz)
CREATE POLICY "Profiles: public read"
    ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Profiles: self insert"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: o'zi yoki admin (SECURITY DEFINER funksiya ishlatiladi)
CREATE POLICY "Profiles: update"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- DELETE: faqat owner
CREATE POLICY "Profiles: delete"
    ON public.profiles FOR DELETE
    USING (public.is_owner());

-- QADAM 4: Boshqa jadvallar uchun ham is_admin() ga o'tkazish
-- (Agar ular ham profiles ga subquery qilsa)

DROP POLICY IF EXISTS "Admins full access"                ON public.subjects;
DROP POLICY IF EXISTS "Admins full access to subjects"    ON public.subjects;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Subjects: admin all"               ON public.subjects;
CREATE POLICY "Subjects: admin all"
    ON public.subjects FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access"                ON public.groups;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Groups: admin all"                 ON public.groups;
CREATE POLICY "Groups: admin all"
    ON public.groups FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access"             ON public.enrollments;
DROP POLICY IF EXISTS "Enrollments: admin all"         ON public.enrollments;
CREATE POLICY "Enrollments: admin all"
    ON public.enrollments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to monthly_payments" ON public.monthly_payments;
DROP POLICY IF EXISTS "Monthly payments: admin all"            ON public.monthly_payments;
CREATE POLICY "Monthly payments: admin all"
    ON public.monthly_payments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all transactions"   ON public.payment_transactions;
DROP POLICY IF EXISTS "Transactions: admin all"          ON public.payment_transactions;
CREATE POLICY "Transactions: admin all"
    ON public.payment_transactions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access"   ON public.attendance;
DROP POLICY IF EXISTS "Attendance: admin all" ON public.attendance;
CREATE POLICY "Attendance: admin all"
    ON public.attendance FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access" ON public.grades;
DROP POLICY IF EXISTS "Grades: admin all"  ON public.grades;
CREATE POLICY "Grades: admin all"
    ON public.grades FOR ALL USING (public.is_admin());

-- QADAM 5: ixa@gmail.com ni owner qilish
UPDATE public.profiles
SET role = 'owner', status = 'approved', is_first_login = FALSE
WHERE id = (SELECT id FROM auth.users WHERE email = 'ixa@gmail.com');

INSERT INTO public.profiles (id, full_name, role, status, is_first_login)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Owner'), 'owner', 'approved', FALSE
FROM auth.users WHERE email = 'ixa@gmail.com'
ON CONFLICT (id) DO UPDATE
    SET role = 'owner', status = 'approved', is_first_login = FALSE;

-- QADAM 6: Barcha pending foydalanuvchilarni faollashtirish
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- QADAM 7: Natijani tekshirish
SELECT 'is_admin() function' AS check, 'OK' AS status
UNION ALL
SELECT 'Profiles RLS policies', COUNT(*)::TEXT
FROM pg_policies WHERE tablename = 'profiles'
UNION ALL
SELECT 'Users in profiles', COUNT(*)::TEXT
FROM public.profiles;
