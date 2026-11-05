ALTER TABLE mentor_applications
  DROP COLUMN commitment_agreement_at,
  ALTER COLUMN commitment_agreement SET DEFAULT TRUE;
