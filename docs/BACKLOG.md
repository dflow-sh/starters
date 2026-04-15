# Backlog: community starters (Phase F)

This file mirrors **Phase F — Backlog / community** and the “additional community starters” task so contributors can see candidate stacks without pulling ClickUp.

- **Epic:** [Public dFlow Starters monorepo (dflow-sh/starters)](https://app.clickup.com/t/86d2nfce8)
- **Phase F:** [Phase F — Backlog / community](https://app.clickup.com/t/86d2nfe4n)
- **Task:** [Backlog: additional community starters (NestJS, Django, Rails, etc.)](https://app.clickup.com/t/86d2nff6h)

## Phase F scope

Work here is **optional** and follows once the official starter set is stable. It includes patterns such as NestJS, Django, Rails, Docker Compose–only examples, and similar expansions.

**Exit criteria (Phase F):** contribution policy for the **community** tier is documented (see [CONTRIBUTING.md](../CONTRIBUTING.md)); a **promotion path to official** is defined there.

## Candidate starters (non-blocking)

Prioritize with product based on deploy demand. Each addition should follow [CONTRIBUTING.md](../CONTRIBUTING.md), include a valid `dflow.template.json` with `support: "community"` unless promoted, and add or extend CI as maintainers agree.

| Direction | Notes |
| --- | --- |
| `backend/node-nest` | Reference: [Turborepo `with-nestjs`](https://turborepo.dev/docs/getting-started/examples) |
| `backend/python-django` | — |
| `backend/ruby-rails` | — |
| Compose-only example | “with-docker” style; reference [Turborepo examples](https://turborepo.dev/docs/getting-started/examples) |
| Mobile / React Native | Only if dFlow supports that deploy path |

## Deliverables (task)

- Prioritize candidates with product by deploy demand.
- Each starter: CONTRIBUTING checklist, manifest, and a CI job appropriate to its tier.
- Mark **community** in the manifest unless maintainers promote to **official**.

## Verification

**CI policy for community starters** may **not** include full smoke/start parity with official templates; see [Support tiers](../CONTRIBUTING.md#support-tiers) in CONTRIBUTING.
