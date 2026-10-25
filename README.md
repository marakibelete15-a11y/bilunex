# Bilunex Platform (Version 1)

> A modular, mobile-first tutoring, mentoring, and counseling support platform designed with high architectural standards for beginner and intermediate developers.

---

## 1. Overview & Stack

Bilunex connects students and parents with academic tutoring, 1-on-1 youth mentorship, and professional counseling care. This repository is organized as a clean, modular monorepo.

### The Stack:

- **Frontend**: Plain HTML5, modern CSS3 (mobile-first, custom properties), and vanilla JavaScript. Zero build steps, zero framework bloat.
- **Backend**: Node.js + Express.js with a strict layered architecture (`route -> middleware -> controller -> service -> repository -> database`).
- **Database**: PostgreSQL (relational storage with parameterized queries in dedicated repositories).
- **Security & Quality**: Helmet, CORS origin restriction, rate limiting, Zod fail-fast validation, Winston logging, ESLint, Prettier, Jest, Supertest, Husky, and lint-staged.

---

## 2. Monorepo Folder Structure

```text
bilunex/
├── client/                      # Vanilla Frontend (Mobile-First)
│   ├── public/                  # Public pages (Home, About, Services, Parents, Mentors, Stories, Contact)
│   ├── admin/                   # Protected Admin UI (Never linked in public navigation)
│   ├── mentor/                  # Mentor Portal (Login, Caseload Profile, Support Report Form)
│   ├── css/                     # Stylesheets (base.css, layout.css, components.css, pages.css)
│   ├── js/                      # Browser scripts (api.js, validation.js, ui.js, auth.js)
│   └── assets/                  # Static assets (images/, icons/, fonts/)
├── server/                      # Backend Express Application
│   ├── src/
│   │   ├── config/              # Environment validation (Zod fail-fast) & PostgreSQL pool
│   │   ├── routes/              # Versioned API routes under /api/v1 (public, admin, mentor)
│   │   ├── controllers/         # HTTP request/response handlers (Never write SQL)
│   │   ├── services/            # Business logic & non-throwing notification service
│   │   ├── repositories/        # ALL SQL queries live here, nowhere else
│   │   ├── middleware/          # auth, requireAdmin, requireMentor, validate, rateLimit, errorHandler
│   │   ├── validators/          # Zod validation schemas
│   │   ├── utils/               # Winston logger & standard response helpers
│   │   ├── app.js               # Express application configuration (separated for testing)
│   │   └── server.js            # Server entry point (env check, DB test, app.listen)
│   ├── database/                # Database migrations, seeds, and runner scripts
│   └── tests/                   # Unit & integration test suites (Jest + Supertest)
├── docs/                        # Architecture & specs (SRS.md, database.md, api.md, decisions.md)
├── .github/workflows/ci.yml     # Automated GitHub Actions CI workflow
├── .env.example                 # Environment variables template
├── .editorconfig                # Consistent editor indentation and whitespace
├── .nvmrc                       # Node version target
├── .prettierrc                  # Prettier code formatting rules
├── eslint.config.js             # Modern ESLint configuration
├── LICENSE                      # MIT Open Source License
└── README.md                    # Project documentation
```

---

## 3. Architecture Rules

1. **Request Lifecycle**:
   $$\text{Route} \longrightarrow \text{Middleware} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{Database}$$
   - **Controllers**: Handle HTTP input and status codes. Never write SQL.
   - **Services**: Contain business rules and invoke notifications.
   - **Repositories**: Encapsulate 100% of SQL queries. Never contain business logic.
2. **API Versioning**: All API endpoints reside under `/api/v1/`.
3. **Role Separation & Multi-Tenancy**:
   - Admins and Mentors use separate login endpoints and role-based middleware (`requireAdmin`, `requireMentor`).
   - A mentor can only view and file reports for their own caseload.
4. **Resilient Notifications (Requirement 13)**:
   - All email notifications are wrapped in safe handlers that **never throw into the caller**. A failed email will be logged via Winston but will never block or roll back a parent registration or mentor application.
5. **Decoupled Application**: `src/app.js` is separated from `src/server.js`, allowing unit and integration tests to run with Supertest without starting network listeners.

---

## 4. Prerequisites

Before setting up the project locally, ensure you have:

- **Node.js**: Version 20+ or 24+ (`node -v`)
- **npm**: Version 10+ (`npm -v`)
- **PostgreSQL**: Installed locally (`psql --version`)

---

## 5. Local Setup Step-by-Step

### Step 5.1: Create Local PostgreSQL Databases & Dedicated User

Open your terminal and connect to your local PostgreSQL instance as the `postgres` superuser:

```bash
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`postgres=#`), run the following SQL commands to create a dedicated user and databases:

```sql
-- 1. Create a dedicated database user
CREATE USER bilunex_user WITH PASSWORD 'bilunex_password';

-- 2. Create the development database
CREATE DATABASE bilunex OWNER bilunex_user;

-- 3. Create the test database for automated test runs
CREATE DATABASE bilunex_test OWNER bilunex_user;

-- 4. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bilunex TO bilunex_user;
GRANT ALL PRIVILEGES ON DATABASE bilunex_test TO bilunex_user;

-- Exit psql
\q
```

### Step 5.2: Configure Environment Variables

Copy the template `.env.example` into `server/.env`:

```bash
cp .env.example server/.env
```

