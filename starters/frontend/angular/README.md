# Angular starter

Minimal Angular 19 + TypeScript SPA for static hosting. The production client bundle is emitted under `dist/angular/browser/` (see `dflow.template.json` → `outputs.staticDir`).

## Node.js

This starter targets **Active LTS** Node.js. The repo CI uses Node **20** (see the root workflow `env.NODE_VERSION` and this folder’s `.nvmrc`).

Angular 19 expects a supported Node release (see [Angular CLI prerequisites](https://angular.dev/tools/cli/setup#prerequisites), currently **^18.19.1**, **^20.11.1**, or **^22.0.0**). Use an even major (LTS) version for production.

`package.json` includes an `engines` field as a soft compatibility hint.

## Local development

- Install: `npm ci` (or `npm install` when iterating locally without a strict lockfile)
- Dev server (HMR): `npm start` (runs `ng serve`; default `http://localhost:4200/`)
- Production build: `npm run build`
- Preview the built app: `npm run preview` (serves `dist/angular/browser` on port **4173**)

The preview command matches the manifest `startCommand` and CI smoke check (port `4173`, health path `/`).

## Deploying on dFlow

1. Run `npm ci` and `npm run build` (or use the manifest `installCommand` / `buildCommand`).
2. Point the deployment at the static root `dist/angular/browser/` (see manifest `outputs.staticDir`).
3. Use `npm run preview` (or your platform’s static file server) when you need a long-lived process serving the built files.

Deploy manifest: `dflow.template.json`. Walkthrough: [docs/deploy/dflow.md](../../../docs/deploy/dflow.md).
