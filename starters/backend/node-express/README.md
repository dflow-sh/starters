# Node (Express) starter

Minimal **Express 4** API with **`GET /health`** returning JSON `{"status":"ok"}`. This directory is a **standalone** Node app (not a pnpm workspace package), consistent with the starters repo layout: each template under `starters/<category>/<id>/` runs with its native toolchain.

## Requirements

- **Node.js 20+** (LTS; aligned with dFlow CI and `package.json` → `engines.node`)

## Commands

- Install: `npm install`
- Run: `npm start` (or `npm run dev` for `node --watch`)

Default port is **8080** (or `PORT` from the environment), matching `dflow.template.json` `port` and `healthCheck`.

## Deploy on dFlow

1. Use this directory as the app root (or copy it into your repo).
2. Point dFlow at **`dflow.template.json`**: it declares `installCommand`, `buildCommand`, `startCommand`, `port`, and HTTP `healthCheck` for `/health`.

Manifest format: [docs/manifest-v1.md](../../../docs/manifest-v1.md). Deploy walkthrough: [docs/deploy/dflow.md](../../../docs/deploy/dflow.md).

## CI (GitHub Actions)

The starter matrix job in `.github/workflows/starter-matrix.yml` covers this starter as `backend/node-express`:

- **Node:** `actions/setup-node@v4` with **20**.
- **Install:** `npm install`.
- **Build:** none (empty `buildCommand` in the manifest).
- **Smoke:** `npm start` in the background, then poll **`http://127.0.0.1:8080/health`** with `curl` until success or timeout.

Related tracking: [Starter: backend/node-express (official)](https://app.clickup.com/t/86d2nff5v) under [Phase D — Official matrix expansion](https://app.clickup.com/t/86d2nfe4g).
