# Go (Gin) starter

Minimal [Gin](https://github.com/gin-gonic/gin) HTTP API with a dedicated **`GET /health`** handler (JSON `{"status":"ok"}`). The manifest `healthCheck.path` matches this route directly.

## Requirements

- **Go 1.22+** — Use the same minor version as the dFlow Go deploy image when you know it; this repo’s CI pins **1.22** in `.github/workflows/starter-matrix.yml` so matrix runs stay reproducible.

## Commands

- Download modules: `go mod download`
- Run (dev): `go run .`
- Build binary: `go build -o bin/server .`
- Run (prod-style): `./bin/server`

Default listen port is **8080** unless you set **`PORT`** (matches `dflow.template.json` `port` and `healthCheck`).

## Quality checks

- Tests: `go test ./...`
- Vet: `go vet ./...`

## Deploy on dFlow

1. Use this directory as the app root (or copy it into your repo).
2. Point dFlow at **`dflow.template.json`**: it declares `installCommand`, `buildCommand`, `startCommand`, `port`, and HTTP `healthCheck` for `/health`.

Manifest format is documented in the repo at `docs/manifest-v1.md`.

## CI (GitHub Actions)

The starter matrix job in `.github/workflows/starter-matrix.yml` covers this starter as `backend/go-gin`:

- **Go:** `actions/setup-go@v5` with **1.22** and module cache (`go.sum`).
- **Install:** `go mod download`
- **Verify:** `go test ./...` and `go vet ./...`
- **Build:** `go build -o bin/server .`
- **Smoke:** run `./bin/server` in the background, then poll **`http://127.0.0.1:8080/health`** with `curl` until success or timeout.

Related tracking: [Starter: backend/go-gin (official)](https://app.clickup.com/t/86d2nff5u) under [Phase D — Official matrix expansion](https://app.clickup.com/t/86d2nfe4g).
