# Bilunex redesign progress

## STAGE 0B — Notification dispatch fix

**Status:** done

- Parent registration, mentor application, and inquiry controllers send the 201 response before scheduling email dispatch.
- SMTP uses 10-second connection, greeting, socket, Ethereal provisioning, and send timeouts.
- Attempts record success, failure, timeout, or `logged_not_sent`; failures to write logs are reported without throwing into intake.
- Development with no configured SMTP provisions Ethereal lazily. If unavailable, it logs the recipient, subject, and plain text body and records offline status.
- Added process-level logging for unhandled rejections and uncaught exceptions.
- Added integration coverage for sub-two-second response with a hanging transport, timeout and failure logs, and parent/admin plus mentor/admin successful notification rows.
- `npm run lint` passes. `npm test` passes: 61 tests.
- The earlier curl stall was caused by notification dispatch being awaited in the registration path while SMTP/Ethereal operations waited on network timeouts. The path was guarded against thrown transport errors, but the response was still withheld. No evidence identified an unhandled rejection as the original cause; global handlers now log either unhandled rejection or uncaught exception.
- Migration `015_notification_delivery_statuses.up.sql` adds `timeout` and `logged_not_sent` statuses. It was applied manually to local `bilunex` and `bilunex_test` databases for verification.

**Verification:** a real POST to `http://localhost:5000/api/v1/public/parent-registrations` returned `201` in 424 ms (record ID 11). The saved row has `Grade 9`, `Mathematics`, and allowed `tutoring` category. The `bilunex` database contains `parent_registration_admin_alert` for `admin@bilunex.org` with role `admin` and `parent_registration_ack` for the submitted email with role `parent`; both are `logged_not_sent` after SMTP timed out in this offline environment.

**Next:** STAGE 0 complete; move to STAGE 1.

## STAGE 0 — Backend verification and frontend audit

**Status:** done

- Prior audit found these canonical public pages: `index.html`, `about.html`, `services.html`, `for-parents.html`, `parent-registration.html` (missing), `become-a-mentor.html`, `stories.html`, `contact.html`.
- Existing public pages: `index.html`, `about.html`, `services.html`, `for-parents.html`, `become-a-mentor.html`, `stories.html`, `contact.html`.
- Existing admin pages: `index.html`, `login.html`, `applications.html`, `mentors.html`.
- Existing mentor pages: `login.html`, `profile.html`, `report.html`.
- HTML inventory: `client/admin/{applications,index,login,mentors}.html`; `client/mentor/{login,profile,report}.html`; `client/public/{about,become-a-mentor,contact,for-parents,index,services,stories}.html`.
- JavaScript inventory: `client/js/api.js`, `auth.js`, `ui.js`, `validation.js`, `components/layout.js`, and `pages/for-parents.js`.
- No duplicate HTML pages, alternate page-name copies, or unreferenced JS modules were found. Shared CSS files are `base.css`, `components.css`, `layout.css`, and `pages.css`.
- Existing public navigation links resolve among current pages. Registration CTAs currently point to the For Parents information page; update them to `parent-registration.html` when that page is built in STAGE 3. The canonical page is the only missing public page.
- Backend response, persisted record, and both notification attempts verified above. Lint passes; full backend suite passes (62 tests).
- Known issue for later stages: current public pages still have per-page headers/footers and the parent information page currently contains a form; redesign and move of the form are planned in STAGES 1–3.

## STAGES 1–6

**Status:** in progress

### STAGE 1 — Design system, logo, shared layout

**Status:** done

- Updated the central CSS tokens to a navy/white/light-gray palette with restrained gold accent and retained accessible neutral/feedback colors.
- Added SVG `logo.svg`, `logo-mark.svg`, and `favicon.svg`.
- Public headers and footers are now rendered from the shared layout module. The module provides exactly seven public navigation items, active-page marking, register CTAs, a mentor portal link, and placeholder contact details.
- Admin and mentor pages now load the shared portal header renderer instead of copied page headers. The public navigation never links to admin.
- Added a mobile navigation focus loop, Escape handling, outside-click close, sticky header, 44px controls, and gold CTA/outline/ghost/small/disabled/loading button styles.
- Previewed the mobile drawer in the local browser; navigation and gold registration CTA render in the drawer.
- No existing `client/assets/images/logo.png` was present, so the SVG brand mark is used directly.
- Known issue: registration CTA targets `parent-registration.html`, which will be created in STAGE 3. Existing home content still links its main registration CTA to `for-parents.html` pending that stage.

**Next:** STAGE 2 complete; move to STAGE 3.

### STAGE 2 — Public content pages

**Status:** done

