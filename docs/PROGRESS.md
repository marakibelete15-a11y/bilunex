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

**Next:** STAGE 0 — verify a real development POST and notification rows, complete the full HTML/JS page map, then move to STAGE 1.

## STAGE 0 — Backend verification and frontend audit

**Status:** in progress

- Prior audit found these canonical public pages: `index.html`, `about.html`, `services.html`, `for-parents.html`, `parent-registration.html` (missing), `become-a-mentor.html`, `stories.html`, `contact.html`.
- Existing public pages: `index.html`, `about.html`, `services.html`, `for-parents.html`, `become-a-mentor.html`, `stories.html`, `contact.html`.
- Existing admin pages: `index.html`, `login.html`, `applications.html`, `mentors.html`.
- Existing mentor pages: `login.html`, `profile.html`, `report.html`.
- Next: capture every client HTML/JS file, check links and duplicate/dead pages, then POST valid fields and query its saved row plus parent/admin notification logs.

## STAGES 1–6

**Status:** not started

**Next:** Begin STAGE 1 after STAGE 0 is complete.
