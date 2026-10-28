# Bilunex REST API Specification (Version 1)

Definitive technical specification for the Bilunex Express backend API.

- **Base URL**: `/api/v1`
- **Content Type**: `application/json`
- **Authentication**: Bearer Token in HTTP header: `Authorization: Bearer <jwt_token>`
- **Architecture**: `route -> middleware -> controller -> service -> repository -> database`. All SQL resides exclusively in repositories.

---

## 1. Response & Error Contract

All endpoints adhere to a standardized JSON envelope.

### 1.1 Success Response (`200 OK` / `201 Created`)

```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { ... }
}
```

### 1.2 Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Error`)

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 2. System Endpoints

### 2.1 Health Check

Verifies server liveness, uptime, and execution environment.

- **Method**: `GET`
- **Route**: `/api/v1/health`
- **Auth**: None
- **Response `200 OK`**:

```json
{
  "status": "healthy",
  "timestamp": "2026-10-25T07:00:00.000Z",
  "uptime": 128.45,
  "environment": "development"
}
```

---

## 3. Public Intake Endpoints (`/api/v1/public`)

Intake endpoints are publicly accessible without authentication and protected by strict IP rate limiting (15 requests per 15 minutes). All public input schemas are enforced strictly (`.strict()`) to reject unrecognized keys.

### 3.1 Parent / Student Intake Registration

Registers a student for tutoring, mentoring, or counseling support. Automatically dispatches a confirmation email to the parent and an alert email to administration. Email failures never block database storage.

- **Method**: `POST`
- **Route**: `/api/v1/public/parent-registrations` (alias: `/api/v1/public/parents/register`)
- **Rate Limit**: Stricter Limiter (15 reqs / 15 mins; skipped in test environments)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:

| Field                            | Type       | Required | Description                                                                               |
| -------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------------------- |
| `parent_name`                    | `string`   | Yes      | Parent or guardian full name (min 2 chars)                                                |
| `email`                          | `string`   | Yes      | Valid email address for notifications                                                     |
| `phone`                          | `string`   | Yes      | Primary Ethiopian phone: `^(\+2519\d{8}\|09\d{8})$`                                       |
| `secondary_phone`                | `string`   | No       | Optional secondary Ethiopian phone: `^(\+2519\d{8}\|09\d{8})$`                            |
| `preferred_title`                | `string`   | No       | Preferred title: `'Mr.'`, `'Mrs.'`, `'Ms'`, `'Dr.'`, or custom string (max 50 chars)      |
| `preferred_communication_method` | `string[]` | No       | Non-empty array of `'phone_call'`, `'telegram'`, `'whatsapp'` (default: `['phone_call']`) |
| `telegram_handle`                | `string`   | No       | Optional Telegram handle (e.g. `@username`)                                               |
| `child_name`                     | `string`   | Yes      | Child / student full name (min 2 chars)                                                   |
| `grade_level`                    | `string`   | Yes      | Grade level (e.g. "Grade 9", "Middle School")                                             |
| `subjects`                       | `string[]` | Yes      | Non-empty array of subjects (e.g. `["Mathematics", "Physics"]`)                           |
| `support_category`               | `string`   | Yes      | Enum: `'tutoring'`, `'mentoring'`, `'counseling'`, `'combined'` (default: `'combined'`)   |
| `notes`                          | `string`   | No       | Optional background details or specific student needs                                     |

The current parent-registration page maps the Google Form preferred-title checkbox group to this scalar field and requires at most one selected title. To preserve multi-select from Google Forms, change this field to a string array and store the values in a PostgreSQL `text[]` column.

```json
{
  "parent_name": "Abebe Bikila",
  "email": "abebe@example.com",
  "phone": "+251911223344",
  "secondary_phone": "0911556677",
  "preferred_title": "Mr.",
  "preferred_communication_method": ["phone_call", "telegram"],
  "telegram_handle": "@abebe_b",
  "child_name": "Dawit Abebe",
  "grade_level": "Grade 9",
  "subjects": ["Mathematics", "Physics"],
  "support_category": "tutoring",
  "notes": "Preparing for regional STEM competitions."
}
```

