-- Add indexes to improve performance for sorting and filtering

-- 1. Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
-- Helper for sorting by created_at where role is student
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON public.profiles(role, created_at DESC);

-- 2. Index for subjects
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON public.subjects(created_at DESC);

-- 3. Index for other tables often queried (just in case)
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON public.groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_subject_id ON public.groups(subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_group_id ON public.enrollments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
