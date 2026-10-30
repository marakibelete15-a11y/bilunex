# Bilunex redesign progress

## Content update — About Us story

**Status:** done

- Replaced the Our Story placeholder with the exact supplied “Why Bilunex Began” copy, preserving paragraph breaks; the opening paragraph is larger and the closing line is styled as a quiet pull-quote.
- Kept the Mission, Vision and Values, Our Approach, Our Commitment, and three principles unchanged. The new story’s vision paragraph overlaps conceptually with the existing “Our vision” card; both remain as instructed.
- `npm run lint` passes; `npm test` passes (66 tests across 7 suites).

## Content update — Home introduction

**Status:** done

- Replaced the Home introduction body with only the two supplied story sentences and added the “Read our story” About page link.
- `npm run lint` passes; `npm test` passes (66 tests across 7 suites).

## Content update — For Parents FAQ

**Status:** done

- Replaced the FAQ items with the 11 supplied questions and answers in their supplied order, using native `details`/`summary` disclosures. Linked only existing answer wording to Contact and Parent Registration pages.
- The requested conflict audit is still in progress; unchanged conflicting copy is listed in the handoff report before asking for the owner’s decision.
- `node --test client/tests/header-layout.test.cjs`, `npm run lint`, and `npm test` pass.

## Footer layout and contrast

**Status:** done

- All footer text links render in separate list items. “Share Your Story” is in Quick links; “Mentor portal login” is in a separate For mentors group.
- Footer link targets have a minimum 44px height. At widths 320, 768, and 1440px, Chrome reported no horizontal overflow; all 12 text links were in list items and tap-height CSS was 44px.
- Footer text contrast against `#0b1329` is at least 7.19:1 for the muted color `#94a3b8`; link colors `#cbd5e1` / `#e2e8f0` measure 12.41:1 / 14.95:1. Hover gold `#f0d08e` measures 12.39:1.
- Added a footer regression test alongside existing checks for exactly one registration CTA and seven nav items.
- `node --test client/tests/header-layout.test.cjs`, `npm run lint`, and `npm test` pass.

## FAQ consistency audit and responsive verification

**Status:** audit complete; owner decision requested for listed copy

- Left every prior claim unchanged. Claims to review before publication:
  - `client/js/pages/home.js:14`: “Our team evaluates the submission within 24 hours to understand the student's developmental needs and alignment with the Bilunex growth framework.” This is a specific 24-hour review promise; the new FAQ answer 3 describes review/contact and says registration does not guarantee immediate placement, without promising a response time.
  - `client/public/for-parents.html:52-53`: “Our team reviews the submission within 24 hours to evaluate student developmental needs and alignment with the Bilunex growth framework.” Same timing promise in the process section; FAQ answer 3 omits the timing.
  - `client/public/parent-registration.html:45-46`: “We will contact you within 24 hours to finalize the registration fee and schedule a Trial Session.” This is the original Google Form Next Steps wording; it is stronger than FAQ answer 3, and adds a trial-session promise not in the FAQ. Preserved as previously instructed.
  - `client/public/for-parents.html:79-81` and `client/public/services.html:47-50`: both state coverage from “Explorers (Grades 1-3) through Achievers (Grades 9-10)” and describe specific subjects. FAQ answer 1 instead says subject and mentor availability depends on current team and service area. These are narrower coverage assertions that should be confirmed together.
  - `client/public/for-parents.html:90-93`: “Mentors undergo rigorous self-evaluation and training” and parents/guardians “are encouraged to be present during sessions.” `client/public/services.html:75-77` also describes mentors as selected through “rigorous self-evaluation standards”; `client/public/become-a-mentor.html:63-64` says screening/orientation is based on “mentor self-evaluation guidelines and curriculum standards.” FAQ answer 2 describes application review and possible interviews/assessments, not this stated selection method. The universal encouragement for parent presence is more specific than FAQ answer 6, which says supervision should be agreed based on age and circumstances.
  - `client/public/services.html:97-100` says counseling is provided by a qualified psychologist and is open to everyone; `client/public/contact.html:50-52` says it focuses on well-being and exam preparation. FAQ answer 9 says Bilunex connects people with appropriately qualified counseling professionals, and appointment availability/nature varies. Confirm whether “psychologist” is a fixed requirement and whether exam preparation is the full or only one counseling focus.
  - The new FAQ answer 5 says fees depend on the service arrangement and are communicated before sessions; the 24-hour Google Form Next Steps above promises fee finalization and a Trial Session. Confirm whether that fixed flow remains current.
