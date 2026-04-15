#!/usr/bin/env node
/**
 * Verifies the validator: schema catches invalid JSON; CLI passes/fails on temp starters trees.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateManifestFile, getStartersRoot } from "./validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schemas/dflow.template.v1.schema.json");
const INVALID_FIXTURE = path.join(
  __dirname,
  "../fixtures/invalid/dflow.template.json",
);
const VALID_FIXTURE = path.join(
  __dirname,
  "../fixtures/valid/dflow.template.json",
);
const validateScript = path.join(__dirname, "validate.mjs");

function loadSchemaValidator() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`validate:manifests:self-test failed: ${msg}`);
    process.exit(1);
  }
}

function main() {
  const schemaValidate = loadSchemaValidator();

  const invalidErrors = validateManifestFile(
    INVALID_FIXTURE,
    schemaValidate,
    getStartersRoot(),
  );
  assert(
    invalidErrors.length > 0,
    "expected invalid fixture to produce at least one error",
  );

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dflow-manifest-selftest-"));
  const starters = path.join(tmp, "starters");
  const starterDir = path.join(starters, "backend", "python-fastapi");
  fs.mkdirSync(starterDir, { recursive: true });
  fs.copyFileSync(VALID_FIXTURE, path.join(starterDir, "dflow.template.json"));

  const envBase = { ...process.env, DFLOW_STARTERS_ROOT: starters };
  const rOk = spawnSync(process.execPath, [validateScript], {
    cwd: REPO_ROOT,
    env: envBase,
    encoding: "utf8",
  });
  assert(
    rOk.status === 0,
    `expected valid temp starters to pass (exit 0), got ${rOk.status}. stderr:\n${rOk.stderr}\nstdout:\n${rOk.stdout}`,
  );

  fs.copyFileSync(INVALID_FIXTURE, path.join(starterDir, "dflow.template.json"));
  const rBad = spawnSync(process.execPath, [validateScript], {
    cwd: REPO_ROOT,
    env: envBase,
    encoding: "utf8",
  });
  assert(
    rBad.status === 1,
    `expected invalid temp manifest to fail (exit 1), got ${rBad.status}. stderr:\n${rBad.stderr}`,
  );

  console.log("validate:manifests:self-test OK");
}

main();
