# dFlow Starters

Public templates for bootstrapping applications you can run and deploy on [dFlow](https://dflow.sh/) ([app.dflow.sh](https://app.dflow.sh/)). This repository is the **single source of truth** for official and community starter layouts, validation, and (over time) a small CLI to copy a starter into a new project—without pulling in private product code from [`dflow-sh/cloud`](https://github.com/dflow-sh).

## Repository map

Target layout (see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add a starter):

```text
starters/
  frontend/
    <kebab-id>/
  backend/
    <kebab-id>/
  fullstack/
    <kebab-id>/
  static/
    <kebab-id>/
packages/
  create-dflow-app/      # bootstrap CLI (planned)
  starter-kit/           # optional shared scripts
  manifest-tools/        # optional validate / registry helpers
.github/
  workflows/
docs/
```

We use `starters/` instead of `apps/` so this repo stays distinct from production `apps/*` layouts in the main cloud monorepo. Each runnable starter lives under `starters/<category>/<kebab-id>/` with its own native toolchain (Node, Python, JVM, Go, etc.); not everything has to be a Node workspace package.

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
