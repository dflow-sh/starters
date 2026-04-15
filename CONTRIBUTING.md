# Contributing to dFlow Starters

Thanks for helping improve [`dflow-sh/starters`](https://github.com/dflow-sh/starters). This repo holds **public** templates only: do not add private packages, secrets, or coupling to internal `cloud` monorepo code. Do not submodule `dflow-sh/cloud`.

Program tracking (internal): [Epic: Public dFlow Starters monorepo](https://app.clickup.com/t/86d2nfce8) · [Phase F — Backlog / community](https://app.clickup.com/t/86d2nfe4n).

## Support tiers

Every starter declares a tier in `dflow.template.json` as the required `support` field: `official` or `community` (see [docs/manifest-v1.md](./docs/manifest-v1.md)).

- **Official** — Maintained as part of the supported matrix. CI runs install, build, and smoke/start checks where applicable; the product may run periodic deploy smoke against these templates.
- **Community** — Best-effort contributions. They must still pass manifest validation and meet the same repo hygiene rules (no secrets, self-contained layout). **CI may omit full smoke or deploy-style checks** for community starters; the exact job set is defined in this repo’s workflows and can evolve without treating community templates as first-class product guarantees.

### Promoting community → official

Promotion is not automatic. A starter becomes **official** when maintainers agree to own it and wire it into the same expectations as other official templates: update `support` to `official`, extend CI to cover install/build/smoke as for peer starters, and align any product catalog or smoke-deploy runbooks. Open a PR that states the promotion explicitly and link the discussion or tracking issue.

## How to add a starter

1. **Pick the path** — `starters/<category>/<kebab-id>/`
   - **category** (fixed set): `frontend` \| `backend` \| `fullstack` \| `static`
   - **kebab-id**: lowercase, hyphen-separated ASCII, **no version in the folder name** (e.g. `react-vite`, not `react-vite-18`)
2. **Make it self-contained** — the directory should run with that stack’s normal toolchain (npm/pnpm, pip, Maven/Gradle, Go modules, etc.). Java/Go/Python starters may live only under `starters/` and need not join a JS workspace.
3. **Manifest** — add `dflow.template.json` at the starter root per [docs/manifest-v1.md](./docs/manifest-v1.md). Include install/build/start commands, port, health check path (if applicable), static output directory (if SPA), **environment variable names only** (no secrets), tags, display name, language, framework metadata, and **`support`: `official` or `community`** matching how you are proposing the starter. Run `pnpm run validate:manifests` and `pnpm run build:registry` (updates [registry.json](./registry.json)) before opening a PR.
4. **Document** — a short `README.md` inside the starter explaining purpose, how to run locally, and deploy notes for dFlow.
5. **Open a PR** — use a focused branch; see checklist below.

## Conventions

- **Naming** — directory = `starters/<category>/<kebab-id>/`. IDs should stay stable across releases; bump versions in package metadata or docs, not in the path.
- **Secrets** — never commit tokens, API keys, or real `.env` values. Use `.env.example` with **dummy values** and document required keys in the manifest and README.
- **Scope** — one starter per folder; avoid sharing production-only internals. Shared scripts may eventually live under `packages/starter-kit/` or similar.
- **JS package naming** (if the starter is part of a workspace): prefer `@dflow-starters/<id>` or another org-approved scope—align with maintainers before publishing names.
- **Official vs community** — use the manifest `support` field and state **official** or **community** in the PR description. Official starters get full maintainer review and the stricter CI path; community PRs may merge with lighter automation (see [Support tiers](#support-tiers)).

## PR checklist

- [ ] Starter path matches `starters/<category>/<kebab-id>/` and naming rules above.
- [ ] No secrets, credentials, or private dependency references.
- [ ] `dflow.template.json` present, `support` matches intended tier, and manifests pass `pnpm run validate:manifests`.
- [ ] Local `README` explains run and deploy; env vars are names-only with examples.
- [ ] **Official** starters: CI must cover install / build / smoke like other official starters; confirm with maintainers if anything is nonstandard.
- [ ] **Community** starters: acceptable if CI is limited to validation (and any lightweight checks maintainers add); full smoke is not required by default.
- [ ] PR description states **official** or **community** tier and links any related tracking issue.
- [ ] Large or behavioral changes discussed in an issue first when appropriate.

Optional starter ideas and Phase F scope live in [docs/BACKLOG.md](./docs/BACKLOG.md).

## Code review ownership

Pull requests are routed via [CODEOWNERS](./CODEOWNERS) to the **Platform** and **Developer Experience** teams. If GitHub cannot resolve a team handle, ask an org admin to fix team slugs or membership.

## Security

Report vulnerabilities per [SECURITY.md](./SECURITY.md)—do not open public issues for security-sensitive reports.