- Chrome checked Home, About, and For Parents at 320, 375, 768, 1024, and 1440 CSS px, and effective CSS widths approximating 150% zoom (213, 250, 512, 683, 960 px). No horizontal overflow, page errors, or heading-level jumps were found; each page has one `h1`. The For Parents FAQ opens with keyboard Enter.
- Footer checked at 320, 768, and 1440px; no overflow; all text links are separate list items, with at least 44px target height.
- The full test suite passes (66 tests across 7 suites); lint and the client regression test pass.

## Brand update — hand-drawn Bilunex logo mark

**Status:** Part 1 done

- Created `client/assets/images/logo-mark.svg` as a transparent square SVG. The navy disc, thin gradient ring, warm 12-o’clock glow, and calligraphic monogram are hand-drawn paths with gold gradients and a subtle shadow; there are no raster images, fonts, or external references in the SVG.
- Rendered and compared multiple 640×640 Chrome previews against the supplied reference. Three refinement passes corrected the initial fill rendering, reduced ring weight and adjusted the top bar, narrowed the arch slightly, and tightened/brightened the ring glow.
- Final own-art previews are saved at 640, 128, 48, 32, and 16 px in `docs/brand/previews/`. The reference image is not copied into the repository.
- Visual match: the circle size, mark placement, stem/top bar, bowl, arch, gold palette, and top glow are close. Remaining differences are the source’s photographic texture and embossed material; this version is a clean vector with a manually interpreted ligature.

## Brand update — shared inline logo lockup

**Status:** Part 2 done

- Shared headers, footers, and portal top bars now use the SVG mark fetched from `logo-mark.svg` and inline-cloned so the SVG’s CSS ring and shine animation work. Instance IDs are suffixed so gradients, masks, and clip paths do not collide on a page.
- The logo link is one accessible “Bilunex home” link with the SVG hidden from assistive technology, and “Bilunex” plus “Education · Growth · Opportunity” rendered as real text.
- Public and portal header/footer marks share 52px sizing, compact screens use 44px, and login-card marks use 72px. Sizes are defined centrally in `client/css/layout.css`; no page has a logo-size override.
- Removed the obsolete `client/assets/images/logo.svg`; the monogram lives only in `logo-mark.svg`.

## Brand update — favicon family

**Status:** Part 3 done

- Added a simplified, bolder vector favicon at `client/assets/images/favicon.svg`, with no glow or small decorative details.
- Kept the simplified favicon symbol in the canonical `logo-mark.svg`; `favicon.svg` references that symbol. Generated `favicon-32.png`, `apple-touch-icon.png` (180×180), and `favicon.ico` from the SVG using headless Chrome and ImageMagick.
- Linked the SVG, PNG, Apple touch icon, and ICO on every public, admin, and mentor HTML page.

## Brand update — regression and responsive verification

**Status:** Part 4 done

