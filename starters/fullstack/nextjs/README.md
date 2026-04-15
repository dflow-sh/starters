# Next.js (App Router) starter

Minimal Next.js 15 + TypeScript app using the **App Router**. The home page sets `dynamic = "force-dynamic"` so `/` is rendered on the server per request (SSR-style), not prerendered at build time. The production build emits the framework output under `.next/` (see `dflow.template.json` → `outputs.serverBuildDir`).

## Requirements

- **Node.js 20+** (matches the dFlow starter CI matrix and current Next.js LTS expectations).

## Local development

- Install: `npm install` (first `next dev` or `next build` generates `next-env.d.ts`, which is gitignored like a standard Next.js app)
- Dev server: `npm run dev` (default [http://localhost:3000](http://localhost:3000))
- Production build: `npm run build`
- Production server: `npm run start` (listens on `0.0.0.0:3000` as defined in `package.json`)

## Health check

`GET /api/health` returns JSON `{ "status": "ok" }` with HTTP 200 — this path is wired to the manifest `healthCheck` for CI and deploy probes.

## Environment variables

Optional variables are listed in `dflow.template.json` under `env` (names and descriptions only — never commit real secrets).

- **`PORT`** — Many platforms set this automatically. For a custom production start without editing `package.json`, use `next start -H 0.0.0.0` with `PORT` set instead of the fixed `-p 3000` script if your host requires it.
- **`NEXT_TELEMETRY_DISABLED=1`** — Disable Next.js telemetry in CI (the GitHub Actions starter matrix sets this for `next build`).

## Deploying on dFlow

1. Run `npm install` and `npm run build` (see manifest `installCommand` / `buildCommand`).
2. Treat **`.next/`** (and the application source) as the server bundle inputs for an SSR-style Node deploy; static assets under `.next/static` are part of that tree.
3. Run **`npm run start`** (or `npx next start -H 0.0.0.0 -p <port>`) as the runtime command, aligned with `startCommand` in the manifest.

On **Vercel** or similar, the platform usually runs `next build` and invokes its own Next-optimized start — use their documented start command instead of `npm run start` if it differs.

Deploy manifest: `dflow.template.json`. Walkthrough: [docs/deploy/dflow.md](../../../docs/deploy/dflow.md).
