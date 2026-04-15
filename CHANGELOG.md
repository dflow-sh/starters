# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for **released starter snapshots** (Git tags under `starters/v*`). See [docs/releases.md](./docs/releases.md) for tag policy and CalVer options.

## [Unreleased]

### Added

- Release policy documentation (`docs/releases.md`), root changelog, and GitHub release notes config.
- `create-dflow-app` default remote ref: latest `starters/v*` tag via GitHub API when `DFLOW_STARTERS_REF` and `--ref` are unset (fallback: `main` if no matching tags).

## [0.1.0] - TBD

Initial public baseline for the starters monorepo (placeholders—set the date when you tag `starters/v0.1.0`).

### Added

- Starter templates under `starters/` with `dflow.template.json` manifests.
- Generated `registry.json` and `create-dflow-app` bootstrap CLI.

[Unreleased]: https://github.com/dflow-sh/starters/compare/starters/v0.1.0...HEAD
[0.1.0]: https://github.com/dflow-sh/starters/releases/tag/starters/v0.1.0
