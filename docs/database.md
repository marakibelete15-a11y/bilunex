# Bilunex Database Architecture & Schema Specification

## 1. Overview

Bilunex utilizes a local PostgreSQL relational database. All queries are strictly parameterized and encapsulated inside repositories (`server/src/repositories/`). Neither controllers nor services execute raw SQL statements directly.

---

## 2. Entity-Relationship Diagram (ERD)

```text
+-----------------------+           +-----------------------+
|         users         | 1       1 |        mentors        |
+-----------------------+-----------+-----------------------+
| id (PK)               |<----------| id (PK)               |
| email (UNIQUE)        |           | user_id (FK -> users) |
| password_hash         |           | phone                 |
| name                  |           | expertise             |
| role ('admin'|'mentor')           | years_experience      |
| created_at            |           | bio                   |
| updated_at            |           | status ('active'|...) |
+-----------------------+           +-----------------------+
                                                | 1
                                                |
                                                | *
                                    +------------------------------+
                                    |   student_support_reports    |
                                    +------------------------------+
                                    | id (PK)                      |
                                    | mentor_id (FK -> mentors)    |
                                    | student_name                 |
                                    | session_date                 |
                                    | duration_minutes             |
                                    | session_focus                |
                                    | observations                 |
                                    | action_items                 |
                                    | progress_rating (1-5)        |
                                    | created_at                   |
                                    +------------------------------+

+------------------------------+    +------------------------------+
|     parent_registrations     |    |     mentor_applications      |
+------------------------------+    +------------------------------+
| id (PK)                      |    | id (PK)                      |
| parent_name                  |    | full_name                    |
| email                        |    | email                        |
| phone                        |    | phone                        |
| student_name                 |    | expertise                    |
| student_grade                |    | years_experience             |
| support_type                 |    | bio                          |
| notes                        |    | status ('pending'|'approved')|
| status ('new'|'enrolled'...) |    | created_at                   |
| created_at                   |    | updated_at                   |
+------------------------------+    +------------------------------+
```

---

## 3. Table Specifications

### 3.1 `users`

Stores credentials and identities for system administrators and mentors.

- `id` (SERIAL, PRIMARY KEY)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL) - Bcrypt hash
- `role` (VARCHAR(50), NOT NULL) - `'admin'` or `'mentor'`
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### 3.2 `mentors`

Extends `users` with mentor qualifications and status.

- `id` (SERIAL, PRIMARY KEY)
- `user_id` (INTEGER, UNIQUE, FK -> `users.id` ON DELETE CASCADE)
- `phone` (VARCHAR(50))
- `expertise` (TEXT, NOT NULL)
- `years_experience` (INTEGER, DEFAULT 0)
- `bio` (TEXT)
- `status` (VARCHAR(50), DEFAULT 'active') - `'active'`, `'inactive'`
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### 3.3 `parent_registrations`

Stores student intake requests submitted by parents.

- `id` (SERIAL, PRIMARY KEY)
- `parent_name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `phone` (VARCHAR(50), NOT NULL)
- `student_name` (VARCHAR(255), NOT NULL)
- `student_grade` (VARCHAR(100), NOT NULL)
- `support_type` (VARCHAR(50), NOT NULL) - `'tutoring'`, `'mentoring'`, `'counseling'`, `'combined'`
- `notes` (TEXT)
- `status` (VARCHAR(50), DEFAULT 'new') - `'new'`, `'contacted'`, `'enrolled'`, `'archived'`
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### 3.4 `mentor_applications`

Stores public applications submitted by candidate mentors.

- `id` (SERIAL, PRIMARY KEY)
- `full_name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `phone` (VARCHAR(50), NOT NULL)
- `expertise` (TEXT, NOT NULL)
- `years_experience` (INTEGER, DEFAULT 0)
- `bio` (TEXT, NOT NULL)
- `status` (VARCHAR(50), DEFAULT 'pending') - `'pending'`, `'approved'`, `'rejected'`
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### 3.5 `student_support_reports`

Confidential session reports filed by mentors following tutoring or counseling sessions.

- `id` (SERIAL, PRIMARY KEY)
- `mentor_id` (INTEGER, NOT NULL, FK -> `mentors.id` ON DELETE CASCADE)
- `student_name` (VARCHAR(255), NOT NULL)
- `session_date` (DATE, NOT NULL)
- `duration_minutes` (INTEGER, NOT NULL)
- `session_focus` (VARCHAR(255), NOT NULL)
- `observations` (TEXT, NOT NULL)
- `action_items` (TEXT)
- `progress_rating` (INTEGER, NOT NULL, CHECK BETWEEN 1 AND 5)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

---

## 4. Indexing Strategy

- `idx_users_email` on `users(email)`: Rapid authentication lookup.
- `idx_mentors_user_id` on `mentors(user_id)`: Quick join from JWT user ID.
- `idx_reports_mentor_id` on `student_support_reports(mentor_id)`: Enforces mentor query isolation.
- `idx_parent_reg_created` on `parent_registrations(created_at DESC)`: Admin chronological feed.
- `idx_mentor_app_status` on `mentor_applications(status)`: Filters for pending candidates.
