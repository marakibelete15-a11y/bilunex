# Bilunex redesign progress

## Maintenance fixes — 2026-10-28

### Server logging and startup errors

**Status:** done

- Logger methods preserve all arguments and render `Error` values with their stack.
- Direct logger output check confirmed the label, subsequent arguments, and error stack all print.
- HTTP server reports a clear port-in-use message; uncaught exceptions log and exit with code 1.
- `npm run lint` passes; full `npm test` suite passes (62 tests).

### Development admin password reset

**Status:** done

- Added `admin:reset-password` at the repository root and in `server/`; the utility accepts email and password arguments, requires 12 characters, hashes with bcrypt cost 12, updates `admin_users`, and is disabled in production.
- README documents the development-only command. Output is limited to success or failure.
- `npm run lint` passes; full `npm test` suite passes (62 tests). An invocation with missing arguments prints only `Admin password reset failed.` and exits nonzero.

### Public registration CTA duplication

**Status:** done

- Removed the extra home hero registration CTA; shared layout remains the single desktop header CTA and provides the mobile drawer CTA. The drawer CTA is hidden by CSS at 960px and wider.
- Reviewed all pages in `client/public/`; remaining registration CTAs are page-content actions, not duplicate header controls.
- Verified the 1920px desktop header shows one header CTA. At 375px, the drawer shows one CTA after opening; the drawer CTA is hidden at desktop width. Reviewed all eight public pages; remaining occurrences are content CTAs, with no duplicate hard-coded header copies.
- `npm run lint` passes; full `npm test` suite passes (62 tests).

### Development API notice

**Status:** done

- The notice now checks `${API_BASE}/health` and appears only when the request fails or returns a non-OK response; the dismissal control and port-5000 link remain.
- `npm run lint` passes; full `npm test` suite passes (62 tests).

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

**Status:** done

### STAGE 1 — Design system, logo, shared layout

**Status:** done

- Updated the central CSS tokens to a navy/white/light-gray palette with restrained gold accent and retained accessible neutral/feedback colors.
- Added SVG `logo.svg`, `logo-mark.svg`, and `favicon.svg`.
- Public headers and footers are now rendered from the shared layout module. The module provides exactly seven public navigation items, active-page marking, register CTAs, a mentor portal link, and placeholder contact details.
- Admin and mentor pages now load the shared portal header renderer instead of copied page headers. The public navigation never links to admin.
- Added a mobile navigation focus loop, Escape handling, outside-click close, sticky header, 44px controls, and gold CTA/outline/ghost/small/disabled/loading button styles.
- Previewed the mobile drawer in the local browser; navigation and gold registration CTA render in the drawer.
- No existing `client/assets/images/logo.png` was present, so the SVG brand mark is used directly.
- Registration CTAs were connected to `parent-registration.html` in STAGE 3.

**Next:** STAGE 2.

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

**Next:** STAGE 3.

### STAGE 3 — Forms

**Status:** done

- Added `parent-registration.html` as a separate two-step form. The wording visible in the supplied Google Form screenshots is preserved in English, including the intro and Next Steps box; the 24-hour/fee/trial promise remains in its original Next Steps box wording, with an explicit confirmation note placed just outside the box.
- Parent field map: Parent/Guardian Full Name → `parent_name`; preferred title (Mr./Mrs./Ms/Dr./Other) → `preferred_title`; Phone Number → `phone`; Secondary phone Number → `secondary_phone`; Preferred Communication Method → `preferred_communication_method` values `phone_call`, `telegram`, `whatsapp`. The Other title text is sent as a custom `preferred_title` string. The screenshot uses checkboxes, while the API accepts one title string; the page labels this constraint and rejects multiple selections instead of silently dropping them. To preserve multi-select, the smallest backend expansion is to accept/store `preferred_title` as an array (for example a PostgreSQL `text[]` column) and update validation/serialization.
- Added API fields not visible in the provided screenshot: required `email` (required by API schema), optional `telegram_handle`, and student/support fields `child_name`, `grade_level`, `subjects`, `support_category`, `notes`.
- Every visible Google Form field has an API mapping. The preferred-title checkbox group can select multiple values in Google Forms, while the API field is scalar; the page tells the visitor to select one and blocks multiple selections so no value is discarded. If multi-select behavior must be retained, the smallest backend extension is an array field stored in a PostgreSQL `text[]` column with matching validation and serialization. The screenshot’s Amharic introduction is represented by a confirmation placeholder because the raster text could not be transcribed confidently; exact Amharic copy is still needed to fully match that line.
- Parent validation mirrors server requirements for name, email, Ethiopian phone format, title, communication preferences, student name, grade, subjects, and exact support category values. Success requires HTTP 201 and a returned reference ID; double-submit guard, inline errors, focus handling, 429/5xx/network messages are in place.
- Mentor application now includes all API fields, multi-step progress, commitment agreement, transcript PDF and ID photo JPG/PNG checks (5 MB), file-name previews, and multipart submission. Backend remains responsible for magic-byte validation.
- Contact inquiry form now maps `name`, `email`, optional `phone`, `inquiry_type`, and `message` to the inquiry API; contact/social/Telegram information is placeholder text.
- API client preserves browser `FormData` content boundaries and can enforce expected HTTP 201 responses.
- Lint passes; full backend suite passes (62 tests). Browser inspection confirmed empty parent required-field validation and progression to student fields.

