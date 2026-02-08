# Migration Frontend

A React Router + Vite application for guiding users through migrating a Bluesky/ATProto account and data between Personal Data Servers (PDS). The app integrates with a migration backend ("migrator") and PDS instances, and can be run locally with Docker or directly with Node.

## Overview
- Language: TypeScript (ESM)
- Framework: React + React Router v7 (SSR by default)
- Bundler/Dev: Vite
- Runtime targets:
  - Local dev server (`react-router dev`)
  - Node SSR server for the built app (`react-router-serve`)
  - Docker container used for production deployment
- Package manager: npm (lockfile present)

Key entry points and configs:
- Vite config: `vite.config.ts`
- React Router config: `react-router.config.ts` (SSR enabled)
- Dockerfile for the frontend: `Dockerfile`
- Docker Compose for multi-service local stack: `docker-compose.yaml`
- Docker Compose for front-end connected to Production services: `docker-compose.prod.yaml`

## Requirements
- Node.js 20 (see `.nvmrc`: `v20.19.0`)
- npm 10+
- Optional (for integration and e2e tests):
  - Docker (for running the migrator image and optional services)
  - Rust toolchain if you want to run the ARM64 backend locally via Cargo (see scripts)
  - A modern Chromium/Chrome installation for Puppeteer tests (Jest + Puppeteer)

## Getting Started (local dev)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate types and typecheck (optional but recommended):
   ```bash
   npm run typecheck
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   - The app will be available on http://localhost:5173 (the Dockerfile also exposes this port).

### Environment variables (local)

- `PDS_HOSTNAME` – URL for the (origin/destination) PDS when appropriate (default local: `http://localhost:5577`)
- `PLC_HOSTNAME` – URL for the PLC service (default local: `http://localhost:5555`)
- `MIGRATOR_BACKEND` – URL of the migrator API (default local: `http://localhost:9090`)
- `DEBUG` – Debug namespace for logging (default: `migration-fe`)
- `HOSTNAME` – Public hostname for this app (used in staging/prod)

Notes:
- The end-to-end test passes `destination` and `plc` as URL parameters when opening the app during the flow. You can do the same to point to custom PDS/PLC endpoints for manual testing.
- The Docker Compose setup expects a `.env` file at the repo root for the `frontend` service. See Docker section below.

## Scripts
Defined in `package.json`:
- `npm run dev` – Start React Router dev server
- `npm run dev:test` – Start dev server in test mode
- `npm run build` – Build app (SSR + client)
- `npm start` – Serve the built app with `react-router-serve ./build/server/index.js`
- `npm run typecheck` – Generate React Router types (`react-router typegen`), and run `tsc`
- `npm run test` – Full E2E test flow: concurrently runs test env bootstrap, dev server (test mode), and backend via Docker
- `npm run test:arm64` – Same as above, but runs the backend via Cargo (ARM64-friendly)
- `npm run test:env` – Bootstrap the test environment via `tsx bin/testenv.ts`
- `npm run test:jest` – Run Jest test runner directly
- `npm run test:backend` – Pull and run the migrator backend Docker image
- `npm run test:backend-arm64` – Run the migrator backend from the local `pds-migration` Cargo workspace

## Running with Docker
There are two Docker entry points:

1) Frontend-only image (Dockerfile at repo root)
- Builds a Debian-based image, installs Node via NVM (from `.nvmrc`), installs deps, copies app code, runs `npm run typecheck`, and starts `npm run dev` on port `5173`.
- A pre-requisite is to create a `.npmrc` file setup with a Github Packages token to access `@NorthskySocial` scoped packages (follow these guides for [authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) and [installing](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package) on the same `.npmrc` file).
- Example:
  ```bash
  docker build --secret id=npmrc,src=.npmrc -t migration-fe:latest .
  docker run --rm -p 5173:5173 --env-file ./.env migration-fe:latest
  ```