- Extended `client/tests/header-layout.test.cjs` to assert the inline-SVG lockup has one “Bilunex home” link, no logo `<img>`, real-text wordmark/tagline, unique SVG resource IDs, centrally defined size tokens, exactly seven nav items, one registration CTA, and favicon coverage on every HTML page.
- Chrome checked all nine public pages and both portal login pages at 320, 375, 768, 1024, and 1440px, plus effective CSS widths approximating 150% zoom (213, 250, 512, 683, 960px). No overflow, duplicate IDs, page errors, raster logos, or incorrect logo sizes were found. Public marks are 44px compact / 52px regular; each login page also has a 72px mark.
- With reduced motion enabled, ring and shine animation names are `none`; the logo slot retains fixed dimensions. The SVG mark remains vector at every checked size.
- Replacement: replace `client/assets/images/logo-mark.svg` to update all shared on-page marks and the simplified favicon symbol. Then regenerate `favicon-32.png`, `apple-touch-icon.png`, and `favicon.ico` from `favicon.svg`. If a designer supplies only the full mark, redraw its simplified symbol inside that same SVG before regenerating the raster icons.
- `node --test client/tests/header-layout.test.cjs`, `npm run lint`, and `npm test` pass.

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
- The initial content audit identified several owner-confirmation items. Supplied copy later resolved some of these; see the current launch-confirmation list at the end of this file.
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
- Contact inquiry form now maps `name`, `email`, optional `phone`, `inquiry_type`, and `message` to the inquiry API; contact/Telegram information is placeholder text.
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

### Part 3 — Single source for contact details

**Status:** done

- Added `client/js/config/site-info.js` as the source for email, phone, Telegram, Telegram address, parent support hours, and Hawassa, Ethiopia.
- Shared footer and Contact page render email, phone, Telegram, from the module. Email, phone, and external links use the requested schemes and `noopener noreferrer` on external links.
- Contact page support-hours wording and the supplied parent support and counseling copy are present. Location is set to Hawassa, Ethiopia.

**Next:** Part 4.

### Part 4 — Home process copy

**Status:** done

- Replaced the four “How Bilunex works” step titles and descriptions with the exact supplied copy; initial rendered step matches the interactive content.

**Next:** Part 5.

### Part 5 — About Us copy

**Status:** done

- Replaced the mission, vision, values, three “Support starts with listening” items, and “Our Commitment” description with the exact supplied copy.

**Next:** Part 6.

### Part 6 — Services copy

**Status:** done

- Replaced the three service placeholders with the exact supplied Academic Support, Mentoring & Guidance, and Professional Counseling descriptions. Existing qualified psychologist and counseling/mentoring distinction statements remain.

**Next:** Part 7.

### Part 7 — For Parents copy

**Status:** done

- Replaced the supplied review, consultation, grade/subject coverage, and family information placeholders with the exact supplied copy. Other FAQ placeholders that were outside this part remain tracked for launch review.

**Next:** Part 8.

### Part 8 — Become a Mentor copy

**Status:** done

- Replaced the four specified recruitment copy placeholders with the supplied exact descriptions. Application form and commitment checkbox remain intact.

**Next:** Part 9.

### Part 9 — Contact page

**Status:** done

- Contact page general inquiry links, parent support hours, counseling text, and Telegram link now use the approved copy and the Part 3 site-info module. Inquiry type selector and submission code are unchanged.

**Next:** Part 10.

### Part 10 — Consistency and content integrity audit

**Status:** done

- Grade review: registration uses a free-text grade field; the client validator requires non-empty text, and `server/src/validators/public.validator.js` accepts any non-empty string. `docs/api.md` examples are `Grade 9` and `Middle School`; no Grades 11–12 or Preparatory / Pre-College option or claim was found in client/API validators. The approved page copy consistently states Explorers (Grades 1-3) through Achievers (Grades 9-10). No wording correction or API/database change is indicated.
- Claim review: no client claim of background checks/verification, certified or licensed mentors, guaranteed outcomes, numeric statistics, or named external partners was found. “Qualified psychologist” is retained as directed. Existing “professional mentor” and partner wording appears only in user-provided exact copy. The registration form’s Google Form text says “top university mentors,” “premium academic support,” “elite mentor team,” and registration fee; this copy was supplied by the user and is preserved per the earlier instruction to keep the Google Form intro and Next Steps wording. The fee / response promise remains marked for Bilunex confirmation. Stories pages explicitly state there are no testimonials yet; no testimonial is presented as evidence. No unsupported claim was removed in this audit.
- 24-hour locations: `client/js/pages/home.js` Step 02 (“Our team evaluates the submission within 24 hours…”); `client/public/for-parents.html` Step 02 (“Our team reviews the submission within 24 hours…”); and `client/public/parent-registration.html` Next Steps (“We will contact you within 24 hours…”). The first two describe review; the Google Form Next Steps promise describes contact and is preserved verbatim.

