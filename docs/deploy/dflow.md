# Deploying starters on dFlow

This guide describes how templates in [`dflow-sh/starters`](https://github.com/dflow-sh/starters) are meant to run on [dFlow](https://dflow.sh/) and how **`dflow.template.json`** ties your repo to the platform.

- **Epic:** [Public starters / templates program](https://app.clickup.com/t/86d2nfce8)
- **Phase:** [Phase tracking](https://app.clickup.com/t/86d2nfe4j)
- **Task:** [Author deploy documentation](https://app.clickup.com/t/86d2nff6m)

## What you need

- A **Git** remote the dFlow app can use (today this is commonly **GitHub**; see the integration article below).
- Access to the **dFlow dashboard** at [app.dflow.sh](https://app.dflow.sh).

## Role of `dflow.template.json`

Each runnable starter includes **`dflow.template.json`** at the **root of that template directory** (the same folder as its `package.json`, `go.mod`, `pom.xml`, or equivalent). The file is the **deploy contract**: install and build commands, how to start the app, listen **port**, optional **HTTP health check**, static or server **outputs**, and **environment variable names** (never secrets).

Full field reference, command semantics, and examples: [manifest v1 spec](../manifest-v1.md). Machine-readable schema: [`schemas/dflow.template.v1.schema.json`](../../schemas/dflow.template.v1.schema.json).

## Connect the repository

Use the dFlow app to connect your Git provider and create a deployment that points at the repository (and, in a monorepo, the **subdirectory**) where **`dflow.template.json`** lives.

- **GitHub:** [GitHub integration overview](https://docs.dflow.sh/articles/7377791-github-integration)

## App root and monorepos

- **Single-starter repo:** Put the starter contents at the repository root so **`dflow.template.json`** is at the root.
- **Monorepo or nested layout:** Configure the deploy **root path** to the directory that contains **`dflow.template.json`** for that app (for example `starters/backend/python-fastapi/` when using this repo as a reference).

The manifest **`id`** must still match the path rule in [manifest-v1.md](../manifest-v1.md#path-consistency-rules) when the file lives inside this starters repository.

## Environment variables

Declared names and descriptions live under the manifest’s **`env`** array. Configure real values in the **dFlow app** (or your host’s secret store), not in the template repo. Starter READMEs and any **`.env.example`** files document local development only.

## Validate manifests locally (contributors)

From the starters repo root:

```bash
pnpm install
pnpm run validate:manifests
```

Registry generation and duplicate-id checks: [registry v1](../registry-v1.md) and `pnpm run build:registry` / `pnpm run check:registry`.

## Starter-specific details

Ports, health paths, static **`outputs.staticDir`**, and **`outputs.serverBuildDir`** differ per template. Use the **`README.md`** next to each starter’s **`dflow.template.json`** for exact commands and deploy notes.

## See also

- [Repository architecture](../architecture.md) — layout and naming
- [Root README](../../README.md) — scaffold CLI, support tiers, quick links
- [Product smoke deploy runbook](../product/smoke-deploy-runbook.md) — Phase 1 smoke cohort, tag pinning, rollback, and `registry.json` URLs for app.dflow.sh
