# Starters repo releases

This document defines how [dflow-sh/starters](https://github.com/dflow-sh/starters) is versioned, tagged, and consumed by tooling (including [`create-dflow-app`](../packages/create-dflow-app/README.md)).

## Goals

- Public consumers get **reproducible snapshots**: copy templates from a **named Git ref**, not from a moving branch tip.
- Product smoke tests and the CLI can **pin** the same ref (see [smoke deploy runbook](./product/smoke-deploy-runbook.md)).

## Tag format

Release tags for template snapshots use the prefix **`starters/v`** followed by a version identifier:

| Style | Example tag | When to use |
| --- | --- | --- |
| **SemVer** | `starters/v0.1.0` | Default for template releases; familiar for CLI and docs. |
| **CalVer** | `starters/v2026.4.15` | Allowed when you want calendar-based template drops (`YYYY.M.D` or `YYYY.MM.patch` as in your planning). |

Only one line of tags is supported for “latest stable template” resolution: names **must** match `starters/v*`. Do not use undecorated `v1.0.0` for template snapshots—keep the `starters/` prefix so template tags stay distinct from any future repo-wide tags.

## Cutting a release

1. Merge changes on `main` (CI green).
2. Update [CHANGELOG.md](../CHANGELOG.md) for this release (Keep a Changelog sections).
3. Create an annotated tag on the commit you want to ship:
   - `git tag -a starters/v0.2.0 -m "starters v0.2.0"`
4. Push the tag: `git push origin starters/v0.2.0`.
5. On GitHub, open **Releases → Draft a new release**, choose the tag, and use the [release notes template](../.github/release.yml) (auto-generated notes + manual summary).

## CLI default ref

[`create-dflow-app`](../packages/create-dflow-app/README.md) uses this precedence for the Git ref used with **remote** copies and the default registry URL:

1. **`--ref`** if passed.
2. **`DFLOW_STARTERS_REF`** if set to a non-empty value.
3. Otherwise: **latest `starters/v*` tag** from the GitHub API (newest by numeric segments), or **`main`** if no such tags exist yet.

Optional: set **`GITHUB_TOKEN`** or **`GH_TOKEN`** for a higher GitHub API rate limit when resolving the default tag.

## Registry and product URLs

Pinned consumers should use `registry.json` at:

`https://raw.githubusercontent.com/dflow-sh/starters/<ref>/registry.json`

Replace `<ref>` with a `starters/v*` tag (preferred) or a SHA. See [registry v1](./registry-v1.md) and the [smoke deploy runbook](./product/smoke-deploy-runbook.md).

## Related ClickUp

- Task: [Release engineering: versioning, tags, and changelog](https://app.clickup.com/t/86d2nff6g)
- Phase: [Phase E — Docs, product & releases](https://app.clickup.com/t/86d2nfe4j)
- Epic: [Public dFlow Starters monorepo](https://app.clickup.com/t/86d2nfce8)
