# Software Requirements Specification (SRS) - Bilunex Version 1.1

## 1. Introduction

### 1.1 Purpose

Bilunex is a holistic support platform providing integrated academic tutoring, 1-on-1 mentorship, and empathetic youth counseling. This document defines the functional and non-functional requirements for Version 1.1, incorporating expanded intake profiles, candidate verification documents, privacy controls, and resilient notification infrastructure.

### 1.2 Target Audience & Stakeholders

- **Elementary to College Students**: Beneficiaries of tutoring, mentorship, and counseling.
- **Parents & Guardians**: Individuals seeking structured academic and developmental assistance for their children.
- **Mentors & Tutors**: Educators and role models guiding students, undergoing academic screening, and filing session reports.
- **Program Administrators**: Staff overseeing mentor onboarding, parent intake, document verification, and safeguarding compliance.

---

## 2. User Roles & Personas

| Role                  | Description                                                         | Access Level                                          |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| **Public Visitor**    | Prospective parent, student, or applicant browsing the public site. | Public pages (`client/public/*`)                      |
| **Parent / Guardian** | Submits intake requests for tutoring, mentoring, or counseling.     | Public intake form, email confirmations               |
| **Mentor / Tutor**    | Approved practitioner providing support sessions.                   | Mentor Portal (`client/mentor/*`), `/api/v1/mentor/*` |
| **Administrator**     | Superuser overseeing applications, reports, documents, and audits.  | Admin Portal (`client/admin/*`), `/api/v1/admin/*`    |

---

## 3. Functional Requirements

### 3.1 Public Portal & Intake

- **FR-PUB-01 (Brand Identity)**: The platform is branded exclusively as **Bilunex** across user-facing pages and technical configurations.
- **FR-PUB-02 (Parent Registration)**:
  - Capture parent contact details: full name, email, primary Ethiopian phone (`+2519XXXXXXXX` or `09XXXXXXXX`), optional secondary Ethiopian phone, preferred title (Mr., Mrs., Ms, Dr., or custom text), and preferred communication methods (multi-select of `phone_call`, `telegram`, `whatsapp`).
  - Capture student details: child name, grade level, requested subjects, support category (`tutoring`, `mentoring`, `counseling`, `combined`), optional telegram handle, and custom notes.
  - Require HTTP 201 with returned unique record reference number `#<id>`.
  - Detect local dev server origin mismatch (e.g. VS Code Live Server on port 5500) and display a dismissible warning banner directing users to `http://localhost:5000`.
- **FR-PUB-03 (Mentor Application)**:
  - Capture full academic and mentoring profile: full name, email, Ethiopian phone, Telegram handle, university, campus, field of study, academic year, subjects of expertise, teaching experience flag, duration, and detailed experience notes.
  - Academic screening metrics: GPA (numeric 0.00 to 4.00), Ethiopian Higher Education Entrance Examination (EHEEE) score (0.0 to 700.0).
  - Scheduling & commitment: available days (array of days), available hours text, availability summary, motivation statement (min 10 characters), referral source, and mandatory commitment agreement (`true`).
- **FR-PUB-04 (Secure Document Uploads)**:
  - Candidate mentor applications accept optional multipart file uploads:
    - Academic Transcript: PDF format only, max 5 MB.
    - Identification Photo: JPG, JPEG, or PNG format, max 5 MB.
  - Verification: Enforce binary magic byte signatures on the backend; reject extension spoofing.
  - Storage: Persist files outside public web root at `server/storage/private/documents/` (directory permission `0700`, file permission `0600`) using randomized UUID filenames.
  - Database metadata: Record original filename, stored filename, mime type, and file size in `mentor_documents` table.
- **FR-PUB-05 (Contact Inquiries)**: Allow general visitors to send messages and counseling questions to the administrative team.

### 3.2 Mentor Portal

- **FR-MEN-01 (Authentication)**: Dedicated secure login for verified mentors using email and password.
- **FR-MEN-02 (Caseload View)**: View active assigned students, subjects, and schedule.
- **FR-MEN-03 (Student Support Report Submission)**: File structured session summaries capturing session focus, progress rating (1-5), behavioral observations, and action items.
- **FR-MEN-04 (Data Isolation)**: Mentors must strictly access only their own data and filed reports.

