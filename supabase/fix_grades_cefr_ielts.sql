-- Run this if grades table already exists and you need to add CEFR/IELTS types
alter table grades drop constraint if exists grades_grade_type_check;
alter table grades add constraint grades_grade_type_check
    check (grade_type in ('cefr', 'ielts', 'test', 'exam', 'quiz', 'homework', 'other'));
alter table grades alter column grade_type set default 'cefr';
