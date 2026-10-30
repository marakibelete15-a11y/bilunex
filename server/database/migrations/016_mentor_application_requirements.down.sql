ALTER TABLE mentor_applications DROP CONSTRAINT IF EXISTS mentor_applications_entrance_exam_result_check;
ALTER TABLE mentor_applications DROP CONSTRAINT IF EXISTS mentor_app_available_hours_check;
ALTER TABLE mentor_applications ALTER COLUMN available_hours TYPE VARCHAR(255) USING array_to_string(available_hours, ', ');
ALTER TABLE mentor_applications ALTER COLUMN available_hours DROP NOT NULL;
ALTER TABLE mentor_applications ALTER COLUMN available_hours DROP DEFAULT;
ALTER TABLE mentor_applications DROP COLUMN entrance_exam_stream;
ALTER TABLE mentor_applications RENAME COLUMN cgpa TO gpa;
