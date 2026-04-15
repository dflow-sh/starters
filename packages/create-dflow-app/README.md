# create-dflow-app

Bootstrap a single starter from [`dflow-sh/starters`](https://github.com/dflow-sh/starters) into a new directory—without cloning the whole monorepo.

## Usage

**Interactive** (TTY only)—pick a template and target folder:

From a clone of this repository (after `pnpm install` at the repo root):

```bash
pnpm exec create-dflow-app
```

When this package is published to npm, `pnpm dlx @dflow-starters/create-dflow-app` will work without cloning the full starters repo.

**List** templates (uses the published registry by default):

```bash
create-dflow-app list
```

**Non-interactive:**

```bash
create-dflow-app frontend/react-vite ./my-app
create-dflow-app frontend/vue-vite ./my-vue-app
```

**Local monorepo** (while developing templates):

```bash
create-dflow-app backend/python-fastapi ./api --source /path/to/starters
```

Ensure `/path/to/starters/registry.json` is up to date (`pnpm run build:registry` at the repo root).

### Options

| Flag | Purpose |
| --- | --- |
| `--source <path>` | Local starters repo root (reads `registry.json`, copies from `starters/`) |
| `--ref <git-ref>` | Branch / tag / commit for **remote** copies (default: `main` or `DFLOW_STARTERS_REF`) |
| `--registry-url <url>` | Full URL to `registry.json` |
| `--registry-base <url>` | Base for `…/<ref>/registry.json` (default: `https://raw.githubusercontent.com/dflow-sh/starters`) |
| `-h`, `--help` | Help |

### Environment

| Variable | Purpose |
| --- | --- |
| `DFLOW_STARTERS_GITHUB_REPO` | `owner/repo` for remote copies (default: `dflow-sh/starters`) |
| `DFLOW_STARTERS_REF` | Default git ref for remote registry + degit |
| `DFLOW_STARTERS_REGISTRY_URL` | Override registry URL |
| `DFLOW_STARTERS_REGISTRY_BASE` | Override registry base URL |

## How copying works (implementation)

- **Remote (default):** Uses [degit](https://github.com/Rich-Harris/degit) to shallow-fetch a subdirectory of the GitHub repo at `--ref`, e.g. `dflow-sh/starters/starters/frontend/react-vite#main`. No full monorepo clone.
- **Local (`--source`):** Copies the starter tree from disk, skipping common artifacts (`node_modules`, `.git`, `dist`, `target`, …).

Post-copy renames in `package.json` / `pyproject.toml` are a possible future improvement; v1 does not rewrite project names.

## Errors and next steps

- Unknown `starter-id`: the CLI prints all ids from the registry and exits with a non-zero status.
- After a successful copy, it prints **install**, **build**, and **start** commands from `dflow.template.json`, plus [dFlow deploy docs](https://docs.dflow.sh/articles/7377791-github-integration).

## Verification (maintainers)

From the monorepo root:

```bash
pnpm --filter @dflow-starters/create-dflow-app run verify
```

This runs `create-dflow-app` for **each** catalog entry, then runs `installCommand` and `buildCommand` from the manifest. Prerequisites:

- **Node + npm** (e.g. `frontend/react-vite`)
- **Python 3 + pip** (`backend/python-fastapi`)
- **JDK 17+** on `PATH` (`backend/java-springboot` uses the Maven Wrapper `./mvnw`; Java is still required)

## References

- Task: [Implement packages/create-dflow-app bootstrap CLI](https://app.clickup.com/t/86d2nff0w)
- Phase: [Phase B — Tooling & CI](https://app.clickup.com/t/86d2nfe34)
