# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture

This is a monorepo with two applications:

- **`src/`** — Express.js backend API (CommonJS, plain JavaScript). Entry point: `src/app.js`. Runs on port 3000.
- **`flamingo-pay-website/`** — Next.js 16 frontend (TypeScript, Tailwind CSS v4, App Router). Runs on port 3001 during development.

The frontend proxies all `/api/*` requests to the Express backend via Next.js rewrites in `flamingo-pay-website/next.config.ts`. Both servers must be running for the full application to work.

### Backend structure (`src/`)

Express app with route/controller/model separation:
- `routes/` — API route definitions
- `controllers/` — Request handler logic
- `models/` — Data models
- `middleware/` — Express middleware
- `config/` — Configuration
- `utils/` — Shared helpers
- `app.js` — App setup, middleware registration, and server start

All backend API routes should be prefixed with `/api/` so the frontend proxy works correctly.

### Frontend structure (`flamingo-pay-website/`)

Next.js App Router with `@/*` path alias mapped to the project root. Pages live in `app/` as `page.tsx` files.

## Commands

### Backend (run from repo root)

- `npm run dev` — Start Express with `--watch` (auto-restart on changes)
- `npm start` — Start Express in production mode
- `npm test` — Run backend tests (`node --test tests/**/*.test.js`)

### Frontend (run from `flamingo-pay-website/`)

- `npm run dev` — Start Next.js dev server (Turbopack)
- `npm run build` — Production build
- `npm run lint` — ESLint (core-web-vitals + typescript configs)

### Running both together

Start the backend first (`npm run dev` from root), then the frontend (`npm run dev` from `flamingo-pay-website/`). Next.js auto-selects port 3001 when 3000 is occupied.

## Environment

Copy `.env.example` to `.env` at the repo root. Key variables: `PORT`, `NODE_ENV`, `DATABASE_URL`.

## Git workflow

This project uses a **feature-branch workflow**. Never commit directly to `main`.

1. **Branch** — Create a descriptive branch from `main` before starting work:
   ```
   git checkout -b feat/short-description
   ```
   Use prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
2. **Commit** — Make small, focused commits on the feature branch.
3. **Push** — Push the branch to `origin`.
4. **Pull request** — Open a PR via `gh pr create` targeting `main`. Include a clear title and description.
5. **Merge** — After review/approval, merge via the PR (squash or merge commit). Do not push directly to `main`.

### Branch protection

- `main` is the production branch. Vercel auto-deploys every push to `main`.
- All changes reach `main` through pull requests only.

## Conventions

- Backend is CommonJS (`require`/`module.exports`), not ESM.
- Frontend is TypeScript with strict mode enabled.
- Frontend uses Tailwind CSS v4 via `@tailwindcss/postcss`.
- Next.js 16 has breaking changes from earlier versions — read `node_modules/next/dist/docs/` before writing frontend code.
