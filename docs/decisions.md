# Architecture Decision Records (ADRs) - Bilunex

## ADR 001: Monorepo Architecture with Plain Frontend and Express Backend

- **Context**: The project is being developed by a beginner developer in stages. Complex frontend build tooling (Vite, Webpack, React SPA frameworks) adds cognitive overhead and bundler friction.
- **Decision**: Keep client and backend in a unified monorepo. The client uses vanilla HTML5, CSS3 (mobile-first), and modern vanilla JavaScript with no build step. The backend is standard Express.js with PostgreSQL.
- **Consequences**: Fast startup, zero build times for client files, instant inspection in any browser, and simple static serving in development.

---

## ADR 002: Strict Layered Backend Architecture

- **Context**: Codebases frequently deteriorate when database queries, validation, and business logic are mixed inside HTTP route handlers.
- **Decision**: Enforce a strict one-way flow:
  `Route -> Middleware -> Controller -> Service -> Repository -> Database Pool`
  - Controllers never write SQL queries.
  - Repositories never contain business logic.
  - Services coordinate logic and invoke repositories and notification helpers.
- **Consequences**: High testability, clear mental model for a beginner developer, and isolated SQL maintenance.

---

## ADR 003: CommonJS for Node.js Backend

- **Context**: While ESM is supported in newer Node versions, Jest, Supertest, and certain native modules (e.g., bcrypt) can have ESM loader quirks or require Babel / experimental flags.
- **Decision**: Use CommonJS (`require` / `module.exports`) across the Express server.
- **Consequences**: Standard zero-config Jest testing, seamless module imports, and proven stability on Node 24.

---

## ADR 004: Fail-Fast Environment Validation with Zod

- **Context**: Silent missing environment variables (e.g. `JWT_SECRET` or database URLs) cause confusing runtime failures late in request lifecycles.
- **Decision**: Validate all `process.env` properties at startup using a Zod schema in `src/config/env.js`. If any required key is missing or malformed, log clear bulleted instructions and terminate with `process.exit(1)`.
- **Consequences**: Immediate developer feedback when `.env` is unconfigured.

---

## ADR 005: Non-Throwing Asynchronous Notifications (Requirement 13)

- **Context**: If an SMTP server is slow, unreachable, or rejects credentials, throwing an error inside a parent registration or mentor application request would block the user's action and roll back a valid database record.
- **Decision**: All notification functions in `src/services/notification.service.js` are wrapped in an execution block that logs failures with Winston and returns `{ success: false, error }`, never throwing an uncaught exception into the caller.
- **Consequences**: Parent registrations and mentor applications always succeed even if external email networks fail.

---

## ADR 006: Role Separation and Mentor Data Isolation

- **Context**: Admins and mentors perform distinct operations. Safeguarding student support data requires that mentors never see another mentor's caseload or session notes.
- **Decision**: Maintain separate login endpoints (`/admin/auth/login` vs `/mentor/auth/login`) and separate role middleware (`requireAdmin` vs `requireMentor`). In `report.repository.js`, reports are strictly filtered by `mentor_id = $1`.
- **Consequences**: Enforced multi-tenant isolation within the mentor cohort.

---

## ADR 007: Static Serving of Client in Development

- **Context**: Running separate dev servers for frontend and backend requires configuring local proxies and multiple terminal tabs.
- **Decision**: When `NODE_ENV !== 'production'`, Express statically serves `/client` from `app.js` and serves `client/public/index.html` at `/`.
- **Consequences**: Developers only need to run `npm run dev` to access both the frontend website and backend APIs on `http://localhost:5000`.
