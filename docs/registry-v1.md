# Starter registry (`registry.json` v1)

Machine-readable catalog of every starter under `starters/<category>/<kebab-id>/`, built from each template’s `dflow.template.json`. Used for discovery (site, CLI, CI) as described in [Phase B — Tooling & CI](https://app.clickup.com/t/86d2nfe34) and [Build starter registry generator](https://app.clickup.com/t/86d2nff0y).

- **JSON Schema:** [../schemas/dflow.registry.v1.schema.json](../schemas/dflow.registry.v1.schema.json)
- **Generator:** `pnpm run build:registry` (writes repo-root `registry.json`)
- **CI drift check:** `pnpm run check:registry` (fails if `registry.json` is not up to date)

## Shape (v1)

Top level:

| Field | Type | Description |
| --- | --- | --- |
| `registryVersion` | string | Must be `"1"`. |
| `starters` | array | One entry per validated manifest, sorted by `id`. |

Each element of `starters`:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Template id (`category/kebab-id`); same as `manifest.id`. |
| `path` | string | Repo-relative directory containing the starter (e.g. `starters/backend/python-fastapi`). |
| `manifestPath` | string | Repo-relative path to `dflow.template.json`. |
| `manifest` | object | Full manifest; must satisfy [manifest v1](./manifest-v1.md) / [dflow.template.v1.schema.json](../schemas/dflow.template.v1.schema.json). |

There is no timestamp field so the committed file stays **deterministic**: the same manifests always produce the same bytes, which keeps `check:registry` stable in CI.

## Duplicate ids

Every `id` must appear at most once in `starters`. The generator fails (exit code 1) if two manifests that pass validation share the same `id`, and prints both `manifestPath` values.

With current path rules (`id` must match the directory), duplicate ids are unlikely in practice, but the check is required so the catalog stays unambiguous if layout or validation rules change.

## Canonical published URLs

For **product** and **CLI** consumption, fetch `registry.json` over HTTPS (pin a `starters/v*` tag in production):

| Ref | URL |
| --- | --- |
| `main` | `https://raw.githubusercontent.com/dflow-sh/starters/main/registry.json` |
| Tag `starters/v0.1.0` (example) | `https://raw.githubusercontent.com/dflow-sh/starters/starters/v0.1.0/registry.json` |

Operational detail (smoke cadence, rollback, alerting): [docs/product/smoke-deploy-runbook.md](./product/smoke-deploy-runbook.md).

## Related docs

- Per-template contract: [manifest-v1.md](./manifest-v1.md)
- Repo overview: [architecture.md](./architecture.md) — registry as single source for “what exists”
