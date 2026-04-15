# Java Spring Boot starter

Minimal Spring Boot 3 web app with `/health`. Requires **JDK 17+** (the included Maven Wrapper downloads Maven on first use).

## Commands

- Resolve dependencies: `./mvnw -B -q dependency:resolve` (Windows: `mvnw.cmd -B -q dependency:resolve`)
- Build runnable JAR: `./mvnw -B -q package -DskipTests`
- Run: `java -jar target/app.jar`

Deploy manifest: `dflow.template.json`.
