-- Migration: 002_enums
-- Description: Define domain enumerations for roles, statuses, and inquiry types
-- SRS Requirements: FR-3.4, FR-3.5, FR-4.1, FR-5.1, FR-5.6, FR-7.1, FR-9.5

-- migrate:up
CREATE TYPE application_status AS ENUM (
  'application_received',
  'under_review',
  'interview_stage',
  'accepted',
  'rejected',
  'onboarding'
);

CREATE TYPE admin_role AS ENUM (
  'admin',
  'super_admin'
);

CREATE TYPE mentor_account_status AS ENUM (
  'active',
  'suspended',
  'deactivated'
);

CREATE TYPE registration_status AS ENUM (
  'new',
  'contacted',
  'matched',
  'closed'
);

CREATE TYPE inquiry_type AS ENUM (
  'general',
  'parent_support',
  'mentor_application',
  'counseling'
);

CREATE TYPE inquiry_status AS ENUM (
  'new',
  'in_progress',
  'resolved'
);

CREATE TYPE notification_type AS ENUM (
  'parent_confirmation',
  'mentor_confirmation',
  'admin_new_parent',
  'admin_new_mentor'
);

CREATE TYPE notification_status AS ENUM (
  'sent',
  'failed'
);

-- migrate:down
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS inquiry_status CASCADE;
DROP TYPE IF EXISTS inquiry_type CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS mentor_account_status CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
