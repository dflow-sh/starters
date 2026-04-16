# Architecture: dFlow Starters repository

This document locks the **folder layout** and **naming conventions** for [`dflow-sh/starters`](https://github.com/dflow-sh/starters) so contributors and automation add templates consistently. It implements the layout decision from ClickUp ([Define repository layout + naming conventions](https://app.clickup.com/t/86d2nfeyz)), within **Phase A — Foundations** ([phase](https://app.clickup.com/t/86d2nfe33)) of the public starters epic ([epic](https://app.clickup.com/t/86d2nfce8)).

## Goals

- Keep **public templates** separate from the product monorepo ([`dflow-sh/cloud`](https://github.com/dflow-sh/cloud)); do not submodule or couple to private packages.
- Give every starter a **predictable path** and **stable ID** independent of framework version bumps in folder names.
- Allow **multiple runtimes** (Node, Python, JVM, Go, etc.) without forcing a single language toolchain across the tree.
- Reserve the monorepo root for **orchestration** (CI, docs, optional pnpm/Turborepo), not for shipping product code.

## Repository layout

Target structure:

```text
starters/
  frontend/
    react-vite/
    vue-vite/
    angular/
  backend/
    python-fastapi/
    java-springboot/
    go-gin/
    node-express/
  fullstack/
    nextjs/
packages/
  create-dflow-app/       # bootstrap CLI
  starter-kit/            # optional shared scripts
  manifest-tools/         # optional: validate / registry
.github/
  workflows/
docs/
    architecture.md       # this file
```

Illustrative paths above are **examples** of valid starter locations; new starters follow the same `starters/<category>/<kebab-id>/` pattern (see [Naming conventions](#naming-conventions)).

### Why `starters/` instead of `apps/`

Turborepo and many monorepo examples use `apps/` plus `packages/`. The internal cloud monorepo already uses `apps/*` for production applications. This repository uses **`starters/`** so paths are unambiguous: anything under `starters/` is a public template, not a live product app.

### Top-level areas

| Area | Role |
| --- | --- |
| `starters/` | Runnable templates only. Each subdirectory is self-contained with its stack’s normal install/build/run flow. |
| `packages/` | Shared tooling: bootstrap CLI (`create-dflow-app`), optional shared scripts (`starter-kit`), manifest validation/registry helpers (`manifest-tools`). |
| `.github/workflows/` | CI: manifest validation, matrix builds, and related automation (as phases land). |
| `docs/` | Architecture and other repo-level documentation. |

## Naming conventions

- **Path pattern:** `starters/<category>/<kebab-id>/`
- **Category** (fixed set): `frontend` | `backend` | `fullstack` | `static`
- **`kebab-id`:** lowercase ASCII, hyphen-separated, **no version in the folder name** (e.g. `react-vite`, not `react-vite-18`). Bump versions in package metadata or docs, not in the path.
- **JavaScript workspace packages** (when a starter participates in the root JS workspace): prefer `@dflow-starters/<id>` or another org-approved scope—confirm with maintainers before publishing names (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

## Node workspace membership and non-Node starters

**Decision:** Starters **do not** have to be Node/pnpm workspace packages.

- **Python, Java, Go, and other non-Node stacks** live under `starters/<category>/<kebab-id>/` and use their native toolchains (pip, Maven/Gradle, Go modules, etc.). They can remain **outside** any future `pnpm-workspace.yaml` globs.
- **Node-based starters** may be included in the root workspace when `pnpm` + `turbo.json` land ([Phase A](https://app.clickup.com/t/86d2nfe33)), so CI can orchestrate install/build in one graph—but that is **orchestration**, not a requirement that every template be Node.

This matches the epic non-goal: *no requirement that every starter is a Node workspace package*.

### Turborepo graph and polyglot exclusions

Root [pnpm-workspace.yaml](../pnpm-workspace.yaml) includes **only** `packages/*`. **`starters/` is not a workspace glob** so templates are not forced into the Node install graph: Python, JVM, Go, and other stacks stay standalone under `starters/<category>/<kebab-id>/` with their native toolchains.

[Turborepo](https://turborepo.dev/docs) schedules tasks from **workspace packages** that expose matching `package.json` scripts. A `turbo run build` (or `lint` / `test`) run only includes packages that define those scripts; folders outside the pnpm workspace—most polyglot starters today—**do not appear** in that task graph at all. They are not “skipped” as empty tasks; they are invisible to Turbo until (if ever) a Node-based starter is intentionally added as a workspace member under `packages/*` or via a future `starters/*` glob for JS-only templates.

**Implication:** orchestration for Java / Go / Python / etc. belongs in **CI matrix jobs** (install, build, smoke) and in **manifest validation** ([`@dflow-starters/manifest-tools`](../packages/manifest-tools)), not in `turbo run build` edges. When a starter ships as a real workspace package, configure [task `outputs`](https://turborepo.dev/docs/reference/configuration#outputs) (e.g. `dist/**`, `.next/**`) and `dependsOn` (e.g. `^build`) like the main product monorepo; use [globalEnv](https://turborepo.dev/docs/reference/configuration#globalenv) / [globalDependencies](https://turborepo.dev/docs/reference/configuration#globaldependencies) in [turbo.json](../turbo.json) for shared env and lockfile/schema inputs.

## Deploy contract (manifest)

Every starter includes a **`dflow.template.json`** at its root (v1). The manifest describes how dFlow installs, builds, and runs the template—commands, port, health check (if applicable), static output directory (if SPA), **environment variable names only** (no secrets), tags, display name, language, and framework metadata. Field definitions and examples: [manifest-v1.md](./manifest-v1.md) ([schema task](https://app.clickup.com/t/86d2nfez3)); [CONTRIBUTING.md](../CONTRIBUTING.md) summarizes contributor expectations.

## Single source of truth for “what exists”

The list of starters matches a **registry** derived from `starters/**/dflow.template.json`: repo-root `registry.json` is generated with `pnpm run build:registry` and checked in CI with `pnpm run check:registry`. Shape and duplicate-id rules: [registry-v1.md](./registry-v1.md).

## Relationship to Phase A (Foundations)

[Phase A — Foundations](https://app.clickup.com/t/86d2nfe33) adds, among other items: public repo + governance, **this layout**, `dflow.template.json` v1 + JSON Schema + validator, and root **pnpm + turbo.json (orchestration only)**. Layout and naming here are stable; tooling files may appear in the tree as those tasks complete.

## Verification (contributor walkthrough)

A new contributor should be able to answer **“Where do I add a starter?”** in under two minutes: open this doc or the root README **Repository map**, pick `starters/<category>/<kebab-id>/`, and follow [CONTRIBUTING.md](../CONTRIBUTING.md).

## References

- [Turborepo examples](https://turborepo.dev/docs/getting-started/examples)
- [`turbo prune`](https://turborepo.dev/docs/reference/prune) (subset / Docker workflows for workspace packages)
- [Vercel monorepo templates](https://vercel.com/templates/monorepos) (reference patterns)