## Verify before launch

- Confirm founding story: `client/public/about.html`.
- Confirm the Google Form response-time, registration-fee, and trial-session commitment: `client/public/parent-registration.html` (its 24-hour Next Steps wording is retained verbatim).
- Confirm mentor commitment terms: `client/public/become-a-mentor.html`.
- Confirm For Parents FAQ answers: subjects/grades, mentor selection, and post-registration response/next steps in `client/public/for-parents.html`.
- Provide exact Amharic registration introduction; marked placeholder remains in `client/public/parent-registration.html`.
- Confirm the listed customer support accounts and hours remain monitored. Location is Hawassa, Ethiopia.
- Contact details currently set from `client/js/config/site-info.js`: `Bilunexmedia@gmail.com`; `+251 93 483 4343`; Telegram `@Bilunexteam`; parent support hours `Monday through Friday, 8:00 AM – 5:00 PM`.
- Current items still marked for Bilunex confirmation:
  - `client/public/about.html`: Bilunex founding story.
  - `client/public/parent-registration.html`: exact Amharic intro transcription; response-time, fee and trial-session commitment confirmation. The supplied English and Next Steps wording remains visible as requested.
  - `client/public/become-a-mentor.html`: applicant commitment terms.
  - `client/public/for-parents.html`: subjects/grades, mentor selection, and post-registration FAQ answers.
  - `server/src/services/notification.service.js` and `docs/SRS.md`: confirmation that the same 24-hour/fee/trial statement in the parent email template may be sent.
  - Contact accounts/hours must remain monitored. The former location placeholder is resolved as Hawassa, Ethiopia.

**Next:** Part 11.

### Part 11 — Verification

**Status:** lint and suite done; browser matrix partial

- `npm run lint` passes.
- `npm test` passes: 62 tests across 6 suites. The first attempt was blocked by sandbox loopback restrictions (`listen EPERM`); after requesting network access for loopback verification, the full suite passed.
- Opened Home and Contact at `http://127.0.0.1:5000`. Home renders the approved initial process copy, and Contact renders the inquiry type selector. This CUA browser session did not initialize the dynamic shared header or contact link labels/hrefs. The browser control surface in this session has no viewport override, so the requested 320/375/768/1024/1280/1440 and zoom 100%/150% matrix, focus ring, horizontal overflow, and browser-console checks could not be completed. Do not treat these browser checks as passed; repeat them in a browser with responsive viewport and console inspection enabled.
- Zoom-specific desktop-nav widths requested in Part 1 (1100/1200/1280/1366 at 100/125/150/200%) were not directly measured. CSS sets the mobile drawer below 1200 CSS px and one-line nav labels at/above 1200 CSS px.
- Contact link schemes and values are implemented through the shared module: `mailto:Bilunexmedia@gmail.com`, `tel:+251934834343`, and `https://t.me/Bilunexteam`. Dynamic DOM behavior requires a successful browser module initialization check before launch.

**Files changed in this follow-up:** `client/css/components.css`, `client/css/layout.css`, `client/js/components/layout.js`, `client/js/config/site-info.js`, `client/js/pages/contact.js`, `client/js/pages/home.js`, `client/js/ui.js`, `client/public/about.html`, `client/public/become-a-mentor.html`, `client/public/contact.html`, `client/public/for-parents.html`, `client/public/index.html`, `client/public/services.html`, and `docs/PROGRESS.md`. Existing uncommitted user change in `client/js/api.js` was not included.

**Remaining grade mismatches:** none found.

