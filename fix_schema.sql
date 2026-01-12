-- 1. Fix Profiles Table (Add missing columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id),
  teacher_id uuid REFERENCES public.profiles(id),
  time text,
  schedule_days text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id),
  group_id uuid REFERENCES public.groups(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies (Allow Authenticated Users to Access)
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subjects
CREATE POLICY "Enable all for authenticated users" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');

-- Groups
CREATE POLICY "Enable all for authenticated users" ON public.groups FOR ALL USING (auth.role() = 'authenticated');

-- Payments
CREATE POLICY "Enable all for authenticated users" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

-- Enrollments
CREATE POLICY "Enable all for authenticated users" ON public.enrollments FOR ALL USING (auth.role() = 'authenticated');