- **Response `201 Created`**:

```json
{
  "success": true,
  "message": "Parent registration received successfully. Our team will contact you soon.",
  "data": {
    "id": "1",
    "parent_name": "Abebe Bikila",
    "email": "abebe@example.com",
    "phone": "+251911223344",
    "secondary_phone": "0911556677",
    "preferred_title": "Mr.",
    "preferred_communication_method": ["phone_call", "telegram"],
    "telegram_handle": "@abebe_b",
    "child_name": "Dawit Abebe",
    "grade_level": "Grade 9",
    "subjects": ["Mathematics", "Physics"],
    "support_category": "tutoring",
    "notes": "Preparing for regional STEM competitions.",
    "status": "new",
    "created_at": "2026-10-25T07:15:00.000Z",
    "updated_at": "2026-10-25T07:15:00.000Z"
  }
}
```

### 3.2 Candidate Mentor Application

Submits a prospective mentor application into the 6-stage candidate screening pipeline with initial status `'application_received'`. Supports both `application/json` and `multipart/form-data` uploads for verified academic transcripts and photo identification.

- **Method**: `POST`
- **Route**: `/api/v1/public/mentor-applications` (alias: `/api/v1/public/mentors/apply`)
- **Rate Limit**: Stricter Limiter (15 reqs / 15 mins)
- **Request Format**: `application/json` or `multipart/form-data`
- **Request Fields**:

| Field                          | Type       | Required | Description                                                 |
| ------------------------------ | ---------- | -------- | ----------------------------------------------------------- |
| `full_name`                    | `string`   | Yes      | Applicant's full name (min 2 chars)                         |
| `email`                        | `string`   | Yes      | Contact email address (unique in active records)            |
| `phone`                        | `string`   | Yes      | Ethiopian phone: `^(\+2519\d{8}\|09\d{8})$`                 |
| `telegram_handle`              | `string`   | No       | Optional Telegram username                                  |
| `university`                   | `string`   | Yes      | University or college affiliation (min 2 chars)             |
| `campus`                       | `string`   | No       | Campus location (e.g. "4 Kilo Campus")                      |
| `field_of_study`               | `string`   | Yes      | Major or degree program (min 2 chars)                       |
| `academic_year`                | `string`   | Yes      | Year of study (e.g. "3rd Year", "Postgraduate")             |
| `subjects`                     | `string[]` | Yes      | Non-empty array of subjects applicant can teach             |
| `has_teaching_experience`      | `boolean`  | No       | Boolean flag indicating previous teaching experience        |
| `teaching_experience_duration` | `string`   | No       | Duration of experience (e.g. "2 years")                     |
| `experience_details`           | `string`   | No       | Context regarding tutoring, TA, or classroom background     |
| `gpa`                          | `number`   | No       | Cumulative University GPA (0.00 to 4.00)                    |
| `entrance_exam_result`         | `number`   | No       | Ethiopian University Entrance Exam result (0.0 to 700.0)    |
| `available_days`               | `string[]` | No       | Days available (e.g. `["Monday", "Wednesday", "Saturday"]`) |
| `available_hours`              | `string`   | No       | Working hours window (e.g. "4 PM - 7 PM")                   |
| `availability`                 | `string`   | Yes      | Schedule summary string                                     |
| `motivation`                   | `string`   | Yes      | Statement of motivation (min 10 chars)                      |
| `commitment_agreement`         | `boolean`  | Yes      | Must be `true` confirming ethical & scheduling commitments  |
| `referral_source`              | `string`   | No       | How applicant found Bilunex (e.g. "Telegram Channel")       |
| `transcript`                   | `file`     | No       | PDF file upload (magic bytes checked, max 5 MB)             |
| `id_photo`                     | `file`     | No       | Image file upload: JPG/PNG (magic bytes checked, max 5 MB)  |

```json
{
  "full_name": "Solomon Tadesse",
  "email": "solomon@example.com",
  "phone": "+251944556677",
  "telegram_handle": "@solomon_t",
  "university": "Addis Ababa University",
  "campus": "4 Kilo Campus",
  "field_of_study": "Computer Science",
  "academic_year": "4th Year",
  "subjects": ["Computer Science", "Mathematics"],
  "gpa": 3.85,
  "entrance_exam_result": 615.0,
  "available_days": ["Saturday", "Sunday"],
  "available_hours": "10:00 AM - 4:00 PM",
  "availability": "Weekends 10am - 4pm",
  "motivation": "I want to mentor high school students in programming and STEM careers.",
  "commitment_agreement": true,
  "referral_source": "University Notice Board"
}
```

- **Response `201 Created`**:

```json
{
  "success": true,
  "message": "Mentor application submitted successfully. We will review your application soon.",
  "data": {
    "id": "2",
    "full_name": "Solomon Tadesse",
    "email": "solomon@example.com",
    "phone": "+251944556677",
    "university": "Addis Ababa University",
    "campus": "4 Kilo Campus",
    "field_of_study": "Computer Science",
    "academic_year": "4th Year",
    "subjects": ["Computer Science", "Mathematics"],
    "gpa": "3.85",
    "entrance_exam_result": "615.0",
    "available_days": ["Saturday", "Sunday"],
    "available_hours": "10:00 AM - 4:00 PM",
    "availability": "Weekends 10am - 4pm",
    "motivation": "I want to mentor high school students in programming and STEM careers.",
    "commitment_agreement": true,
    "status": "application_received",
    "documents": [
      {
        "id": "1",
        "document_type": "transcript",
        "original_filename": "transcript.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 1048576
      }
    ],
    "created_at": "2026-10-25T07:20:00.000Z"
  }
}
```

### 3.3 Public Inquiries & Support Contact

Submits a general inquiry or counseling support question into the `inquiries` table with status `'new'`.

- **Method**: `POST`
- **Route**: `/api/v1/public/inquiries` (alias: `/api/v1/public/contact`)
- **Rate Limit**: Stricter Limiter
- **Request Body**:

| Field          | Type     | Required | Description                                                                                          |
| -------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `name`         | `string` | Yes      | Inquirer full name (min 2 chars)                                                                     |
| `email`        | `string` | Yes      | Contact email address                                                                                |
| `phone`        | `string` | No       | Contact telephone                                                                                    |
| `inquiry_type` | `string` | Yes      | Enum: `'general'`, `'parent_support'`, `'mentor_application'`, `'counseling'` (default: `'general'`) |
| `message`      | `string` | Yes      | Inquiry message body (min 5 chars)                                                                   |

```json
{
  "name": "Bethlehem Girma",
  "email": "bethlehem@example.com",
  "phone": "+251911998877",
  "inquiry_type": "counseling",
  "message": "I would like to inquire about counseling support for high school exam anxiety."
}
```

- **Response `201 Created`**: Returns created inquiry record.

---

## 4. Protected Admin Endpoints (`/api/v1/admin`)

All admin routes (except login) require `Authorization: Bearer <token>` where the token contains `role: 'admin'` or `'super_admin'`. Non-admin tokens receive `403 Forbidden`.

Every administrative read of sensitive parent/child records and mutations creates an immutable record in `audit_log`.

### 4.1 Admin Login

- **Method**: `POST`
- **Route**: `/api/v1/admin/auth/login`
- **Auth**: None (Strict rate limiting)
- **Request Body**:

```json
{
  "email": "admin@bilunex.org",
  "password": "Admin123!"
}
```

- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Admin authenticated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "name": "System Administrator",
      "email": "admin@bilunex.org",
      "role": "super_admin"
    }
  }
}
```

### 4.2 Current Admin Profile

- **Method**: `GET`
- **Route**: `/api/v1/admin/auth/me`
- **Auth**: Admin JWT
- **Response `200 OK`**: Returns `{ id, name, email, role, created_at, updated_at }`.

### 4.3 List Parent Registrations

Retrieves active parent registrations with multi-parameter filtering, case-insensitive substring search, and pagination. Access is automatically logged to `audit_log`.

- **Method**: `GET`
- **Route**: `/api/v1/admin/parent-registrations`
- **Auth**: Admin JWT
- **Query Parameters**:
  - `status`: `'new'` | `'contacted'` | `'enrolled'` | `'archived'`
  - `grade_level`: Exact grade string match
  - `subject`: Subject array containment match (`$3 = ANY(subjects)`)
  - `from_date`: ISO timestamp filter (`created_at >= $4`)
  - `to_date`: ISO timestamp filter (`created_at <= $5`)
  - `search`: Substring search against `parent_name`, `child_name`, and `email`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 50, max: 100)
- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Parent registrations retrieved successfully",
  "data": {
    "registrations": [
      {
        "id": "1",
        "parent_name": "Abebe Bikila",
        "email": "abebe@example.com",
        "phone": "+251911223344",
        "child_name": "Dawit Abebe",
        "grade_level": "Grade 9",
        "subjects": ["Mathematics", "Physics"],
        "support_category": "tutoring",
        "status": "new",
        "created_at": "2026-10-25T07:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### 4.4 List Mentor Applications

- **Method**: `GET`
- **Route**: `/api/v1/admin/mentor-applications`
- **Auth**: Admin JWT
- **Query Parameters**:
  - `status`: One of the 6 pipeline stages
  - `page`: Page number
  - `limit`: Items per page
- **Response `200 OK`**: Returns application rows with a `documents` array on each row and pagination metadata. Each document item exposes the `id`, type, original filename, MIME type, file size, and creation date needed by an administrator to invoke the secure download route. Internal storage paths are not returned.

### 4.5 Update Mentor Application Status

Advances a candidate along the 6-stage screening pipeline. Logs an audit entry.

- **Method**: `PATCH`
- **Route**: `/api/v1/admin/mentor-applications/:id/status`
- **Auth**: Admin JWT
- **Request Body**:

```json
{
  "status": "interview_stage"
}
```

Allowed status values:
`'application_received'`, `'under_review'`, `'interview_stage'`, `'accepted'`, `'rejected'`, `'onboarding'`.

- **Response `200 OK`**: Returns updated application `{ id, full_name, email, status, updated_at }`.

### 4.6 Activate Mentor (ACID Database Transaction)

Activates an accepted applicant into a full mentor account.
**Transaction steps**:

1. Checks that application exists, is in `'accepted'` status, and does not already have an active profile.
2. Inserts verified profile into `mentor_profiles` linked 1:1 via `application_id` with hashed credentials.
3. Updates application status to `'onboarding'`.
4. Records action in `audit_log`.

- **Method**: `POST`
- **Route**: `/api/v1/admin/mentor-applications/:id/activate`
- **Auth**: Admin JWT
- **Request Body**:

```json
{
  "initial_password": "InitialMentorPassword2026!"
}
```

_(Optional: defaults to a secure system-generated credential if omitted)_.

- **Response `201 Created`**:

```json
{
  "success": true,
  "message": "Mentor profile created and activated successfully",
  "data": {
    "id": "3",
    "application_id": "2",
    "name": "Solomon Tadesse",
    "email": "solomon@example.com",
    "phone": "+251944556677",
    "university": "Addis Ababa University",
    "field_of_study": "Computer Science",
    "subject_specializations": ["Computer Science", "Mathematics"],
    "availability": "Weekends 10am - 4pm",
    "account_status": "active",
    "created_at": "2026-10-25T07:30:00.000Z"
  }
}
```

- **Error Case**: If application is not in `'accepted'` status, returns `500` and rolls back the transaction.

### 4.7 List Inquiries

- **Method**: `GET`
- **Route**: `/api/v1/admin/inquiries`
- **Auth**: Admin JWT
- **Query Parameters**: `inquiry_type`, `status`, `page`, `limit`
- **Response `200 OK`**: Paginated inquiries list.

### 4.8 Operational Summary Metrics

- **Method**: `GET`
- **Route**: `/api/v1/admin/reports/summary`
- **Auth**: Admin JWT
- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Operational summary metrics retrieved",
  "data": {
    "parent_registrations": [
      { "status": "new", "count": 12 },
      { "status": "contacted", "count": 5 },
      { "status": "enrolled", "count": 8 }
    ],
    "mentor_applications": [
      { "status": "application_received", "count": 4 },
      { "status": "under_review", "count": 2 },
      { "status": "interview_stage", "count": 1 },
      { "status": "accepted", "count": 3 },
      { "status": "onboarding", "count": 2 }
    ],
    "inquiries": [
      { "status": "new", "count": 6 },
      { "status": "in_progress", "count": 2 }
    ],
    "failed_notifications_last_7_days": 0
  }
}
```

### 4.9 List Student Support Reports (Admin Cross-System View)

Chronological audit feed for administrators inspecting all session observations filed across all mentors. Records audit log on access.

- **Method**: `GET`
- **Route**: `/api/v1/admin/student-support-reports`
- **Auth**: Admin JWT
- **Query Parameters**: `page`, `limit`
- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Student support reports retrieved successfully",
  "data": {
    "reports": [
      {
        "id": "1",
        "student_name": "Leo Miller",
        "support_need_observed": "Struggling with quadratic factoring and exhibits test anxiety.",
        "observations": "Leo responded well to visual decomposition of algebraic expressions.",
        "recommended_action": "Complete practice exercise 3B; establish 15-minute daily spaced repetition.",
        "created_at": "2026-10-25T07:00:00.000Z",
        "mentor_id": "1",
        "mentor_name": "Dr. Sarah Johnson",
        "mentor_email": "mentor@bilunex.org",
        "mentor_university": "Addis Ababa University"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 100, "totalPages": 1 }
  }
}
```

### 4.10 Secure Mentor Document Download (Audited Streaming)

Securely streams an uploaded applicant document (transcript or ID photo) directly to an authenticated administrator. Never served statically. Every download access is recorded immutably in `audit_log` (`action: 'view'`, `target_table: 'mentor_documents'`).

- **Method**: `GET`
- **Route**: `/api/v1/admin/documents/:id/download`
- **Auth**: Admin JWT (`role: 'admin'` or `'super_admin'`)
- **URL Parameters**:
  - `id`: Numeric document ID from `mentor_documents` table
- **Response `200 OK`**:
  - **Headers**:
    - `Content-Type`: `application/pdf` (or `image/jpeg`, `image/png`)
    - `Content-Disposition`: `attachment; filename="original_filename.ext"`
  - **Body**: Binary file stream
- **Error Codes**:
  - `401 Unauthorized`: Token missing or invalid
  - `403 Forbidden`: Non-admin user attempted download
  - `404 Not Found`: Document ID does not exist or file is missing from secure disk storage

### 4.11 Admin UI API limitations

- There is no dedicated endpoint to list mentor profiles; the current Active Mentors page uses mentor applications in `onboarding` status as a proxy.
- Parent registration and inquiry status update services are not exposed as routes.
- Mentor application, inquiry, and student support report list routes do not accept a search parameter. Search over those lists must therefore stay scoped to the currently loaded page. Parent registration search is server-side.

---

## 5. Protected Mentor Portal Endpoints (`/api/v1/mentor`)

All mentor endpoints (except login) require `Authorization: Bearer <token>` where `role: 'mentor'`.
**Cross-Mentor Isolation Rule**: Mentors can strictly view and file reports only for their own profile ID (`WHERE mentor_id = $1`). Accessing another mentor's data is blocked at the database repository query level.

### 5.1 Mentor Authentication Login

- **Method**: `POST`
- **Route**: `/api/v1/mentor/auth/login`
- **Auth**: None (Strict rate limiting)
- **Constraint**: Login succeeds ONLY if `mentor_profiles.account_status === 'active'`. Inactive or suspended accounts receive `401 Unauthorized`.
- **Request Body**:

```json
{
  "email": "mentor@bilunex.org",
  "password": "Mentor123!"
}
```

- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Mentor authenticated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "name": "Dr. Sarah Johnson",
      "email": "mentor@bilunex.org",
      "role": "mentor",
      "account_status": "active"
    }
  }
}
```

### 5.2 Mentor Own Profile

- **Method**: `GET`
- **Route**: `/api/v1/mentor/profile`
- **Auth**: Mentor JWT
- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "1",
    "application_id": "1",
    "name": "Dr. Sarah Johnson",
    "email": "mentor@bilunex.org",
    "phone": "+251911002233",
    "university": "Addis Ababa University",
    "field_of_study": "Physics & Science Education",
    "subject_specializations": ["Mathematics", "Physics", "STEM Coaching"],
    "availability": "Weekdays after 4 PM, Saturdays 10 AM - 2 PM",
    "account_status": "active",
    "created_at": "2026-10-25T07:00:00.000Z"
  }
}
```

### 5.3 Update Mentor Profile

Updates contact phone, availability schedule, or subject specializations.

- **Method**: `PATCH`
- **Route**: `/api/v1/mentor/profile`
- **Auth**: Mentor JWT
- **Request Body**:

```json
{
  "phone": "+251911002244",
  "availability": "Weekdays after 5 PM, Saturdays 10 AM - 3 PM",
  "subject_specializations": ["Mathematics", "Physics", "Calculus"]
}
```

- **Response `200 OK`**: Returns updated profile record.

### 5.4 Submit Student Support Report

Files confidential observations and next-step recommendations following a support session. The `mentor_id` is automatically extracted from the authenticated JWT token.

- **Method**: `POST`
- **Route**: `/api/v1/mentor/reports`
- **Auth**: Mentor JWT
- **Request Body**:

| Field                   | Type     | Required | Description                                             |
| ----------------------- | -------- | -------- | ------------------------------------------------------- |
| `student_name`          | `string` | Yes      | Student's name (min 2 chars)                            |
| `support_need_observed` | `string` | Yes      | Academic or emotional hurdle identified (min 2 chars)   |
| `observations`          | `string` | Yes      | Detailed session engagement observations (min 10 chars) |
| `recommended_action`    | `string` | Yes      | Homework or follow-up steps assigned (min 2 chars)      |

```json
{
  "student_name": "Dawit Abebe",
  "support_need_observed": "Struggles with coordinate geometry transformations",
  "observations": "Dawit was receptive to coordinate grid step-by-step visualizations and solved 3 transformation problems independently.",
  "recommended_action": "Complete transformation exercises 4-8 on page 56; review reflection rules."
}
```

- **Response `201 Created`**: Returns created report record.

### 5.5 List Mentor's Own Support Reports (Isolated)

Returns all session support reports authored by the authenticated mentor.

- **Method**: `GET`
- **Route**: `/api/v1/mentor/reports`
- **Auth**: Mentor JWT
- **Query Filter**: Strictly enforced `WHERE mentor_id = $1`. Reports filed by other mentors are completely inaccessible.
- **Response `200 OK`**:

```json
{
  "success": true,
  "message": "Student support reports retrieved successfully",
  "data": [
    {
      "id": "2",
      "mentor_id": "1",
      "student_name": "Dawit Abebe",
      "support_need_observed": "Struggles with coordinate geometry transformations",
      "observations": "Dawit was receptive to coordinate grid step-by-step visualizations...",
      "recommended_action": "Complete transformation exercises 4-8 on page 56...",
      "created_at": "2026-10-25T07:45:00.000Z",
      "updated_at": "2026-10-25T07:45:00.000Z"
    }
  ]
}
```

---

## 6. HTTP Status Code Summary

| Code  | Status                | Meaning                                                                        |
| ----- | --------------------- | ------------------------------------------------------------------------------ |
| `200` | OK                    | Request succeeded and data returned.                                           |
| `201` | Created               | Resource successfully created in database.                                     |
| `400` | Bad Request           | Request payload failed strict validation schema.                               |
| `401` | Unauthorized          | Missing, invalid, or expired JWT, or bad credentials.                          |
| `403` | Forbidden             | Authenticated user lacks required role (e.g. mentor accessing admin endpoint). |
| `404` | Not Found             | Requested route or target database entity does not exist.                      |
| `429` | Too Many Requests     | Rate limit exceeded on endpoint or IP.                                         |
| `500` | Internal Server Error | Unexpected server error or aborted transaction.                                |