**Unsupported claim removals:** none. The Google Form introduction and Next Steps copy remain verbatim; the audit above flags the claims and response/fee promise for owner confirmation where the SRS does not substantiate them.

**Next:** content work complete. Browser responsive and dynamic-link verification remains open for a browser session with viewport and console controls.

## Follow-up fix — Header registration CTA duplication

**Status:** fixed; regression test added

- Root cause: `renderHeader()` created independent desktop and drawer registration anchors. The desktop copy used `.site-header .nav-register-desktop`; the drawer copy used `.nav-register-mobile`. The drawer hide rule had the same selector specificity as the later generic `.btn { display: inline-flex; }` rule in `components.css`, so the latter could override `display: none` when the desktop nav was open.
- Replaced both copies with one CTA anchor appended after `.nav-list` inside the shared nav. The nav is hidden while the mobile drawer is closed; when open, the CTA appears at its bottom. At desktop widths, the same nav is horizontal and the same CTA follows the seven-item list. The hamburger is hidden and nav shown at the shared 1200px breakpoint.
- Added `client/tests/header-layout.test.cjs`, using Node’s built-in test runner and a minimal DOM stub to execute `layout.js`; it checks the seven exact nav labels, one CTA after the list, no CTA in the nav list, and the 1200px CSS breakpoint shared by nav and hamburger. Run with `node --test client/tests/header-layout.test.cjs`.
- `client/js/api.js` remains an existing uncommitted user edit and is not part of this fix.

- `npm run lint` passes; the client regression test passes; full `npm test` passes (62 tests across 6 suites). The first suite run in this turn hit sandbox loopback `EPERM`; after enabling loopback, all tests passed.

**Next:** ready to commit `fix(client): render a single Register Your Student button`.

## User update — Contact channel correction

- Updated the single contact source, footer, Contact page, repository docs, and notification confirmations to use Bilunexmedia@gmail.com, +251 93 483 4343, @Bilunexteam, and Hawassa, Ethiopia. The email, phone and Telegram URLs are generated from site configuration; contact email is shared with server templates from `server/src/config/site-info.js`.
- Removed the two former social platform entries and labels from the contact source and Contact page, and removed their references from checklist and progress text. The remaining messaging channel is Telegram.
- Added optional EMAIL_REPLY_TO support (unset by default), and tests for present/absent behavior. Parent and mentor confirmation messages include the requested contact sentence; their templates still contain reference IDs.
- Verify before launch: monitor the official email Bilunexmedia@gmail.com, Telegram @Bilunexteam, and phone +251 93 483 4343; confirm parent-support coverage Monday through Friday, 8:00 AM – 5:00 PM.

**Part 1 status:** done. `npm run lint` passes; `npm test` passes (63 tests across 6 suites). The first test attempt hit sandbox loopback `EPERM`; after enabling loopback access, all tests passed.

## User update — Counseling scope and language support

- Clarified throughout public copy that professional counseling is open to everyone, including students, families, and adults; the Services page uses the requested full wording. Contact text notes counseling arrangements are being confirmed.
- Added Sidama Afoo (Sidaamu Afoo) alongside Amharic and English in service and parent-registration copy. Mentor expertise will use the expanded subject choices delivered in Part 5.

**Part 2 status:** done. `npm run lint` passes; `npm test` passes (63 tests across 6 suites).

## User update — Banner artwork and logo animation

- Added a shared inline SVG decoration component to all public `.page-hero` banners and the Home hero. It draws original simple learning, science, and counseling icon shapes with low-contrast opacity, blur, and slow drift; decorations are hidden from assistive technology and pointer input, simplified on narrow screens, and animation stops for reduced motion.
- Animated the gold growth line in the shared SVG logo using embedded SVG CSS on first load, with a restrained glow cycle. Hover/focus gently lifts and rotates the image; reduced-motion disables animation. Favicon remains static.

**Part 3 status:** implemented; lint and suite run before commit.

## User update — Shared form notifications