2) Full stack via Docker Compose (`docker-compose.yaml`)
- Services:
  - `origin` – Bluesky PDS container (bind mounts `./pds/origin`) – requires `pds.env`
  - `destination` – Bluesky PDS container (bind mounts `./pds/destination`) – requires `pds.env`
  - `migrator` – Migration backend (builds from `./pds-migration`)
  - `frontend` – This app (builds from repo root, exposes 5173) – reads `.env` at repo root
  - `proxy` – Caddy reverse proxy (bind mounts `./pds/caddy/...`)
- Bring up services:
  ```bash
  docker compose up --build
  ```
- Ports exposed by default:
  - Frontend: 5173
  - Proxy (Caddy): 80, 443 (and 443/udp)
- TODO: Document expected contents of `./pds/**/pds.env` and any required Caddy config.

3) Local Front-end with Production Backend (`docker-compose.prod.yaml`)
  - Similar to above, but the `migrator` and `PDS` services are not run. Instead, the frontend connects to production services.
  - Bring up:
  - ```bash
    docker compose -f docker-compose.prod.yaml up --build
    ```
  - Front-end is exposed via port 3000

## Tests
- Test framework: Jest + Puppeteer (`jest-puppeteer` preset)
- E2E tests live in `test/` (see `test/e2e.test.ts`). The tests:
  - Spin up an in-process ATProto dev network (origin PDS, PLC)
  - Start the dev server on `http://localhost:5173` in test mode
  - Exercise the migration flow end-to-end (invite code, login, account creation, PLC token, etc.)

Run tests:
```bash
# Default (Docker-based backend)
npm test

# On ARM64 machines (use Cargo-based backend)
npm run test:arm64

# Jest only (helpful for debugging if your env is already running)
npm run test:jest
```

Note:
- `jest-puppeteer.config.js` currently has `headless: false`. For headless CI runs, you may need to override this or set Puppeteer flags via env. TODO: Add docs for CI configuration.

## Project Structure
- `app/` – React Router routes, screens, and app code (SSR by default)
- `public/` – Static assets served by the client
- `test/` – End-to-end tests (Jest + Puppeteer)
- `pds-migration/` – Migration backend (Docker/Cargo workspace)
- `bin/` – Helper scripts (e.g., `bin/testenv.ts`) used in tests
- Config files:
  - `vite.config.ts` – Vite build/dev configuration
  - `react-router.config.ts` – React Router SSR and feature flags
  - `jest.config.js` / `jest-puppeteer.config.js` – Testing configuration
  - `tsconfig*.json` – TypeScript configurations
  - `eslint.config.js` – ESLint configuration
  - `docker-compose.yaml` / `Dockerfile` – Containerization for dev and integration

## Deployment
- Docker image: You can build a production image using the provided `Dockerfile` and deploy it to your hosting provider. The image runs the app in production mode. You can take a look at the `docker-compose.prod.yaml` for an example of running the frontend connected to production services, including expected environment variables. An image is also published to Docker Hub as `northskysocial/migration-fe:main`.
- Node SSR: You can  host the built app using `npm start` which serves `./build/server/index.js`.

## Troubleshooting
- Type generation: If types are missing after dependency changes, run `npm run typecheck`.
- Ports: Ensure 5173 is free before starting dev or Docker.
- PDS/PLC endpoints: During local testing, pass `?destination=...&plc=...` in the URL to point to specific services (as done in tests).

### Logging
The app uses a simple environment-driven logger (`app/util/logger.ts`) that supports levels: `silent`, `error`, `info`, `debug`.

- Defaults:
  - Dev (`npm run dev`): `debug`
  - Prod/Build: `info`
- Control via environment:
  - Client/SSR (Vite): set `VITE_LOG_LEVEL` to one of `silent|error|info|debug`
    - Examples:
      - Local dev: create a `.env` with `VITE_LOG_LEVEL=debug`
      - Docker: `docker run --env-file ./.env -e VITE_LOG_LEVEL=debug ...`

Where to see logs:
- Browser/client: open DevTools Console to see `logger.log/info/debug/error` output.
- SSR (local dev): server logs print to your terminal running `npm run dev`.
- Docker: use `docker logs` or `docker-compose logs` to view container logs. Ensure `VITE_LOG_LEVEL` is set appropriately.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Maintainers/Contributing
- TODO: Add maintainers list, contribution guidelines, and code of conduct if applicable.
