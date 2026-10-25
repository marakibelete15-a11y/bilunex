# Bilunex REST API Documentation (Version 1)

Base URL: `/api/v1`

All requests and responses use `application/json`. Authenticated routes require an HTTP header:
`Authorization: Bearer <token>`

---

## 1. Response Standard

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [{ "field": "email", "message": "Please provide a valid email address" }]
}
```

---

## 2. System Endpoints

### 2.1 Health Check

- **Endpoint**: `GET /api/v1/health`
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

## 3. Public Endpoints (`/api/v1/public`)

### 3.1 Parent / Student Intake Registration

- **Endpoint**: `POST /api/v1/public/parents/register`
- **Rate Limit**: Stricter (15 reqs / 15 mins)
- **Request Body**:

```json
{
  "parent_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 123 4567",
  "student_name": "Alex Doe",
  "student_grade": "High School (9-12)",
  "support_type": "combined",
  "notes": "Looking for math tutoring and mentorship."
}
```

- **Response `201 Created`**: Returns created registration record.

### 3.2 Mentor Candidate Application

- **Endpoint**: `POST /api/v1/public/mentors/apply`
- **Rate Limit**: Stricter (15 reqs / 15 mins)
- **Request Body**:

```json
{
  "full_name": "Dr. Sarah Johnson",
  "email": "sarah@example.com",
  "phone": "+1 555 987 6543",
  "expertise": "Mathematics, Physics",
  "years_experience": 5,
  "bio": "Certified high school STEM teacher dedicated to youth coaching."
}
```

- **Response `201 Created`**: Returns application record.

### 3.3 General Contact Inquiries

- **Endpoint**: `POST /api/v1/public/contact`
- **Request Body**: `{ "name": "...", "email": "...", "subject": "...", "message": "..." }`
- **Response `200 OK`**.

---

## 4. Admin Endpoints (`/api/v1/admin`)

### 4.1 Admin Login

- **Endpoint**: `POST /api/v1/admin/auth/login`
- **Rate Limit**: Stricter (15 reqs / 15 mins)
- **Request Body**: `{ "email": "admin@bilunex.org", "password": "..." }`
- **Response `200 OK`**: Returns `{ token, user: { id, email, role: "admin", name } }`.

### 4.2 Dashboard Overview Metrics

- **Endpoint**: `GET /api/v1/admin/overview`
- **Auth**: Required (`role: admin`)
- **Response `200 OK`**: Returns counts `{ parentsCount, applicationsCount, mentorsCount, reportsCount }`.

### 4.3 Mentor Applications List

- **Endpoint**: `GET /api/v1/admin/applications`
- **Auth**: Required (`role: admin`)
- **Response `200 OK`**: Array of all candidate applications.

### 4.4 Update Application Status

- **Endpoint**: `PATCH /api/v1/admin/applications/:id`
- **Auth**: Required (`role: admin`)
- **Request Body**: `{ "status": "approved" | "rejected" | "pending" }`
- **Response `200 OK`**: Updated application record.

### 4.5 Active Mentors Directory

- **Endpoint**: `GET /api/v1/admin/mentors`
- **Auth**: Required (`role: admin`)
- **Response `200 OK`**: Array of active mentors.

---

## 5. Mentor Endpoints (`/api/v1/mentor`)

### 5.1 Mentor Login

- **Endpoint**: `POST /api/v1/mentor/auth/login`
- **Rate Limit**: Stricter (15 reqs / 15 mins)
- **Request Body**: `{ "email": "mentor@bilunex.org", "password": "..." }`
- **Response `200 OK`**: Returns `{ token, user: { id, mentorId, email, role: "mentor", name } }`.

### 5.2 Mentor Profile

- **Endpoint**: `GET /api/v1/mentor/profile`
- **Auth**: Required (`role: mentor`)
- **Response `200 OK`**: Profile details for the logged-in mentor.

### 5.3 Submit Student Support Report

- **Endpoint**: `POST /api/v1/mentor/reports`
- **Auth**: Required (`role: mentor`)
- **Request Body**:

```json
{
  "student_name": "Alex Doe",
  "session_date": "2026-10-25",
  "duration_minutes": 60,
  "session_focus": "Algebra Quadratics",
  "observations": "Student made good progress understanding vertex form.",
  "action_items": "Practice problems 1-10 on page 42.",
  "progress_rating": 4
}
```

- **Response `201 Created`**: Returns created report record.

### 5.4 Mentor's Filed Reports

- **Endpoint**: `GET /api/v1/mentor/reports`
- **Auth**: Required (`role: mentor`)
- **Response `200 OK`**: Returns reports created by this mentor only.
