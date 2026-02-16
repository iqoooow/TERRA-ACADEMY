-- Create Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time Time NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    room TEXT,
    type TEXT DEFAULT 'Exam', -- 'Exam', 'Test', 'Quiz', 'Final', 'Midterm'
    status TEXT DEFAULT 'Upcoming', -- 'Upcoming', 'Completed', 'Draft'
    teacher_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Policies for Exams
CREATE POLICY "Public exams are viewable by everyone" ON public.exams
    FOR SELECT USING (true);

CREATE POLICY "Teachers can insert exams" ON public.exams
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own exams" ON public.exams
    FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own exams" ON public.exams
    FOR DELETE USING (auth.uid() = teacher_id);

-- Admins also full access
CREATE POLICY "Admins full access to exams" ON public.exams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );
