# node-mongo-api

Node.js REST API (Express + MongoDB) with a declarative Jenkins CI pipeline covering lint, unit tests, integration tests, and security scans.

---

## Project structure

```
node-mongo-api/
├── config/
│   └── jest.config.js          # Jest + jest-junit reporter config
├── src/
│   ├── app.js                  # Express app (no DB connect — testable in isolation)
│   ├── server.js               # Entry point: connects DB then starts server
│   ├── config/database.js
│   ├── controllers/authController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT bearer middleware
│   │   └── errorHandler.js
│   ├── models/User.js
│   ├── routes/auth.js
│   └── validators/authValidator.js
├── test/
│   ├── unit/authController.test.js      # Mocked, no DB
│   └── integration/auth.test.js         # Real MongoDB via MongoMemoryServer
├── reports/                    # JUnit XML output (git-ignored)
├── coverage/                   # LCOV coverage (git-ignored)
├── .env.example
├── .eslintrc.js
├── .gitignore
├── Jenkinsfile
└── package.json
```

---

## Running locally

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
```

### 3. Start the server

```bash
npm run dev        # nodemon (auto-reload)
npm start          # plain node
```

### 4. Test the endpoint

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

---

## Running tests

| Command | What it runs |
|---|---|
| `npm test` | All tests (unit + integration) |
| `npm run test:unit` | Unit tests only (mocked DB) |
| `npm run test:integration` | Integration tests (MongoMemoryServer) |
| `npm run test:coverage` | All tests + LCOV coverage report |
| `npm run lint` | ESLint (fails on warnings) |

JUnit XML reports land in `reports/`. Open `coverage/lcov-report/index.html` for the HTML coverage report.

> **No external MongoDB required for tests.** `mongodb-memory-server` downloads and manages a local `mongod` binary automatically.

---

## Jenkins setup

### Prerequisites on the Jenkins agent

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18 | Use the NodeJS Jenkins plugin or install globally |
| npm | ≥ 9 | Comes with Node 18+ |
| gitleaks | any | `brew install gitleaks` / GitHub releases |
| semgrep | any | `pip install semgrep` |

If `gitleaks` or `semgrep` are absent the pipeline marks the build **UNSTABLE** instead of failing — install them to get hard enforcement.

### Step-by-step

1. **Create a Jenkins credential** for the JWT secret:
   - Navigate to **Manage Jenkins → Credentials → (global)**.
   - Add a **Secret text** credential with ID `JWT_SECRET`.

2. **Create a Pipeline job**:
   - New Item → Pipeline → name it `node-mongo-api`.
   - Under **Pipeline**, choose **Pipeline script from SCM**.
   - Set SCM to **Git**, enter your repo URL.
   - Set **Script Path** to `Jenkinsfile`.
   - Save.

3. **Install required Jenkins plugins** (if not already present):
   - Pipeline
   - JUnit (test result publishing)
   - HTML Publisher (coverage report)
   - Email Extension (failure notifications)
   - NodeJS (optional — manage Node versions per job)

4. **Configure email** (optional):
   - **Manage Jenkins → Configure System → Extended E-mail Notification**.
   - Fill in your SMTP server and default recipients.
   - Update the `to:` address in the `Jenkinsfile` `post { failure { mail ... } }` block.

5. **Run the pipeline** manually first to verify everything passes before adding the webhook.

---

## Adding a GitHub webhook

1. Go to your GitHub repository → **Settings → Webhooks → Add webhook**.
2. Set **Payload URL** to:
   ```
   http://<your-jenkins-host>/github-webhook/
   ```
3. Set **Content type** to `application/json`.
4. Choose **Just the push event** (or add pull request events if desired).
5. Click **Add webhook**.

In Jenkins on the job configuration page, check **GitHub hook trigger for GITScm polling** under **Build Triggers**.

Every push to the repository now triggers the CI pipeline automatically.

---

## Pipeline stages

```
Checkout → Install → Lint → Unit Tests → Integration Tests
       → npm audit → Gitleaks → Semgrep
```

- **Lint** — ESLint with `--max-warnings=0`; any warning fails the build.
- **Unit Tests** — Jest with mocked dependencies; JUnit XML published to dashboard.
- **Integration Tests** — Jest against `MongoMemoryServer`; JUnit XML published.
- **npm audit** — fails on `HIGH` or `CRITICAL` severity.
- **Gitleaks** — fails if secrets are detected in the repo history.
- **Semgrep** — SAST scan using `p/nodejs` and `p/owasp-top-ten` rulesets.

Coverage report (LCOV) is published as an HTML report linked from the job page.
