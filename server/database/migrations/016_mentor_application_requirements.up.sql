ALTER TABLE mentor_applications RENAME COLUMN gpa TO cgpa;
ALTER TABLE mentor_applications ADD COLUMN entrance_exam_stream VARCHAR(30) NOT NULL DEFAULT 'natural_science'
  CHECK (entrance_exam_stream IN ('natural_science', 'social_science'));
ALTER TABLE mentor_applications ALTER COLUMN available_hours TYPE TEXT[] USING CASE
  WHEN available_hours ILIKE '%morning%' THEN ARRAY['Morning']::TEXT[]
  WHEN available_hours ILIKE '%afternoon%' THEN ARRAY['Afternoon']::TEXT[]
  WHEN available_hours ILIKE '%evening%' OR available_hours ILIKE '%pm%' THEN ARRAY['Evening']::TEXT[]
  ELSE ARRAY['Morning']::TEXT[] END;
ALTER TABLE mentor_applications ALTER COLUMN available_hours SET DEFAULT ARRAY['Morning']::TEXT[];
ALTER TABLE mentor_applications ALTER COLUMN available_hours SET NOT NULL;
ALTER TABLE mentor_applications ADD CONSTRAINT mentor_app_available_hours_check
  CHECK (available_hours <@ ARRAY['Morning', 'Afternoon', 'Evening']::TEXT[] AND cardinality(available_hours) > 0);
ALTER TABLE mentor_applications DROP CONSTRAINT IF EXISTS mentor_applications_entrance_exam_result_check;
ALTER TABLE mentor_applications ADD CONSTRAINT mentor_applications_entrance_exam_result_check
  CHECK (entrance_exam_result IS NULL OR (entrance_exam_result >= 0 AND entrance_exam_result <= CASE WHEN entrance_exam_stream = 'social_science' THEN 600 ELSE 700 END));
