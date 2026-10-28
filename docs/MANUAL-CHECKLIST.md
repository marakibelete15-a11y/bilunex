# Bilunex manual verification checklist

Run the app through Express so the pages and API share the same origin. Do not use Live Server or open HTML files directly.

## Start-up

- [ ] From `server/`, run `npm run dev`; confirm the server reports a PostgreSQL connection to `bilunex`.
- [ ] Open [Public home](http://localhost:5000/public/index.html), [Admin login](http://localhost:5000/admin/login.html), and [Mentor login](http://localhost:5000/mentor/login.html).
- [ ] Confirm `http://localhost:5000/api/v1/health` returns healthy.
- [ ] Run `npm run lint` and `npm test` from `server/`.

## Shared layout and responsive widths

Repeat the public pages below at viewport widths **320, 375, 768, 1024, and 1440 px**.

- [ ] Public header has exactly seven navigation items and the registration CTA; active page is marked. The mobile drawer opens, traps focus, closes with Escape/outside click, and has no horizontal scroll.
- [ ] Footer has the brand/tagline, quick links, contact placeholders, and mentor login. It has no admin link.
- [ ] All public pages have one H1, a Bilunex title, descriptive meta description, working page links, and no console errors or missing CSS/module requests.

## Public pages

- [ ] **Home** — stepper advances, growth tabs switch, service/pathway cards reach their sections, and registration/story CTAs navigate to the expected pages. Reduced-motion preference does not force animation.
- [ ] **About Us** — story, mission, vision, values, approach, commitment, and principles sections display. Confirm placeholders remain clearly marked.
- [ ] **Services** — Academic Support, Mentoring & Guidance, and Professional Counseling anchors work. Counseling is attributed to a qualified psychologist, and the page says mentoring does not replace psychological care.
- [ ] **For Parents** — information and FAQ sections display; Register Your Student opens the separate form. This page contains no intake form.
- [ ] **Stories & Resources** — empty story/testimonial state is honest, resources say “Coming later,” and Share a story opens Contact.

## Parent registration — http://localhost:5000/public/parent-registration.html

- [ ] Empty submission on each step shows inline errors and focuses the first invalid field; progress and Previous/Next work.
- [ ] Try malformed email, invalid Ethiopian phone, too-short names, empty student/support fields, and multiple title selections. Confirm validation blocks submission and errors are announced.
- [ ] Try each accepted support category exactly: `tutoring`, `mentoring`, `counseling`, and `combined`. Try each communication value: `phone_call`, `telegram`, and `whatsapp`. “Other” title text is retained. Select multiple titles and confirm the page explains that the API accepts one title and blocks submission rather than discarding a selection.
- [ ] Submit one valid disposable registration using a valid test email and phone. Success should appear only after a real `201`, include the new record ID, and resist double submission.
- [ ] With network disconnected, submit and confirm a friendly error with no false success. Restore the connection. Repeat while the server is stopped, then restart it.
- [ ] Check the development mail behavior: with `EMAIL_HOST` unset and Ethereal unavailable, the row remains saved, the response succeeds, and messages are logged offline as described in README.
- [ ] Confirm the visible Google Form English introduction and Next Steps copy. Exact Amharic intro text still needs the owner-provided transcription. The Google Form permits multiple title checkboxes while the current API stores one string; current page validation prevents silent loss. To support multi-select, change the API field to an array and store it in a `text[]` column.

Example SQL after a valid test registration (replace the email with the submitted address):

```sql
SELECT id, parent_name, email, child_name, grade_level, subjects,
       support_category, status, created_at
FROM parent_registrations
WHERE email = 'your-test-address@example.com'
ORDER BY id DESC
LIMIT 1;

SELECT notification_type, recipient, recipient_role, related_entity_id,
       status, error_message, created_at
FROM notification_log
WHERE related_entity_type = 'parent_registrations'
  AND related_entity_id = (
    SELECT id FROM parent_registrations
    WHERE email = 'your-test-address@example.com'
    ORDER BY id DESC LIMIT 1
  )
ORDER BY id;
```

## Mentor application — http://localhost:5000/public/become-a-mentor.html

- [ ] Empty steps show validation and focus the first error; progress/back/next work.
- [ ] Test invalid phone, GPA outside 0–4, entrance result outside its allowed range, short motivation, and unchecked commitment agreement.
- [ ] Submit a valid disposable application with the required fields, availability, subjects, commitment agreement, and referral source.
- [ ] Select a non-PDF transcript, a non-JPG/PNG ID image, and files larger than 5 MB; each must be rejected before upload. Verify selected filenames and clear errors.
- [ ] Upload a valid PDF transcript and JPG or PNG ID photo. Confirm a genuine `201`, returned application reference, and stored document metadata. Try network loss and confirm no false success.

## Contact — http://localhost:5000/public/contact.html

- [ ] Try an empty form, invalid email, and short message. Confirm field-level feedback.
- [ ] Submit one valid disposable message for each supported type: `general`, `parent_support`, `mentor_application`, and `counseling`. Confirm success/reference only after `201`.
- [ ] Disconnect the network and retry; confirm clear feedback and no false success. Check contact, social, and Telegram placeholders for owner confirmation.

## Admin portal — http://localhost:5000/admin/login.html

Seed account for local development: `admin@bilunex.org` / `Admin123!` (or the configured seed override).

- [ ] Empty/invalid credentials show an error; valid seed login opens the dashboard. Logout clears the session.
- [ ] Open an admin URL without a token and with a mentor token; both must redirect to admin login. Expired/invalid API token (401) clears the session.
- [ ] Dashboard counts and failed-notification count load; errors are visible rather than replaced with fake zeros.
- [ ] Parent Registrations: search, status/grade/subject filters, pagination, details disclosure, empty state and loading/error state work.
- [ ] Mentor Applications: status filter/search, details, transcript and ID download using the authenticated endpoint, status change, and accepted-only activation with an initial password work. Confirm download access is audited.
- [ ] Active Mentors shows the applications in onboarding; note this is currently an API-backed proxy, not a dedicated mentor-profile listing.
- [ ] Inquiries: type/status filters, current-page search, message display, pagination and empty/error states work. Status updates are not available in the current API.
- [ ] Support Reports: mentor/student report details, current-page search, pagination and empty/error states work.

## Mentor portal — http://localhost:5000/mentor/login.html

Seed account for local development: `mentor@bilunex.org` / `Mentor123!` (or the configured seed override).

- [ ] Invalid credentials show feedback; valid login opens My Profile. Sign Out clears the session.
- [ ] Open a mentor URL without a token and with an admin token; both must redirect to mentor login. A mentor token must redirect away from admin pages.
- [ ] Profile loads the authenticated account. Save changes to phone, availability, and subject specializations; refresh and confirm persistence.
- [ ] Support Reports lists only this mentor’s own reports. Submit a report with all four required API fields, then reload and confirm it appears. Empty/too-short fields must be rejected. Try network loss and confirm no false success.

## Known API limitations to check against

- Parent-registration and inquiry status mutation routes are not currently exposed.
- Mentor-application, inquiry, and support-report search is limited to the records on the current loaded page; those list APIs do not accept a server-side search term.
- There is no dedicated admin list of mentor profiles; the Active Mentors screen displays applications with `onboarding` status.
