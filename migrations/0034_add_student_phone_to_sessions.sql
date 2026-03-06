-- Add student_phone column to hiing_sessions table
-- This stores the phone number where the teacher should call the student

ALTER TABLE hiing_sessions ADD COLUMN student_phone TEXT;
