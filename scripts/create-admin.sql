-- Yangi admin user yaratish (ixlos703@gmail.com)
-- Bu SQL-ni Supabase Dashboard → SQL Editor-da o'tkazing

-- 1. Auth-da yangi user yaratish
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  gen_random_uuid(),
  'ixlosrajabboyev96@gmail.com',
  crypt('ixlosbek123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE
)
RETURNING id;

-- 2. Profile-ga owner rolisin o'rnating (yuqoridagi INSERT dan user_id-ni ko'chiring)
-- ESLATMA: gen_random_uuid() bilan yaratilgan id-ni quyida ishlating
UPDATE public.profiles
SET role = 'owner', status = 'approved', is_first_login = FALSE
WHERE email = 'ixlosrajabboyev96@gmail.com';

-- Yoki agar profile yo'q bo'lsa, yangi profile yaratish:
INSERT INTO public.profiles (id, email, full_name, role, status, is_first_login)
SELECT id, email, 'Administrator', 'owner', 'approved', FALSE
FROM auth.users
WHERE email = 'ixlosrajabboyev96@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='owner', status='approved', is_first_login=FALSE;