- Rebuilt Home, About, Services, For Parents, and Stories & Resources using the shared layout.
- Home includes accessible stepper and growth tabs, linked service cards, guidance pathways, honest empty story copy, clear calls to action, and reduced-motion-aware scroll reveals.
- About includes story, mission, vision, values, approach, student commitment, and the three specified principles.
- Services explains Academic Support, Mentoring & Guidance, and Professional Counseling. It states that counseling is provided by a qualified psychologist and mentoring is not a substitute for psychological care.
- For Parents is now information-only with process, subject/grade, selection/safeguarding, FAQ sections, and registration calls to action.
- Stories & Resources has truthful empty states and educational resources marked as coming later.
- New `[To be confirmed by Bilunex]` items: founding story, mission, vision, values, trusted-relationship practices, specific student commitments and safeguarding/privacy details; review process and response timeline; family consultation and next-step details; subjects, grade levels, curriculum scope, scheduling, mentor selection and safeguarding practices; counseling scope, availability, fees, and appointment request process. Existing footer email/location placeholders remain.
- Lint passes; full backend suite passes (62 tests).

**Next:** STAGE 3 complete; move to STAGE 4.

### STAGE 3 — Forms

**Status:** done

- Added `parent-registration.html` as a separate two-step form. The wording visible in the supplied Google Form screenshots is preserved in English, including the intro and Next Steps box; the 24-hour/fee/trial promise is explicitly marked `[To be confirmed by Bilunex]`.
- Parent field map: Parent/Guardian Full Name → `parent_name`; preferred title (Mr./Mrs./Ms/Dr./Other) → `preferred_title`; Phone Number → `phone`; Secondary phone Number → `secondary_phone`; Preferred Communication Method → `preferred_communication_method` values `phone_call`, `telegram`, `whatsapp`. The Other title text is sent as a custom `preferred_title` string.
- Added API fields not visible in the provided screenshot: required `email` (required by API schema), optional `telegram_handle`, and student/support fields `child_name`, `grade_level`, `subjects`, `support_category`, `notes`.
- Every Google Form field visible in the screenshots has an API mapping; no Google Form field requires a backend schema change. The screenshot’s Amharic introduction is represented by a confirmation placeholder because the raster text could not be transcribed confidently; exact Amharic copy is still needed to fully match that line.
- Parent validation mirrors server requirements for name, email, Ethiopian phone format, title, communication preferences, student name, grade, subjects, and exact support category values. Success requires HTTP 201 and a returned reference ID; double-submit guard, inline errors, focus handling, 429/5xx/network messages are in place.
- Mentor application now includes all API fields, multi-step progress, commitment agreement, transcript PDF and ID photo JPG/PNG checks (5 MB), file-name previews, and multipart submission. Backend remains responsible for magic-byte validation.
- Contact inquiry form now maps `name`, `email`, optional `phone`, `inquiry_type`, and `message` to the inquiry API; contact/social/Telegram information is placeholder text.
- API client preserves browser `FormData` content boundaries and can enforce expected HTTP 201 responses.
- Lint passes; full backend suite passes (62 tests). Browser inspection confirmed empty parent required-field validation and progression to student fields.

**Next:** STAGE 4 — admin portal (in progress).

### STAGE 4 — Admin portal

**Status:** done

- Rebuilt the admin login and added dashboard, parent registrations, mentor applications, active mentors, inquiries, and student support reports pages. Every protected page checks a sessionStorage token and admin role; both `admin` and seeded `super_admin` roles are accepted. API 401 responses clear the session and redirect to the matching login.
- Shared responsive portal header, sidebar navigation, mobile menu, current-user identity and logout are in place. Admin pages are not linked from the public site.
- Lists have loading, error, empty and pagination states, status badges and scrollable table regions. Parent registrations support API search and status/grade/subject filters. Mentor applications support status filtering and current-page search. Inquiries support type/status filters and current-page search. Reports and onboarding applications support current-page search.
- Mentor applications expose submitted field details and document metadata, with authenticated download through the audited endpoint. Accepted applicants can have their status changed and be activated with a new initial password.
- Separate backend fix `fe9c402` adds safe document metadata to the admin applications response so the frontend can call the existing authenticated download endpoint.
- Browser check: seeded admin login reached dashboard; summary counts and failed notifications loaded; parent registration list rendered saved records; mentor application details/status controls and inquiry list rendered.
- API gaps: there is no dedicated active mentor profile listing endpoint, so the Active Mentors page currently uses `onboarding` applications as a labeled proxy. Parent registrations and inquiries have no status update endpoints. Mentor applications, inquiries and support reports lack server-side search; their UI search is limited to the currently loaded page. The public response-shape change above was the only backend change needed for this stage.
- `npm run lint` passes; full `npm test` suite passes (62 tests).

**Next:** STAGE 5 — mentor portal.
