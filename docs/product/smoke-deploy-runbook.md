# app.dflow.sh smoke deploys & operations runbook

Operational definition for [Product integration: app.dflow.sh smoke deploys + catalog surface](https://app.clickup.com/t/86d2nff6k) under [Phase E — Docs, product & releases](https://app.clickup.com/t/86d2nfe4j).

## Scope

- **In scope:** Which official starters are smoke-tested on the product, how revisions are pinned (tags), where the public catalog (`registry.json`) is consumed, naming conventions for non-secret test metadata, who owns failures, and how to roll back.
- **Out of scope:** API tokens, passwords, or any credential values. Store those in GitHub Actions secrets, ClickUp secrets, or your vault—not in this repository.

## Official Phase 1 starters (product smoke cohort)

These are the **minimum** templates that must deploy successfully on [app.dflow.sh](https://app.dflow.sh) when the smoke revision is pinned (see below). They align with the epic’s Phase 1 matrix.

| Starter id | Repo subdirectory (`dflow.template.json` root) |
| --- | --- |
| `frontend/react-vite` | `starters/frontend/react-vite` |
| `backend/python-fastapi` | `starters/backend/python-fastapi` |
| `backend/java-springboot` | `starters/backend/java-springboot` |

The expanded CI matrix in `.github/workflows/starter-matrix.yml` may include additional official starters; **product smoke acceptance** for this task is satisfied when the three rows above deploy from the pinned public revision.

## Revision pinning

- **Canonical consumer ref:** a **Git tag** matching `starters/v*` (for example `starters/v0.1.0`), not an arbitrary branch tip.
- **CI gate:** `.github/workflows/dflow-product-smoke.yml` runs install, build, and localhost HTTP smoke for the Phase 1 cohort on:
  - **push** of tags `starters/v*`,
  - **schedule** (weekly; see workflow),
  - **workflow_dispatch** (optional manual ref).
- **Scheduled runs:** Configure repository variable `STARTERS_SMOKE_GIT_REF` to the tag (or SHA) you want validated every week. If unset, the scheduled job defaults to `main` (documented fallback only; production smoke should prefer a tag).

## Canonical `registry.json` URLs

Use these for catalog ingestion (CLI, app, or docs):

| Use case | URL pattern |
| --- | --- |
| **Latest on default branch** | `https://raw.githubusercontent.com/dflow-sh/starters/main/registry.json` |
| **Pinned tag (preferred for product)** | `https://raw.githubusercontent.com/dflow-sh/starters/<tag>/registry.json` |

Replace `<tag>` with `starters/v0.x.y` (or the tag you released). The [`dflow-sh/cloud`](https://github.com/dflow-sh/cloud) dashboard can set `STARTERS_REGISTRY_URL` to one of the above (see that repo’s `.env.example`).

## Test org / project naming (no secrets)

Use **dedicated** non-production workspace metadata for automated or manual smoke deploys so they are easy to find and tear down. Examples (replace with your org’s real names; do not put tokens here):

| Concept | Example pattern |
| --- | --- |
| dFlow org / workspace | `dflow-starters-smoke` |
| Project | `starters-smoke` |
| Application per starter | `smoke-<starter-id slug>` (e.g. `smoke-react-vite`, `smoke-python-fastapi`, `smoke-java-springboot`) |
| Environment | `staging` or `smoke` |

Document the **actual** org and project names your team uses in ClickUp secrets or internal ops docs, not in git.

## Failure alerting owner

- **Primary:** Platform / DX owner on call (see team roster in ClickUp or Slack).
- **Mechanism:** GitHub Actions failure on `dflow-product-smoke` should notify via the org’s standard channel (for example Slack email ingest or GitHub → Slack app). Wire notifications in repository **Actions** settings / organization rules—do not commit webhook URLs containing secrets.
- **Product UI:** If a scheduled deploy fails in the app’s own pipelines, route alerts to the same owner group as other production-adjacent jobs.

## Rollback playbook

1. **Identify last good tag** where `dflow-product-smoke` succeeded for the Phase 1 matrix (GitHub Actions history on tag pushes or dispatch for that ref).
2. **Pin consumers to that tag:** update `STARTERS_SMOKE_GIT_REF`, `STARTERS_REGISTRY_URL`, and any in-app “default starters ref” to the last good `starters/v*` tag.
3. **Redeploy smoke apps:** In app.dflow.sh, redeploy or roll back the three smoke applications to the same Git ref and subdirectory as in the table above.
4. **Fix forward:** Patch `main`, cut a new `starters/v*` tag, and re-run smoke before moving consumers off the rollback tag.

## Related automation & docs

- Phase 1 validation workflow: [`.github/workflows/dflow-product-smoke.yml`](../../.github/workflows/dflow-product-smoke.yml)
- Full starter matrix (CI): [`.github/workflows/starter-matrix.yml`](../../.github/workflows/starter-matrix.yml)
- Registry spec: [`docs/registry-v1.md`](../registry-v1.md)
- Deploy guide: [`docs/deploy/dflow.md`](../deploy/dflow.md)
