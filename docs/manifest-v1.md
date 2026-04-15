# dflow.template.json manifest (v1)

This document defines **version 1** of the deploy manifest every starter under `starters/<category>/<kebab-id>/` should ship as **`dflow.template.json`** at the template root. It is the contract between templates, CI, and dFlow so install, build, and run behavior is uniform across runtimes.

- **Tracking:** [Specify dflow.template.json schema (v1) + JSON Schema file](https://app.clickup.com/t/86d2nfez3) under [Phase A — Foundations](https://app.clickup.com/t/86d2nfe33).
- **Machine-readable schema:** [../schemas/dflow.template.v1.schema.json](../schemas/dflow.template.v1.schema.json) (JSON Schema draft 2020-12).

## File location and naming

- **Path:** `starters/<category>/<kebab-id>/dflow.template.json`
- **One manifest per starter directory** (the file name is fixed).

## Path consistency rules

Automation and the repo validator enforce:

1. **`category`** must equal the directory segment immediately under `starters/` (e.g. `frontend`).
2. **`id`** must equal `<category>/<kebab-id>` using the same segments as the path (e.g. `frontend/react-vite` for `starters/frontend/react-vite/dflow.template.json`).

This keeps catalog ids stable and unambiguous.

## Field reference

| Field | Required | Type | Description |
| --- | --- | --- | --- |
| `schemaVersion` | yes | string | Must be `"1"` for this spec. |
| `id` | yes | string | Stable id, format `category/kebab-id`, unique in the repo. |
| `displayName` | yes | string | Short human-readable title. |
| `category` | yes | string | One of `frontend`, `backend`, `fullstack`, `static`. |
| `language` | yes | string | Primary language (e.g. `TypeScript`, `Python`). |
| `framework` | yes | string | Primary framework (e.g. `Vite`, `FastAPI`). |
| `runtime` | no | string | One of `node`, `python`, `go`, `jvm`, `static`. |
| `installCommand` | yes | string \| string[] | Shell command string or argv list to install dependencies. |
| `buildCommand` | yes | string \| string[] | Build step; may be `""` or `[]` for interpreted-only templates. Each array element must be non-empty; an empty array is allowed. |
| `startCommand` | yes | string \| string[] | Command to run the app (document dev vs prod in the starter README). |
| `port` | yes | integer | TCP port (1–65535) the app listens on. |
| `healthCheck` | no | object | HTTP health check (see below). |
| `outputs` | no | object | Build outputs; v1 supports `staticDir` for SPAs and optional `serverBuildDir` for SSR / Node server bundles (e.g. Next.js `.next`). |
| `env` | no | array | Declared variables: `name`, `required`, optional `description` — **no values or secrets**. |
| `tags` | yes | string[] | Labels for discovery (non-empty strings). |
| `support` | yes | string | `official` or `community`. |

### Commands

- **String form:** Executed by a shell on the platform (document any assumptions in the starter README).
- **Array form:** Argument vector (no shell); each element is one argument. For `buildCommand`, each element must be non-empty when using an array; the array itself may be empty.

### `healthCheck` (optional)

Object with:

- `type` — must be `"http"`.
- `path` — must start with `/` (e.g. `/health`).
- `expectedStatus` — HTTP status code (100–599).

### `outputs` (optional)

- `staticDir` — Path relative to the starter root for static assets (e.g. `dist`).
- `serverBuildDir` — Path relative to the starter root for server-side build output (e.g. Next.js `.next`).

### `env` (optional)

Each entry:

- `name` (string, required)
- `required` (boolean, required)
- `description` (string, optional)

Never put API keys, tokens, or `.env` file contents in the manifest.

## Examples

### Minimal valid manifest

```json
{
  "schemaVersion": "1",
  "id": "backend/python-fastapi",
  "displayName": "Python FastAPI",
  "category": "backend",
  "language": "Python",
  "framework": "FastAPI",
  "runtime": "python",
  "installCommand": "pip install -r requirements.txt",
  "buildCommand": "",
  "startCommand": "uvicorn main:app --host 0.0.0.0 --port 8000",
  "port": 8000,
  "healthCheck": {
    "type": "http",
    "path": "/health",
    "expectedStatus": 200
  },
  "tags": ["python", "api"],
  "support": "official"
}
```

### Fuller example (frontend SPA + env + outputs)

```json
{
  "schemaVersion": "1",
  "id": "frontend/react-vite",
  "displayName": "React (Vite)",
  "category": "frontend",
  "language": "TypeScript",
  "framework": "Vite",
  "runtime": "node",
  "installCommand": ["pnpm", "install", "--frozen-lockfile"],
  "buildCommand": ["pnpm", "run", "build"],
  "startCommand": ["pnpm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"],
  "port": 4173,
  "healthCheck": {
    "type": "http",
    "path": "/",
    "expectedStatus": 200
  },
  "outputs": {
    "staticDir": "dist"
  },
  "env": [
    {
      "name": "VITE_API_BASE_URL",
      "required": false,
      "description": "Optional base URL for API calls from the browser."
    }
  ],
  "tags": ["react", "vite", "spa"],
  "support": "official"
}
```

## Validation

From the repository root:

```bash
pnpm install
pnpm run validate:manifests
```

This validates every `starters/**/dflow.template.json` against the JSON Schema and checks `id` / `category` against the file path. Repositories with **no** starter manifests yet pass (zero files to check).

Self-test (schema + path rules, including a deliberately invalid fixture):

```bash
pnpm run validate:manifests:self-test
```

Maintainers can point the CLI at a temporary `starters/` tree (for example in tests) by setting **`DFLOW_STARTERS_ROOT`** to an absolute or relative path to the directory that contains category folders (the equivalent of repo-root `starters/`). The JSON Schema file is always loaded from this repository’s `schemas/` directory.

## Versioning

- **v1** is fixed to `schemaVersion: "1"` and this document + `dflow.template.v1.schema.json`.
- Future major versions should introduce a new `schemaVersion` value and a new schema file alongside an updated spec.
