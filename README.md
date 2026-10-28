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

## 5. Local Setup & "Run Everything" Guide

### Step 5.1: Start PostgreSQL & Create User/Databases

Ensure your local PostgreSQL service is running:

```bash
# On Fedora / RHEL / CentOS:
sudo systemctl start postgresql

# On Ubuntu / Debian:
sudo systemctl start postgresql
```

Open a terminal and connect as the `postgres` superuser to create the dedicated `bilunex` database user and databases:

```bash
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`postgres=#`), execute:

```sql
-- 1. Create the dedicated user
CREATE USER bilunex WITH PASSWORD 'bilunex123';

-- 2. Create the development and test databases
CREATE DATABASE bilunex OWNER bilunex;
CREATE DATABASE bilunex_test OWNER bilunex;

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bilunex TO bilunex;
GRANT ALL PRIVILEGES ON DATABASE bilunex_test TO bilunex;

-- 4. Enable pg_trgm extension and grant public schema ownership in both databases
\c bilunex
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER SCHEMA public OWNER TO bilunex;
GRANT ALL ON SCHEMA public TO bilunex;

\c bilunex_test
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER SCHEMA public OWNER TO bilunex;
GRANT ALL ON SCHEMA public TO bilunex;

\q
```

### Step 5.2: Configure Environment Variables

Copy the template `.env.example` into `server/.env`:

```bash
cp .env.example server/.env
```

Verify the credentials in `server/.env`:

```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://bilunex:bilunex123@localhost:5432/bilunex
TEST_DATABASE_URL=postgresql://bilunex:bilunex123@localhost:5432/bilunex_test
JWT_SECRET=super_secret_jwt_signing_key_replace_in_production
JWT_EXPIRES_IN=1d
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Bilunex Support" <no-reply@bilunex.org>
ADMIN_NOTIFICATION_EMAIL=admin@bilunex.org
CLIENT_URL=http://localhost:5000
```

When `EMAIL_HOST` is blank, development tries Ethereal lazily after the API response is sent. If Ethereal provisioning or SMTP delivery cannot complete within 10 seconds, Bilunex uses offline mode: no email is sent, the full message is logged to the server console, and the attempt is recorded as `logged_not_sent`. Notification failures and timeouts are recorded without delaying intake responses.

### Step 5.3: Run Migrations & Seeds

```bash
cd server
npm run migrate    # Applies migrations sequentially (001 -> 015)
npm run seed       # Populates initial admin user and realistic demo fixtures
```

Default seeded credentials:

- **Admin**: `admin@bilunex.org` | Password: `'Admin123!'`
- **Mentor**: `mentor@bilunex.org` | Password: `'Mentor123!'`

### Step 5.4: Start the Server & Open the App

```bash
npm run dev
```

Open your browser to:

- **Public Portal**: [http://localhost:5000/public/index.html](http://localhost:5000/public/index.html)
- **Admin Portal**: [http://localhost:5000/admin/index.html](http://localhost:5000/admin/index.html)
- **Mentor Portal**: [http://localhost:5000/mentor/login.html](http://localhost:5000/mentor/login.html)

### Development only: reset an admin password

From the repository root, pass the admin email and a new password of at least 12 characters as command-line arguments:

```bash
npm run admin:reset-password -- admin@example.com 'your-new-password'
```

The utility is disabled when `NODE_ENV=production`. It hashes the password with bcrypt cost 12, updates the matching admin account, and prints only a success or failure message. Do not commit passwords or place them in scripts.

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

## 7. Frontend pages and verification

Canonical public pages are `client/public/index.html`, `about.html`, `services.html`, `for-parents.html`, `parent-registration.html`, `become-a-mentor.html`, `stories.html`, and `contact.html`. The admin portal is under `client/admin/`; the mentor portal is under `client/mentor/`. Open each through `http://localhost:5000`, not a static file server.

Use [the page-by-page manual verification checklist](docs/MANUAL-CHECKLIST.md) for responsive widths, public forms, file uploads, portal roles, database checks, and seed logins. From `server/`, run `npm run lint` and `npm test`. The checked-in test suite currently contains 62 tests.

## 8. Environment Variables Reference

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

## 9. Available npm Scripts

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

## 10. Git Branching Strategy & Conventions

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

## 11. Automated Pre-Commit Hooks & CI/CD

- **Husky & lint-staged**: Automatically executes `eslint` and `prettier` on staged files before every `git commit`. If lint errors exist, the commit is safely rejected.
- **GitHub Actions**: Configured under `.github/workflows/ci.yml`. On every `push` and `pull_request` to `main` and `develop`, a clean matrix build runs dependencies installation, linting, formatting checks, and the full test suite.

---

## 12. Detailed Troubleshooting Guide

### 1. Password authentication failed for user "bilunex"

- **Cause**: On Fedora, RHEL, and some Linux distributions, the default `/var/lib/pgsql/data/pg_hba.conf` uses `ident` or `peer` authentication for local socket connections instead of password authentication (`md5` or `scram-sha-256`).
- **Solution**:
  1. Open `pg_hba.conf` as root (e.g. `sudo nano /var/lib/pgsql/data/pg_hba.conf` or `/etc/postgresql/<version>/main/pg_hba.conf`).
  2. Change local lines from `peer`/`ident` to `scram-sha-256` or `md5`:
     ```text
     # "local" is for Unix domain socket connections only
     local   all             all                                     scram-sha-256
     # IPv4 local connections:
     host    all             all             127.0.0.1/32            scram-sha-256
     ```
  3. Reload PostgreSQL: `sudo systemctl restart postgresql`.
  4. Alternatively, connect via TCP by specifying host `localhost` or `127.0.0.1` (`DATABASE_URL=postgresql://bilunex:bilunex123@localhost:5432/bilunex`).

### 2. Permission denied for schema public

- **Cause**: In PostgreSQL 15 and later, public schema permissions have been restricted for security. Non-superusers do not have `CREATE` privilege in the `public` schema by default.
- **Solution**: Connect as the `postgres` superuser and transfer ownership or grant privileges:
  ```bash
  sudo -u postgres psql -d bilunex -c "ALTER SCHEMA public OWNER TO bilunex; GRANT ALL ON SCHEMA public TO bilunex;"
  sudo -u postgres psql -d bilunex_test -c "ALTER SCHEMA public OWNER TO bilunex; GRANT ALL ON SCHEMA public TO bilunex;"
  ```

### 3. Permission denied to create extension "pg_trgm"

- **Cause**: In PostgreSQL, only superusers have permissions to create database extensions like `pg_trgm`. If running migrations as user `bilunex` fails with:
  `ERROR: permission denied to create extension "pg_trgm"`
- **Solution**: Pre-install the extension directly as the `postgres` superuser:
  ```bash
  sudo -u postgres psql -d bilunex -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  sudo -u postgres psql -d bilunex_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  ```

### 4. Bash "!" history event expansion in passwords

- **Cause**: In Bash and Zsh shells, an exclamation mark (`!`) inside double quotes (e.g., `"Admin123!"` or `PASSWORD="bilunex123!"`) triggers interactive history expansion, resulting in:
  `bash: !": event not found`
- **Solution**:
  - Always enclose passwords in **single quotes** (`'bilunex123!'`) in your terminal or scripts.
  - Or escape the exclamation mark with a backslash (`"Admin123\!"`).
  - Or disable history expansion temporarily in your current shell: `set +H`.

### 5. Opening site through VS Code Live Server (Port 5500)

- **Cause**: Opening frontend HTML files directly via VS Code Live Server (`http://127.0.0.1:5500/client/...`) causes origin mismatches against the Express backend on port `5000`. Forms may fail or display warning banners.
- **Symptom**: A prominent yellow warning banner appears at the top of the browser:
  _"You are viewing this site through a local dev server (port 5500). Please open this site at http://localhost:5000 so parent registration and mentor applications save to your database."_
- **Solution**: Stop Live Server and access the site through the running Express server at:
  [http://localhost:5000/public/index.html](http://localhost:5000/public/index.html)

### 6. Configuring Gmail SMTP App Password for real email delivery

- **Cause**: Standard Google account passwords cannot be used directly with SMTP due to Google's 2-Step Verification security policies.
- **Solution**:
  1. Enable **2-Step Verification** on your Google Account (`myaccount.google.com/security`).
  2. Navigate to **Security &rarr; 2-Step Verification &rarr; App passwords**.
  3. Generate a new App Password (select App: "Mail", Device: "Other (Bilunex Dev)"). Google will provide a 16-character token (e.g. `abcd efgh ijkl mnop`).
  4. Configure your `server/.env`:
     ```ini
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=abcdefghijklmnop
     EMAIL_FROM="Bilunex Support" <your-email@gmail.com>
     ADMIN_NOTIFICATION_EMAIL=your-email@gmail.com
     ```
  5. Restart the server (`npm run dev`). All transactional emails will now deliver directly to real inboxes.
  6. Set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_USER` to the Gmail address, and `EMAIL_PASS` to the 16-character app password. Restart the server and submit a test registration. A successful attempt appears in `notification_log` with status `success`; a failed or timed-out attempt is logged without blocking the `201` response.
  7. In development with `EMAIL_HOST` unset, Ethereal is provisioned lazily after the response. When internet access is unavailable, the app switches to offline mode, logs each complete message (recipient, subject, plain text body) in the server console, and writes a `logged_not_sent` row. Offline mode sends no mail. With Ethereal available, preview URLs appear in the console.
