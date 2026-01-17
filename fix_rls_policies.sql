-- Supabase SQL Editor asosida kiriting
-- Bu so'rovlar 'owner' rolidagi foydalanuvchilarga profillarni tahrirlash huquqini beradi

-- 1. Avval mavjud update polisasini to'ldiramiz yoki yangisini qo'shamiz
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
CREATE POLICY "Owners can update any profile" ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- 2. Delete qilish huquqini ham beramiz (ixtiyoriy)
DROP POLICY IF EXISTS "Owners can delete any profile" ON public.profiles;
CREATE POLICY "Owners can delete any profile" ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- 3. Select huquqini ham tekshirib qo'yamiz (odatda true bo'ladi)
-- Agar barcha profillarni ko'rishda muammo bo'lsa buni ham ishlating:
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
