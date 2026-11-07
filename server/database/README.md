# Bilunex Database Layer (PostgreSQL)

This directory contains the database migration scripts, seeds, and administration runners for Bilunex Website v1.0.

Migrations are organized as self-contained unified SQL files (`001` through `009`), each containing explicit `-- migrate:up` and `-- migrate:down` sections. This halves the total number of migration files while keeping UP logic and rollback logic together in one place.

---

## 1. How to Run Migrations

Run migrations from either the repository root or the `server/` directory:

- **Apply all pending migrations (UP)**:

  ```bash
  npm run migrate
  # or from server/:
  node database/migrate.js up
  ```

- **Roll back migrations (DOWN)**:
  ```bash
  npm run migrate:down
  # or from server/:
  node database/migrate.js down
  ```

---

## 2. How to Reset the Development Database

To completely roll back all migrations, re-apply them from scratch, and seed the initial super_admin account:

```bash
npm run db:reset
# or from server/:
node database/reset.js
```

---

## 3. Administrator Seeding

To seed or update the initial super administrator without putting plaintext passwords in SQL:

```bash
npm run seed
# or from server/:
node database/seeds/create-admin.js
```

The seeder reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `server/.env`, generates a bcrypt hash (cost factor 12), and upserts the super_admin into `admin_users`.

---

## 4. Schema Overview

### PostgreSQL Extensions

- `citext`: Case-insensitive text type for unique emails.
- `pgcrypto`: Cryptographic functions.

### Custom Enums (8)

1. `application_status`: `'application_received'`, `'under_review'`, `'interview_stage'`, `'accepted'`, `'rejected'`, `'onboarding'`
2. `admin_role`: `'admin'`, `'super_admin'`
3. `mentor_account_status`: `'active'`, `'suspended'`, `'deactivated'`
4. `registration_status`: `'new'`, `'contacted'`, `'matched'`, `'closed'`
5. `inquiry_type`: `'general'`, `'parent_support'`, `'mentor_application'`, `'counseling'`
6. `inquiry_status`: `'new'`, `'in_progress'`, `'resolved'`
7. `notification_type`: `'parent_confirmation'`, `'mentor_confirmation'`, `'admin_new_parent'`, `'admin_new_mentor'`
8. `notification_status`: `'sent'`, `'failed'`

### Core Tables (7)

1. **`admin_users`**: Internal Bilunex staff accounts with role-based access.
2. **`mentor_applications`**: Prospective university student mentor applications.
3. **`mentor_profiles`**: Screened, active mentor accounts (1:1 with accepted applications).
4. **`parent_registrations`**: Parent intake requests for academic support / tutoring.
5. **`inquiries`**: Contact form messages across all categories.
6. **`student_support_reports`**: Confidential reports filed by mentors regarding observed student needs.
7. **`notification_log`**: Non-blocking audit record of outbound system notifications.

---

## 5. Table-to-SRS Requirement Traceability

| Table                     | SRS v1.0 Requirement IDs                                                                     | Description                                                                               |
| :------------------------ | :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| `admin_users`             | **FR-5.1**, **NFR-2**, **NFR-3**                                                             | Internal admin authentication, role enforcement, and sensitive data access control.       |
| `mentor_applications`     | **FR-3.1**, **FR-3.2**, **FR-3.4**, **FR-3.5**, **FR-5.3**, **NFR-2**, **NFR-3**             | Public mentor intake, 6-stage screening pipeline, admin notes, reviewer tracking.         |
| `mentor_profiles`         | **FR-5.6**, **FR-7.1**, **FR-7.2**, **FR-7.3**, **FR-7.4**, **FR-7.5**, **NFR-2**, **NFR-3** | Screened mentor account activation, portal credentials, profile maintenance.              |
| `parent_registrations`    | **FR-2.1**, **FR-2.2**, **FR-2.3**, **FR-5.2**, **NFR-2**, **NFR-3**                         | Parent registration intake, student needs, contact validation (phone or Telegram).        |
| `inquiries`               | **FR-1.11**, **FR-1.12**, **FR-4.1**, **FR-5.4**, **NFR-2**, **NFR-3**                       | Public inquiry submissions categorized by topic (counseling, parent, mentor, general).    |
| `student_support_reports` | **FR-5.7**, **FR-6.1**, **FR-6.3**, **FR-8.1**, **FR-8.2**, **FR-8.3**, **NFR-2**, **NFR-3** | Confidential mentor-filed student observations; restricted to admin review.               |
| `notification_log`        | **FR-9.1**, **FR-9.2**, **FR-9.3**, **FR-9.4**, **FR-9.5**, **NFR-4**                        | Asynchronous notification delivery failure logging without blocking parent/mentor intake. |
