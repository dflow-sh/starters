# Contributing to dFlow Starters

Thanks for helping improve [`dflow-sh/starters`](https://github.com/dflow-sh/starters). This repo holds **public** templates only: do not add private packages, secrets, or coupling to internal `cloud` monorepo code. Do not submodule `dflow-sh/cloud`.

## How to add a starter

1. **Pick the path** — `starters/<category>/<kebab-id>/`
   - **category** (fixed set): `frontend` \| `backend` \| `fullstack` \| `static`
   - **kebab-id**: lowercase, hyphen-separated ASCII, **no version in the folder name** (e.g. `react-vite`, not `react-vite-18`)
2. **Make it self-contained** — the directory should run with that stack’s normal toolchain (npm/pnpm, pip, Maven/Gradle, Go modules, etc.). Java/Go/Python starters may live only under `starters/` and need not join a JS workspace.
3. **Manifest** — add `dflow.template.json` at the starter root per [docs/manifest-v1.md](./docs/manifest-v1.md). Include install/build/start commands, port, health check path (if applicable), static output directory (if SPA), **environment variable names only** (no secrets), tags, display name, language, and framework metadata. Run `pnpm run validate:manifests` and `pnpm run build:registry` (updates [registry.json](./registry.json)) before opening a PR.
4. **Document** — a short `README.md` inside the starter explaining purpose, how to run locally, and deploy notes for dFlow.
5. **Open a PR** — use a focused branch; see checklist below.

## Conventions

- **Naming** — directory = `starters/<category>/<kebab-id>/`. IDs should stay stable across releases; bump versions in package metadata or docs, not in the path.
- **Secrets** — never commit tokens, API keys, or real `.env` values. Use `.env.example` with **dummy values** and document required keys in the manifest and README.
- **Scope** — one starter per folder; avoid sharing production-only internals. Shared scripts may eventually live under `packages/starter-kit/` or similar.
- **JS package naming** (if the starter is part of a workspace): prefer `@dflow-starters/<id>` or another org-approved scope—align with maintainers before publishing names.
- **Official vs community** — label community samples clearly in the PR description; official starters expect stricter review and CI coverage.

## PR checklist

- [ ] Starter path matches `starters/<category>/<kebab-id>/` and naming rules above.
- [ ] No secrets, credentials, or private dependency references.
- [ ] `dflow.template.json` present and passes `pnpm run validate:manifests`.
- [ ] Local `README` explains run and deploy; env vars are names-only with examples.
- [ ] **Official** starters: confirm CI expectations (install / build / smoke) with maintainers before merge.
- [ ] PR description states **official** or **community** tier and links any related tracking issue.
- [ ] Large or behavioral changes discussed in an issue first when appropriate.

## Code review ownership

Pull requests are routed via [CODEOWNERS](./CODEOWNERS) to the **Platform** and **Developer Experience** teams. If GitHub cannot resolve a team handle, ask an org admin to fix team slugs or membership.

## Security

Report vulnerabilities per [SECURITY.md](./SECURITY.md)—do not open public issues for security-sensitive reports.
