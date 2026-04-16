#!/usr/bin/env node
/**
 * Runs create-dflow-app for each registry starter (--source local repo), then
 * installCommand + buildCommand from dflow.template.json.
 *
 * Strict by default: fails fast if a required runtime binary is missing on PATH.
 * Opt-in: VERIFY_SKIP_MISSING_RUNTIMES=1 or --skip-missing-runtimes to skip those starters.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistryFromFile } from "../src/fetch-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const CLI = path.join(PACKAGE_ROOT, "bin/create-dflow-app.mjs");

/** @param {string} name */
function commandOnPath(name) {
  try {
    const quoted = JSON.stringify(name);
    execSync(
      process.platform === "win32" ? `where ${quoted}` : `command -v ${quoted}`,
      { stdio: "ignore", shell: true }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string | undefined} runtime manifest `runtime` (e.g. go, jvm, python, node)
 * @returns {string[] | null} required executables on PATH, or null if unknown
 */
function requiredCommandsForRuntime(runtime) {
  const r = String(runtime || "").toLowerCase();
  if (r === "go") return ["go"];
  if (r === "python") return ["python3"];
  if (r === "node" || r === "nodejs") return ["node", "npm"];
  return null;
}

/**
 * macOS ships `/usr/bin/java` even without a JDK; `command -v java` passes but Maven fails.
 * A real JDK makes `java -version` exit 0.
 */
function javaRuntimeWorks() {
  try {
    execSync("java -version", { stdio: "ignore", shell: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string | undefined} runtime
 * @returns {{ ok: boolean, missing: string[] }}
 */
function runtimeSatisfied(runtime) {
  const r = String(runtime || "").toLowerCase();
  if (r === "jvm" || r === "java") {
    if (javaRuntimeWorks()) return { ok: true, missing: [] };
    return {
      ok: false,
      missing: ["java (JDK 17+; `java -version` must work — not the macOS stub)"],
    };
  }

  const cmds = requiredCommandsForRuntime(runtime);
  if (!cmds) return { ok: true, missing: [] };
  const missing = cmds.filter((c) => !commandOnPath(c));
  return { ok: missing.length === 0, missing };
}

/**
 * @param {string} cwd
 * @param {string | string[]} command
 * @param {string} label
 */
function runStep(cwd, command, label) {
  if (command === "" || (Array.isArray(command) && command.length === 0)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    /** @type {import('node:child_process').ChildProcess} */
    let child;
    if (Array.isArray(command)) {
      child = spawn(command[0], command.slice(1), {
        cwd,
        stdio: "inherit",
        env: process.env,
        shell: false,
      });
    } else {
      child = spawn(command, {
        cwd,
        stdio: "inherit",
        env: process.env,
        shell: true,
      });
    }
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

/**
 * @param {string[]} args
 */
function runNodeCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`create-dflow-app exited with code ${code}`));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const skipMissing =
    argv.includes("--skip-missing-runtimes") ||
    process.env.VERIFY_SKIP_MISSING_RUNTIMES === "1" ||
    process.env.VERIFY_SKIP_MISSING_RUNTIMES === "true";

  const registry = loadRegistryFromFile(REPO_ROOT);
  if (!registry.starters.length) {
    console.log("verify-starters: registry has no starters — nothing to do.");
    return;
  }

  if (!skipMissing) {
    const lines = [];
    for (const s of registry.starters) {
      const { ok, missing } = runtimeSatisfied(s.manifest.runtime);
      if (!ok) lines.push(`  ${s.id}: missing on PATH → ${missing.join(", ")}`);
    }
    if (lines.length) {
      console.error(
        [
          "verify-starters: required runtimes are not on PATH:",
          ...lines,
          "",
          "Install the missing tools (see packages/create-dflow-app/README.md), or re-run with:",
          "  VERIFY_SKIP_MISSING_RUNTIMES=1 pnpm run verify:create-dflow-app",
          "  pnpm --filter @dflow-starters/create-dflow-app exec node ./scripts/verify-starters.mjs --skip-missing-runtimes",
          "",
        ].join("\n")
      );
      process.exit(1);
    }
  }

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "dflow-starters-verify-"));
  let passed = 0;
  let skipped = 0;

  for (const s of registry.starters) {
    const { ok, missing } = runtimeSatisfied(s.manifest.runtime);
    if (!ok) {
      if (!skipMissing) {
        console.error(`verify-starters: internal error — should have preflighted ${s.id}`);
        process.exit(1);
      }
      console.log(
        `\n--- SKIP ${s.id} (missing on PATH: ${missing.join(", ")}) ---\n`
      );
      skipped += 1;
      continue;
    }

    const dest = path.join(tmpBase, s.id.replace(/\//g, "__"));
    console.log(`\n--- Verifying ${s.id} → ${dest} ---\n`);
    await runNodeCli([s.id, dest, "--source", REPO_ROOT]);

    const m = s.manifest;
    await runStep(dest, /** @type {string | string[]} */ (m.installCommand), "install");
    await runStep(dest, /** @type {string | string[]} */ (m.buildCommand), "build");
    console.log(`OK — ${s.id}`);
    passed += 1;
  }

  if (skipMissing && passed === 0 && skipped > 0) {
    console.error(
      "\nverify-starters: every starter was skipped (no runtimes on PATH).\n"
    );
    process.exit(1);
  }

  const tail =
    skipped > 0
      ? ` (${passed} passed, ${skipped} skipped — missing runtimes)`
      : "";
  console.log(
    `\nverify-starters: all ${passed} starter(s) passed install + build${tail}.\n`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