Ensure the database connection strings in `server/.env` match your PostgreSQL credentials:

```ini
DATABASE_URL=postgresql://bilunex_user:bilunex_password@localhost:5432/bilunex
TEST_DATABASE_URL=postgresql://bilunex_user:bilunex_password@localhost:5432/bilunex_test
```

### Step 5.3: Run Database Migrations & Seeds

Populate the database tables and default administrative accounts:

```bash
cd server
npm run migrate    # Creates tables, indexes, and constraints
npm run seed       # Populates default admin and sample mentor
```

Default credentials seeded:

- **Admin**: `admin@bilunex.org` | Password: `Admin123!`
- **Mentor**: `mentor@bilunex.org` | Password: `Mentor123!`

---

## 6. Running the Application

### Development Mode (with Live Reload)

From the repository root or `server/`:

```bash
npm run dev
```

Express will start on port `5000`:

- **Public Website**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Admin Login**: [http://localhost:5000/admin/login.html](http://localhost:5000/admin/login.html)
- **Mentor Portal**: [http://localhost:5000/mentor/login.html](http://localhost:5000/mentor/login.html)

_(In development mode, Express automatically serves the frontend `client/` folder statically)._

### Production Mode

```bash
cd server
npm start
```

---

## 7. Environment Variables Reference

| Variable                   | Description                                  | Example / Default                                            |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `PORT`                     | HTTP server listening port                   | `5000`                                                       |
| `NODE_ENV`                 | Application environment mode                 | `development` / `production` / `test`                        |
| `DATABASE_URL`             | PostgreSQL connection string for development | `postgresql://bilunex_user:pass@localhost:5432/bilunex`      |
| `TEST_DATABASE_URL`        | PostgreSQL connection string for tests       | `postgresql://bilunex_user:pass@localhost:5432/bilunex_test` |
| `JWT_SECRET`               | Secret key for signing authentication tokens | 32+ character random string                                  |
| `JWT_EXPIRES_IN`           | Token validity duration                      | `1d`                                                         |
| `EMAIL_HOST`               | SMTP server host for notifications           | `smtp.mailtrap.io`                                           |
| `EMAIL_PORT`               | SMTP port                                    | `2525`                                                       |
| `EMAIL_USER`               | SMTP username                                | Your SMTP user                                               |
| `EMAIL_PASS`               | SMTP password                                | Your SMTP password                                           |
| `ADMIN_NOTIFICATION_EMAIL` | Destination email for admin alerts           | `admin@bilunex.org`                                          |
| `CLIENT_URL`               | Allowed frontend origin for CORS             | `http://localhost:5000`                                      |

---

## 8. Available npm Scripts

Run from either repo root or inside `server/`:

| Script                 | Command                         | Purpose                                                |
| ---------------------- | ------------------------------- | ------------------------------------------------------ |
| `npm run dev`          | `nodemon src/server.js`         | Starts server with automatic live-reload on file edits |
| `npm start`            | `node src/server.js`            | Starts server in production mode                       |
| `npm run lint`         | `eslint .`                      | Runs ESLint 9 static analysis across JavaScript files  |
| `npm run lint:fix`     | `eslint . --fix`                | Automatically fixes auto-fixable lint issues           |
| `npm run format`       | `prettier --write "**/*"`       | Formats code using Prettier rules                      |
| `npm run format:check` | `prettier --check "**/*"`       | Verifies formatting without altering files             |
| `npm test`             | `jest --runInBand`              | Runs automated unit and integration tests              |
| `npm run test:watch`   | `jest --watch`                  | Runs Jest in interactive watch mode during development |
| `npm run migrate`      | `node database/migrate.js up`   | Executes pending PostgreSQL table migrations           |
| `npm run migrate:down` | `node database/migrate.js down` | Drops all application database tables                  |
| `npm run seed`         | `node database/seed.js`         | Populates database with default admin & sample data    |
| `npm run db:reset`     | `node database/reset.js`        | Resets database (down -> up -> seed)                   |

---

## 9. Git Branching Strategy & Conventions

### Branching Model

- `main`: Production-ready, fully verified stable branch. Direct commits are restricted.
- `develop`: Integration branch where tested features meet before release.
- `feature/<feature-name>`: Topic branches for new capabilities (e.g. `feature/parent-intake`, `feature/mentor-reports`).
- `bugfix/<issue-name>`: Branches addressing specific defects.

### Conventional Commits

All commits must strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

$$\text{<type>}(\text{optional-scope}):\text{ <description>}$$

Common Types:

- `feat`: A new user-facing feature or API endpoint
- `fix`: A bug fix
- `docs`: Documentation updates only
- `style`: Formatting, missing semi-colons, whitespace (no code change)
- `refactor`: Code restructuring without modifying behavior
- `test`: Adding or updating test suites
- `chore`: Build scripts, dependencies, configuration updates

_Example First Commit_:
`chore: initialize project structure`

---

## 10. Automated Pre-Commit Hooks & CI/CD

- **Husky & lint-staged**: Automatically executes `eslint` and `prettier` on staged files before every `git commit`. If lint errors exist, the commit is safely rejected.
- **GitHub Actions**: Configured under `.github/workflows/ci.yml`. On every `push` and `pull_request` to `main` and `develop`, a clean matrix build runs dependencies installation, linting, formatting checks, and the full test suite.
