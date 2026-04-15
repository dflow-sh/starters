# dFlow Starters

Public templates for bootstrapping applications you can run and deploy on [dFlow](https://dflow.sh/) ([app.dflow.sh](https://app.dflow.sh/)). This repository is the **single source of truth** for official and community starter layouts, validation, and (over time) a small CLI to copy a starter into a new project—without pulling in private product code from [`dflow-sh/cloud`](https://github.com/dflow-sh).

## Repository map

Canonical layout and rationale: [docs/architecture.md](./docs/architecture.md). To add a starter, see [CONTRIBUTING.md](./CONTRIBUTING.md).

```text
starters/
  frontend/
    react-vite/
  backend/
    python-fastapi/
    java-springboot/
  fullstack/
    nextjs/
packages/
  create-dflow-app/       # bootstrap CLI (planned)
  starter-kit/            # optional shared scripts
  manifest-tools/         # optional: validate / registry
.github/
  workflows/
docs/
  architecture.md
```

**Pattern:** `starters/<category>/<kebab-id>/` with `category` ∈ `frontend` | `backend` | `fullstack` | `static`. The folders above are **examples**; `static/<kebab-id>/` follows the same rule.

We use `starters/` instead of `apps/` so this repo stays distinct from production `apps/*` in [`dflow-sh/cloud`](https://github.com/dflow-sh/cloud) (Turborepo-style examples often use `apps/`; we do not). Each runnable starter uses its own native toolchain (Node, Python, JVM, Go, etc.). **Non-Node starters are not required to be pnpm workspace members**—they can live only under `starters/`. Node-based starters may join the root workspace when orchestration lands (pnpm + Turborepo, Phase A).

## Quick links

| Resource | URL |
| --- | --- |
| dFlow product site | https://dflow.sh |
| dFlow dashboard | https://app.dflow.sh |
| Main open-source engine | https://github.com/dflow-sh/dflow |
| Turborepo examples (reference) | https://turborepo.dev/docs/getting-started/examples |
| `turbo prune` (subset / Docker workflows) | https://turborepo.dev/docs/reference/prune |
| Vercel monorepo templates (reference) | https://vercel.com/templates/monorepos |

## Support tiers

- **Official** — Maintained by the dFlow team; covered by CI (install / build / smoke start where applicable) and periodic deploy checks. Intended for production-style samples.
- **Community** — Contributed patterns, **best-effort** review and maintenance. Use with judgment; prefer official starters for critical paths.

## How to scaffold

**Today:** clone this repository if you are contributing or inspecting templates. Copy the starter directory you need into your own project and follow that template’s `README` once published.

**Planned:** `packages/create-dflow-app` (or equivalent) will copy one starter to a new directory so end users do not need the full monorepo. Track progress in the project backlog.

**Deploy:** each starter will ship a `dflow.template.json` manifest (schema and validation land in a dedicated change set). Deploy through the dFlow app using your Git provider integration ([GitHub integration overview](https://docs.dflow.sh/articles/7377791-github-integration)).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for layout rules, conventions, and the PR checklist.

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE).
