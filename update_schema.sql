-- Create applications table for registration requests
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent')),
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    student_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policies for applications (drop first to make idempotent)
DROP POLICY IF EXISTS "Users can insert their own application" ON public.applications;
CREATE POLICY "Users can insert their own application"
ON public.applications FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own application" ON public.applications;
CREATE POLICY "Users can view their own application"
ON public.applications FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
CREATE POLICY "Admins can view all applications"
ON public.applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications"
ON public.applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
);

-- Indexes for Global Search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles USING btree (full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups USING btree (name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);

-- ============================================
-- Parent-Student Link Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can insert their own links" ON public.parent_student;
CREATE POLICY "Parents can insert their own links"
ON public.parent_student FOR INSERT
WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Users can view their own links" ON public.parent_student;
CREATE POLICY "Users can view their own links"
ON public.parent_student FOR SELECT
USING (auth.uid() = parent_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all links" ON public.parent_student;
CREATE POLICY "Admins can manage all links"
ON public.parent_student FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
);
