#!/usr/bin/env node
/**
 * Runs create-dflow-app for each registry starter (--source local repo), then
 * installCommand + buildCommand from dflow.template.json.
 *
 * Default: skip starters whose runtimes are missing (so `pnpm run verify:create-dflow-app` succeeds on partial dev machines).
 * Full check: pass --strict or VERIFY_STRICT=1 (fail fast if any runtime is missing).
 */
import { execFileSync, execSync, spawn } from "node:child_process";
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

/** @param {string} javaHome */
function javaHomeWorks(javaHome) {
  if (!javaHome) return false;
  const jav = path.join(javaHome, "bin", "java");
  try {
    execFileSync(jav, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** macOS: JDKs from Temurin/Oracle casks live here even when `java_home` is wrong. */
function darwinScanLibraryJavaVirtualMachines() {
  const root = "/Library/Java/JavaVirtualMachines";
  if (!fs.existsSync(root)) return null;
  const names = fs.readdirSync(root).filter((n) => n.endsWith(".jdk"));
  names.sort((a, b) => b.localeCompare(a, "en"));
  for (const name of names) {
    const home = path.join(root, name, "Contents", "Home");
    if (javaHomeWorks(home)) return home;
  }
  return null;
}

/** macOS: Homebrew `brew install openjdk@17` layout (not always registered with java_home). */
function darwinHomebrewOpenjdkHomes() {
  return [
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
  ];
}

/**
 * When PATH `java` is the macOS stub (or missing), find a JDK via JAVA_HOME,
 * `/usr/libexec/java_home`, `/Library/Java/JavaVirtualMachines`, or Homebrew openjdk paths.
 * @returns {string | null}
 */
function resolvedJavaHomeForVerify() {
  if (javaRuntimeWorks()) return null;

  const fromEnv = process.env.JAVA_HOME?.trim();
  if (fromEnv && javaHomeWorks(fromEnv)) return path.resolve(fromEnv);

  if (process.platform !== "darwin") return null;

  const versions = ["17", "21", "11", ""];
  for (const v of versions) {
    try {
      const args = v ? ["-v", v] : [];
      const home = execFileSync("/usr/libexec/java_home", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .trim()
        .split("\n")[0]
        ?.trim();
      if (home && javaHomeWorks(home)) return home;
    } catch {
      // try next
    }
  }

  const fromLibrary = darwinScanLibraryJavaVirtualMachines();
  if (fromLibrary) return fromLibrary;

  for (const h of darwinHomebrewOpenjdkHomes()) {
    if (javaHomeWorks(h)) return path.resolve(h);
  }

  return null;
}

/**
 * @param {string | undefined} runtime
 * @returns {{ ok: boolean, missing: string[], javaHome: string | null }}
 */
function runtimeSatisfied(runtime) {
  const r = String(runtime || "").toLowerCase();
  if (r === "jvm" || r === "java") {
    if (javaRuntimeWorks()) return { ok: true, missing: [], javaHome: null };
    const home = resolvedJavaHomeForVerify();
    if (home) return { ok: true, missing: [], javaHome: home };
    return {
      ok: false,
      missing: [
        "java (JDK 17+; `java -version` must work — not the macOS stub; or set JAVA_HOME / install Temurin and retry)",
      ],
      javaHome: null,
    };
  }

  const cmds = requiredCommandsForRuntime(runtime);
  if (!cmds) return { ok: true, missing: [], javaHome: null };
  const missing = cmds.filter((c) => !commandOnPath(c));
  return { ok: missing.length === 0, missing, javaHome: null };
}

/** @param {string} preflightBody joined missing-runtime lines */
function darwinInstallHints(preflightBody) {
  if (process.platform !== "darwin") return [];
  const hints = [];
  if (preflightBody.includes("backend/go-gin")) {
    hints.push("  macOS (Go):  brew install go");
  }
  if (preflightBody.includes("java (JDK")) {
    hints.push(
      "  macOS (JDK 17+):  brew install --cask temurin@17   # then open a NEW terminal and run: java -version"
    );
    hints.push(
      "                    (verify also uses JAVA_HOME, java_home, /Library/Java/JavaVirtualMachines, Homebrew openjdk paths)"
    );
    hints.push(
      "                    Still failing? Run:  /usr/libexec/java_home -V   and  ls /Library/Java/JavaVirtualMachines"
    );
  }
  if (preflightBody.includes("python3")) {
    hints.push("  macOS (Python 3):  brew install python@3.12   # or use https://www.python.org/downloads/");
  }
  return hints;
}

/**
 * @param {string} cwd
 * @param {string | string[]} command
 * @param {string} label
 * @param {Record<string, string> | undefined} extraEnv merged over process.env for this step only
 */
function runStep(cwd, command, label, extraEnv) {
  if (command === "" || (Array.isArray(command) && command.length === 0)) {
    return Promise.resolve();
  }

  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;

  return new Promise((resolve, reject) => {
    /** @type {import('node:child_process').ChildProcess} */
    let child;
    if (Array.isArray(command)) {
      child = spawn(command[0], command.slice(1), {
        cwd,
        stdio: "inherit",
        env,
        shell: false,
      });
    } else {
      child = spawn(command, {
        cwd,
        stdio: "inherit",
        env,
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
  const strict =
    argv.includes("--strict") ||
    process.env.VERIFY_STRICT === "1" ||
    process.env.VERIFY_STRICT === "true";

  /** Skip starters when a runtime is missing; strict requires every runtime. */
  const skipMissing = !strict;

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
      const body = lines.join("\n");
      const hints = darwinInstallHints(body);
      console.error(
        [
          "verify-starters: required runtimes are not on PATH:",
          ...lines,
          "",
          ...(hints.length ? ["Common installs:", ...hints, ""] : []),
          "Install the missing tools (see packages/create-dflow-app/README.md).",
          "Default verify skips missing runtimes; you used --strict (or VERIFY_STRICT=1).",
          "To verify only starters this machine supports, run:",
          "  pnpm run verify:create-dflow-app",
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
    const { ok, missing, javaHome } = runtimeSatisfied(s.manifest.runtime);
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
    const jvmEnv =
      javaHome && String(m.runtime || "").toLowerCase() === "jvm"
        ? { JAVA_HOME: javaHome }
        : undefined;
    if (jvmEnv) {
      console.log(`verify-starters: using JAVA_HOME=${javaHome} for Maven (PATH java not used)\n`);
    }

    await runStep(
      dest,
      /** @type {string | string[]} */ (m.installCommand),
      "install",
      jvmEnv
    );
    await runStep(
      dest,
      /** @type {string | string[]} */ (m.buildCommand),
      "build",
      jvmEnv
    );
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
