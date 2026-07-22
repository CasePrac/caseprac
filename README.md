# CasePrac

CasePrac is an open-source, self-hostable platform for automated frontend product challenge evaluation. Developers submit deployment URLs, and CasePrac evaluates them using Playwright for functional correctness, visual screenshot regression, and WCAG accessibility compliance.

---

## System Architecture

CasePrac is built as a TypeScript monorepo powered by `pnpm` and `Turborepo`.

```
caseprac/
├── apps/
│   ├── web/         # Next.js 15 App Router frontend dashboard & catalog
│   ├── api/         # Fastify REST API server (auth, challenges, submissions)
│   └── runner/      # BullMQ background worker running Playwright evaluation jobs
├── packages/
│   ├── shared/      # Shared Zod schemas and RFC 9457 error contracts
│   ├── db/          # Drizzle ORM schema, migrations, and database seeding
│   ├── evaluator/   # SSRF security validator, visual diffing, and axe-core accessibility
│   └── config/      # Shared TypeScript base configuration
└── docker-compose.yml # Self-hosting infrastructure (PostgreSQL, Redis, MinIO)
```

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v11.0.0` or higher
- **Docker & Docker Compose**: For local services (PostgreSQL, Redis, MinIO)

---

## Quickstart (Local Development)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/caseprac/caseprac.git
cd caseprac
pnpm install
```

### 2. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env
```

Default local service ports in `.env`:
- **PostgreSQL**: `localhost:5432` (`caseprac` / `caseprac_password`)
- **Redis**: `localhost:6379`
- **MinIO S3**: `localhost:9000` (`minioadmin` / `minioadmin`)

### 3. Start Infrastructure Services

Launch PostgreSQL, Redis, and MinIO via Docker Compose:

```bash
docker compose up -d
```

### 4. Run Database Migrations & Seed Data

Run Drizzle migrations and seed initial official challenges:

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Server

Start all apps (`web`, `api`, `runner`) in parallel:

```bash
pnpm dev
```

The services will be available at:
- **Web App**: `http://localhost:3000`
- **REST API**: `http://localhost:3001`
- **API Swagger Docs**: `http://localhost:3001/documentation`
- **MinIO Console**: `http://localhost:9001`

---

## Available Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start all monorepo applications in development mode |
| `pnpm build` | Build all workspace packages and Next.js/Fastify bundles |
| `pnpm test` | Run unit and security validation test suites |
| `pnpm lint` | Run code quality linters across all packages |
| `pnpm db:migrate` | Apply database migrations via Drizzle ORM |
| `pnpm db:seed` | Seed initial categories and official challenges |

---

## Evaluation Engine & Security

CasePrac worker nodes run Playwright evaluations in isolated headless browser contexts.

- **SSRF Security Protection**: All submitted deployment URLs pass through socket-level IP address pinning (`packages/evaluator/src/ssrf.ts`) to block requests to private subnets, loopback addresses (`127.0.0.1`, `::1`), link-local IPs (`169.254.x.x`), and internal cloud metadata endpoints (`169.254.169.254`).
- **Visual Regression**: Compares viewport screenshots against official baseline images using `pixelmatch`.
- **Accessibility Scanning**: Audits rendered DOM for WCAG 2.1 AA violations using `@axe-core/playwright`.

---

## Self-Hosting with Docker Compose

To deploy CasePrac on your own server or cloud infrastructure:

```bash
# 1. Clone repository
git clone https://github.com/caseprac/caseprac.git
cd caseprac

# 2. Configure production credentials in .env
cp .env.example .env

# 3. Start full stack in detached mode
docker compose up -d --build
```

---

## License

[GPL-3.0](LICENSE)
