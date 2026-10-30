CREATE TABLE stories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
  display_style VARCHAR(20) NOT NULL CHECK (display_style IN ('first_name', 'initials', 'anonymous')),
  relationship VARCHAR(30) NOT NULL CHECK (relationship IN ('parent_guardian', 'student', 'mentor', 'other')),
  email VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(160) NOT NULL CHECK (length(trim(title)) > 0),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 50 AND 2000),
  consent_genuine BOOLEAN NOT NULL CHECK (consent_genuine = TRUE),
  consent_publish BOOLEAN NOT NULL CHECK (consent_publish = TRUE),
  consent_child_guardian BOOLEAN NOT NULL CHECK (consent_child_guardian = TRUE),
  consent_genuine_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consent_publish_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consent_child_guardian_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by BIGINT REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stories_status ON stories(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_stories_published ON stories(published_at DESC) WHERE status='approved' AND deleted_at IS NULL;
