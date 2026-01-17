-- Function to generate a random STU- code
CREATE OR REPLACE FUNCTION generate_random_student_code() 
RETURNS text AS $$
DECLARE
    chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := 'STU-';
    i integer;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update profiles that are students and don't have a code
UPDATE public.profiles
SET student_code = generate_random_student_code()
WHERE role = 'student' AND (student_code IS NULL OR student_code = '');

-- Optional: If you want to ensure uniqueness during the update, 
-- you might need a more complex loop, but for small datasets, 
-- probability of collision for 6 chars is low. 
-- For production, adding a UNIQUE constraint is already handled in previous scripts.