- Added one reusable top-of-page toast in `client/js/ui.js`: polite status for success, alert for errors, close button, 8-second success dismissal paused on hover/focus, and a mobile-friendly layout. Parent registration, mentor application, inquiry, and mentor report no longer show reference IDs on screen; intake still requires a valid HTTP 201 response and record ID. Success resets the form and scrolls to the top. Email templates retain their reference IDs; browser success messages do not.

**Part 4 status:** done; lint passes and full suite passes (63 tests).

## User update — Mentor application form requirements

**Status:** done

- Subjects of expertise now use checkboxes for Mathematics, Biology, English, Chemistry, Physics, Amharic and Sidama Afoo, plus an Other field. Custom entries are trimmed, HTML tags removed, and bounded to 10 entries of at most 50 characters each.
- GPA was renamed to CGPA across form, API, storage, admin details and documentation. The form shows “CGPA out of 4.00”.
- Added required Natural Science/Social Science stream selection. The score field remains optional (as requested, preserving its prior optional status); server validation enforces the matching 700/600 cap and the database has a matching CHECK constraint.
- Available hours are now required selections from Morning, Afternoon and Evening; existing available days remain.
- Transcript and ID photo are required by the form and endpoint. Existing file type, 5 MB and magic-byte checks remain; missing files receive HTTP 400.
- Migration `016_mentor_application_requirements` renames `gpa`, converts stored hour text to selections, adds the stream and constraints. Development data maps to a safe Morning default when its old hour value cannot be interpreted.
- Fixed migration tracking: `npm run migrate` now records applied files, recognizes the existing complete schema as a baseline, skips already-applied migrations, and refuses to replay migrations against an incomplete/unrecognized existing schema. Rollback only applies to migrations recorded as non-baseline.
- Integration coverage includes valid/invalid CGPA, score limits, mandatory files, multipart persistence and notification dispatch.
- `npm run migrate` passed on the existing development database. `npm run lint` passes; the full test suite passes (65 tests).

**Next:** Part 6 — Share Your Story workflow.

## User update — Share Your Story and moderation

**Status:** done

- Added `share-your-story.html` with private name/contact fields, display-name choice, relationship, title, 50–2000 character story input and live counter, three required consent boxes, child privacy reminder and honeypot.
- Added migration 017 and story repository/service/controller/routes. Submissions are sanitized and saved pending; admin alert email includes only a submission ID/review link. Public pagination selects approved, non-deleted records only and returns computed display name, relationship label, title, body and date without private contact details.
- Added authenticated admin list/detail/status moderation, view/update audit events, confirmation prompts with child privacy reminder, Stories menu item and dashboard pending count. No sample public stories are seeded.
- The Stories & Resources page loads approved stories via DOM text nodes with Load more and an honest empty state. Home, Contact and footer link to Share Your Story; main navigation remains unchanged.
- Added integration coverage for pending privacy, admin-only moderation, approval visibility, sanitization, public field exclusion and notification logging.
- Migration 017 applied using `npm run migrate` on both development and isolated test databases. `npm run lint` passes; full test suite passes (66 tests).
- Chrome viewport check covered all public pages at 320, 375, 768, 1024 and 1440 px; 150% zoom was emulated as the corresponding CSS viewport widths. Initial checks found and fixed narrow zoom overflow in Contact, For Parents, Parent Registration, Mentor cards and the admin header.

## Final verification

- **Responsive:** Chrome DOM width checks passed for all nine public pages at 320, 375, 768, 1024 and 1440 CSS pixels, plus narrow effective CSS widths for 150% zoom. The admin Stories page also passed. No horizontal overflow or browser runtime errors were found. Reduced-motion emulation returned zero banner animations; normal mode reported one running banner animation.
- **Database:** migrations 016 and 017 are applied in the local development and test databases. Production still needs `npm run migrate` against its configured database after backup.

- **Part 7 audit:** repository scan found no references to the removed social platforms or their domains. Parent/mentor/inquiry/story manual procedures and SQL row checks are in `docs/MANUAL-CHECKLIST.md`.
