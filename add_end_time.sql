-- Fix time column type and add end_time column to groups table
-- Option 1: Change time to text to store "HH:MM - HH:MM" format
ALTER TABLE groups ALTER COLUMN time TYPE text USING time::text;

-- OR Option 2 (recommended): Keep time column for start_time and add end_time
-- ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time time;

-- Run the command above in your Supabase SQL editor