**Next:** STAGE 4.

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

**Next:** STAGE 5.

### STAGE 5 — Mentor portal

**Status:** done

- Rebuilt mentor login, profile, and support report pages with the shared portal chrome and a single ES-module entry per page. Removed inline scripts and styles.
- Mentor pages require a `mentor` token; admin pages accept only `admin` or `super_admin`. Browser verification confirmed mentor login opens the profile and a mentor token visiting the admin dashboard redirects to admin login.
- Profile displays the authenticated mentor’s account details and supports editing phone, availability, and subject specializations through `PATCH /mentor/profile`.
- Reports page submits only the API-supported fields (`student_name`, `support_need_observed`, `observations`, `recommended_action`) and lists only the authenticated mentor’s reports. Profile also lists that mentor’s own reports.
- No additional backend changes were needed for Stage 5. Lint and full test-suite status is recorded after the final run below.

**Next:** STAGE 6.

### STAGE 6 — Polish and verification

**Status:** done

- Audited all 18 HTML pages: each has one H1, a Bilunex page title, a non-empty meta description, and valid local files/fragments. Removed the now-unused `pages/portal-layout.js` module.
- Confirmed no inline style blocks/attributes, no inline scripts, and no user-content HTML injection API use in client code. All page scripts are external ES modules.
- Checked public pages, both long forms, contact, all admin pages, and all mentor pages at widths 320, 375, 768, 1024, and 1440 px. Fixed the parent registration step indicator overflow at 320 px. The tested pages have no horizontal overflow.
- Browser console showed no errors or warnings during page checks; the module assets loaded through the Express-served app. Static checks confirmed all local file paths and page fragments resolve.
- Added `docs/MANUAL-CHECKLIST.md` with page-by-page form, upload, role, database, responsive, and failure-case checks. Updated README for canonical pages, migration 015, lint/test commands, and the checklist. Updated `docs/api.md` with the application document metadata and admin API limitations.
- Known unresolved items: the Amharic introduction line in the user-supplied screenshot is too small/blurred to transcribe reliably and remains a clearly marked placeholder; the owner needs to provide exact Amharic text. Preferred title is a checkbox field in the Google Form but scalar in the API; the UI prevents multi-select, and supporting it requires the small schema/validator update described in Stage 3.
- Known API limits remain as listed in the Stage 4 section: no dedicated active mentor profiles list; no parent/inquiry status update routes; and server-side search is not available for mentor applications, inquiries, or support reports.
- `npm run lint` passes; full `npm test` passes (62 tests). Client ES modules pass Node syntax checks.

**Next:** all requested stages complete. Review the known copy/API gaps above before production use.

## Follow-up polish — 2026-10-29

### Part 1 — Header and navigation

**Status:** done

- Confirmed shared navigation has seven informational items; the registration control is a separate gold CTA in the desktop header and mobile drawer.
- Moved desktop navigation breakpoint from 960px to 1200px and tightened link/button spacing to keep the seven labels on one line. Smaller widths use the drawer.
- Existing content-level registration links remain outside the shared header.

**Next:** Part 2.

### Part 2 — Development port notice

**Status:** done

- Kept the health-check based notice and made it compact. Dismissal is remembered in `sessionStorage`; the link preserves the current path, query, and fragment at `http://localhost:5000`.
- API-origin pages on `localhost:5000` and `127.0.0.1:5000` use same-origin `/api/v1` health checks; the notice is only mounted after a failed health check.
- CORS remains unchanged in `server/src/app.js`: requests without an Origin are permitted for tools such as curl; browser origins are permitted only when equal to configured `env.CLIENT_URL` (`http://localhost:5000` by default). Credentials remain enabled.

**Next:** Part 3.