### 3.3 Admin Portal

- **FR-ADM-01 (Protected Authentication)**: Dedicated admin login route never exposed in public navigation menus.
- **FR-ADM-02 (Dashboard Metrics & Reports)**:
  - View real-time status counts of parent registrations, mentor applications, and inquiries.
  - Track `failed_notifications_last_7_days` in the operational summary to monitor email delivery health.
- **FR-ADM-03 (Application Review & Status Transitions)**: Inspect mentor applications and progress them through 6 allowed statuses: `application_received`, `under_review`, `interview_stage`, `accepted`, `rejected`, `onboarding`.
- **FR-ADM-04 (Mentor Activation Transaction)**: Atomically activate accepted applicants into `mentor_profiles` with initial credentials, moving application status to `onboarding`.
- **FR-ADM-05 (Secure Document Streaming & Auditing)**:
  - Authenticated administrators can stream and download candidate transcripts and ID photos via `GET /api/v1/admin/documents/:id/download`.
  - Every document download must generate an immutable audit log entry in `audit_log` recording administrator ID, IP, and target document.

### 3.4 Notification Service & Data Privacy

- **FR-NOT-01 (Non-Blocking Safe Dispatch)**: Email dispatch is completely non-blocking and safe; errors are logged and persisted to `notification_log`, but NEVER throw into the caller or abort intake storage.
- **FR-NOT-02 (Parent Confirmation Email)**:
  - Sent to parent upon registration.
  - Incorporates onboarding notice: `/* [To be confirmed by Bilunex] */` "our team will review your requirements and we will contact you within 24 hours to finalize the registration fee and schedule a Trial Session."
  - Includes reference ID `#<id>`.
- **FR-NOT-03 (Admin Parent Alert)**:
  - Dispatched to `ADMIN_NOTIFICATION_EMAIL` (supporting comma-separated addresses).
  - Short operational summary only: Reference ID, intake type, submission timestamp, and admin portal link.
  - **Privacy Guarantee**: Contains NO sensitive student notes, parent phone, email, or attachments.
- **FR-NOT-04 (Mentor Confirmation Email)**: Sent to applicant acknowledging application and transcript submission with 3-5 business day review timeframe.
- **FR-NOT-05 (Admin Mentor Alert)**: Short operational summary only with reference ID, timestamp, and admin link; NO candidate personal details or file attachments.
- **FR-NOT-06 (Development Ethereal Fallback)**: In development when SMTP credentials are unset, automatically auto-provision an Ethereal test account and log preview URLs to Winston logger.
- **FR-NOT-07 (Role & Failure Tracking)**: Record `recipient_role` (`parent`, `mentor`, `admin`) in `notification_log` on every attempt; track failure metrics for admin reporting.

---

## 4. Non-Functional Requirements

- **Security & Privacy**:
  - Passwords hashed with bcrypt (salt factor 10).
  - Role-based JSON Web Tokens (JWT) for authentication with token expiration.
  - SQL parameterization for 100% of queries; zero raw query string concatenation.
  - Uploaded transcripts and ID photos stored outside the web root with access restricted to authenticated administrators.
  - Document retention policy: Rejected applicant documents are purged within 30 days.
- **Resilience**: Fail-fast environment variable validation at startup with Zod. Centralized error handling hiding internal stack traces in production.
- **Performance & Rate Limiting**: Stricter rate limits on authentication and registration endpoints to prevent brute-force and spam. Rate limiter skipped in test environments.
- **Maintainability**: Clear layered separation of concerns (`route -> middleware -> controller -> service -> repository -> database`). All database migrations versioned sequentially.

---

## 5. Version History

- **v1.0 (2026-10-25)**: Initial release with core intake, mentor portal, admin reviews, and safe notifications.
- **v1.1 (2026-10-28)**: Reversion to Bilunex brand; added parent registration title, secondary phone, and communication preferences; added mentor academic GPA, EHEEE scores, campus, availability, and commitment agreement; added secure magic-byte document upload pipeline and audited admin streaming; added Ethereal fallback, multi-admin alerts, and notification role logging.
