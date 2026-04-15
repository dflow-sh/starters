# Java Spring Boot starter

Minimal Spring Boot 3 API with a dedicated **`GET /health`** handler (JSON `{"status":"ok"}`). This starter uses **Maven** and the **Maven Wrapper** (`./mvnw`) so builds are reproducible without a global Maven install. Future Java starters in this repo should stay on Maven unless we explicitly standardize on Gradle.

We use a plain `/health` route rather than Spring Boot Actuator’s `/actuator/health`, so the app stays small and the manifest `healthCheck.path` matches the code directly.

## Requirements

- **JDK 17+** (LTS, aligned with dFlow CI: Temurin 17 in the starter matrix workflow)

## Commands

- Resolve dependencies: `./mvnw -B -q dependency:resolve` (Windows: `mvnw.cmd -B -q dependency:resolve`)
- Build runnable JAR: `./mvnw -B -q package -DskipTests`
- Run: `java -jar target/app.jar`

Default port is **8080** (`server.port` in `src/main/resources/application.properties`), matching `dflow.template.json` `port` and `healthCheck`.

## Deploy on dFlow

1. Use this directory as the app root (or copy it into your repo).
2. Point dFlow at **`dflow.template.json`**: it declares `installCommand`, `buildCommand`, `startCommand`, `port`, and HTTP `healthCheck` for `/health`.

Manifest format: [docs/manifest-v1.md](../../../docs/manifest-v1.md). Deploy walkthrough: [docs/deploy/dflow.md](../../../docs/deploy/dflow.md).

## CI (GitHub Actions)

The Phase 1 matrix job in `.github/workflows/starter-matrix.yml` covers this starter as `backend/java-springboot`:

- **Java:** `actions/setup-java@v4` with Eclipse Temurin **17** and **`cache: maven`** (dependency cache).
- **Install:** `./mvnw -B -q dependency:resolve` (wrapper is made executable in CI).
- **Build:** `./mvnw -B -q package -DskipTests` → fat JAR `target/app.jar`.
- **Smoke:** start `java -jar target/app.jar` in the background, then poll **`http://127.0.0.1:8080/health`** with `curl` until success or timeout.

Related tracking: [Starter: backend/java-springboot](https://app.clickup.com/t/86d2nff20) (Phase C MVP).
