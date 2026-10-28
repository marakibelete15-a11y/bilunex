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

**Status:** not started

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

**Next:** STAGE 2 — public content pages.
