-- ==============================================================================
-- Migration: 002_enums.up.sql
-- Creates domain enumerations for roles, statuses, and inquiry types.
-- ==============================================================================

-- 1. Administrative Roles
CREATE TYPE admin_role AS ENUM (
  'super_admin',
  'admin'
);

-- 2. Mentor Application Lifecycle Statuses (SRS 6-stage lifecycle)
CREATE TYPE mentor_application_status AS ENUM (
  'application_received',
  'under_review',
  'interview_stage',
  'accepted',
  'rejected',
  'onboarding'
);

-- 3. Mentor Account Statuses
CREATE TYPE mentor_account_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- 4. Parent Registration Intake Statuses
CREATE TYPE parent_registration_status AS ENUM (
  'new',
  'contacted',
  'enrolled',
  'archived'
);

-- 5. Inquiry Categories (SRS: general, parent_support, mentor_application, counseling)
CREATE TYPE inquiry_type AS ENUM (
  'general',
  'parent_support',
  'mentor_application',
  'counseling'
);

-- 6. Inquiry Processing Statuses
CREATE TYPE inquiry_status AS ENUM (
  'new',
  'in_progress',
  'resolved',
  'archived'
);

-- 7. Notification Delivery Status
CREATE TYPE notification_status AS ENUM (
  'success',
  'failure'
);
