# React (Vite) starter

Minimal React 18 + Vite + TypeScript SPA for static hosting. The production build writes to `dist/` (see `dflow.template.json` → `outputs.staticDir`).

## Local development

- Install: `npm install` or `pnpm install`
- Dev server (HMR): `npm run dev`
- Production build: `npm run build`
- Preview the built app: `npm run preview -- --host 0.0.0.0 --port 4173`

The preview command matches the manifest `startCommand` and CI smoke check (port `4173`, health path `/`).

## Environment variables

Optional variables are listed in `dflow.template.json` under `env` (names and descriptions only — never commit real secrets).

- Copy `.env.example` to `.env` or `.env.local` and adjust values for local dev.
- Only variables prefixed with `VITE_` are exposed to browser code via `import.meta.env`. Do not store API keys or tokens in `VITE_*` variables.

## Deploying on dFlow

1. Run `npm install` and `npm run build` (or use the manifest `installCommand` / `buildCommand`).
2. Point the deployment at the static root `dist/` (see manifest `outputs.staticDir`).
3. Use `npm run preview -- --host 0.0.0.0 --port 4173` (or your platform’s static file server) as the runtime command in production if you are not using a CDN-only static host.

Deploy manifest: `dflow.template.json`.
