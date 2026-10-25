# Software Requirements Specification (SRS) - Bilunex Version 1

## 1. Introduction

### 1.1 Purpose

Bilunex is a holistic support platform providing integrated academic tutoring, 1-on-1 mentorship, and empathetic youth counseling. This document defines the functional and non-functional requirements for Version 1.

### 1.2 Target Audience & Stakeholders

- **Elementary to College Students**: Beneficiaries of tutoring, mentorship, and counseling.
- **Parents & Guardians**: Individuals seeking structured academic and developmental assistance for their children.
- **Mentors & Tutors**: Educators and role models guiding students and filing session reports.
- **Program Administrators**: Staff overseeing mentor onboarding, parent intake, and safeguarding compliance.

---

## 2. User Roles & Personas

| Role                  | Description                                                         | Access Level                                          |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| **Public Visitor**    | Prospective parent, student, or applicant browsing the public site. | Public pages (`client/public/*`)                      |
| **Parent / Guardian** | Submits intake requests for tutoring, mentoring, or counseling.     | Public intake form, email updates                     |
| **Mentor / Tutor**    | Approved practitioner providing support sessions.                   | Mentor Portal (`client/mentor/*`), `/api/v1/mentor/*` |
| **Administrator**     | Superuser overseeing applications, reports, and system metrics.     | Admin Portal (`client/admin/*`), `/api/v1/admin/*`    |

---

## 3. Functional Requirements

### 3.1 Public Portal

- **FR-PUB-01 (Home & Information)**: Deliver mobile-first information describing tutoring, mentoring, and counseling programs.
- **FR-PUB-02 (Parent Registration)**: Capture parent contact details, student grade level, support categories, and custom notes.
- **FR-PUB-03 (Mentor Application)**: Capture applicant professional background, subjects of expertise, years of experience, and statement of intent.
- **FR-PUB-04 (Contact Inquiries)**: Allow general visitors to send messages to the administrative team.

### 3.2 Mentor Portal

- **FR-MEN-01 (Authentication)**: Dedicated secure login for verified mentors using email and password.
- **FR-MEN-02 (Caseload View)**: View active assigned students and credentials.
- **FR-MEN-03 (Student Support Report Submission)**: File structured session summaries capturing session focus, progress rating (1-5), behavioral observations, and action items.
- **FR-MEN-04 (Data Isolation)**: Mentors must strictly access only their own data and filed reports.

### 3.3 Admin Portal

- **FR-ADM-01 (Protected Authentication)**: Dedicated admin login route never exposed in public navigation menus.
- **FR-ADM-02 (Dashboard Metrics)**: View real-time counts of parent registrations, pending mentor applications, active mentors, and filed reports.
- **FR-ADM-03 (Application Review)**: Inspect mentor applications and approve or reject candidates.
- **FR-ADM-04 (Mentor Roster)**: Inspect approved active mentors and assignment status.

### 3.4 Notification Service

- **FR-NOT-01 (Non-Blocking Dispatch)**: Email notifications must run asynchronously and never throw exceptions or block database transactions on delivery failure.
- **FR-NOT-02 (Intake Notifications)**: Notify admins and parents immediately upon student registration.
- **FR-NOT-03 (Application Alerts)**: Notify admins upon new mentor application submissions.

---

## 4. Non-Functional Requirements

- **Security**: Passwords hashed with bcrypt (salt factor 10). Role-based JSON Web Tokens (JWT) for authentication. SQL parameterization for 100% of queries.
- **Resilience**: Fail-fast environment variable validation at startup with Zod. Centralized error handling hiding internal stack traces in production.
- **Performance & Rate Limiting**: Stricter rate limits on authentication and registration endpoints to prevent brute-force and spam.
- **Maintainability**: Clear layered separation of concerns (`route -> middleware -> controller -> service -> repository -> database`).
