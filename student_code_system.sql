-- Add student_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_code text UNIQUE;

-- Create parent_student table
CREATE TABLE IF NOT EXISTS public.parent_student (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

-- Policies for parent_student
-- 1. Admins (owners) can do everything
CREATE POLICY "Owners can manage parent_student links" ON public.parent_student
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- 2. Parents can insert links for themselves
CREATE POLICY "Parents can insert their own links" ON public.parent_student
FOR INSERT WITH CHECK (
  auth.uid() = parent_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'parent'
  )
);

-- 3. Parents can view their own links
CREATE POLICY "Parents can view their own links" ON public.parent_student
FOR SELECT USING (
  auth.uid() = parent_id
);

-- 4. Students can view their own links
CREATE POLICY "Students can view their own links" ON public.parent_student
FOR SELECT USING (
  auth.uid() = student_id
);
