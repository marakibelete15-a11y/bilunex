ALTER TABLE mentor_applications
  ALTER COLUMN commitment_agreement DROP DEFAULT,
  ADD COLUMN commitment_agreement_at TIMESTAMPTZ;
