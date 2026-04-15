#!/usr/bin/env node
/**
 * Runs create-dflow-app for each registry starter (--source local repo), then
 * installCommand + buildCommand from dflow.template.json.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistryFromFile } from "../src/fetch-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const CLI = path.join(PACKAGE_ROOT, "bin/create-dflow-app.mjs");

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
  const registry = loadRegistryFromFile(REPO_ROOT);
  if (!registry.starters.length) {
    console.log("verify-starters: registry has no starters — nothing to do.");
    return;
  }

  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "dflow-starters-verify-"));

  for (const s of registry.starters) {
    const dest = path.join(tmpBase, s.id.replace(/\//g, "__"));
    console.log(`\n--- Verifying ${s.id} → ${dest} ---\n`);
    await runNodeCli([s.id, dest, "--source", REPO_ROOT]);

    const m = s.manifest;
    await runStep(dest, /** @type {string | string[]} */ (m.installCommand), "install");
    await runStep(dest, /** @type {string | string[]} */ (m.buildCommand), "build");
    console.log(`OK — ${s.id}`);
  }

  console.log(`\nverify-starters: all ${registry.starters.length} starter(s) passed install + build.\n`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
