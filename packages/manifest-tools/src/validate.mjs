#!/usr/bin/env node
// Validates every starters/<category>/<id>/dflow.template.json against
// schemas/dflow.template.v1.schema.json and enforces id/category vs path.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schemas/dflow.template.v1.schema.json");

export function getStartersRoot() {
  if (process.env.DFLOW_STARTERS_ROOT) {
    return path.resolve(process.env.DFLOW_STARTERS_ROOT);
  }
  return path.join(REPO_ROOT, "starters");
}

function listStarterManifests(startersRoot) {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name === "dflow.template.json") out.push(p);
    }
  }
  walk(startersRoot);
  return out.sort();
}

function isUnderDir(filePath, root) {
  const rel = path.relative(path.resolve(root), path.resolve(filePath));
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function pathConstraintsForManifest(filePath, startersRoot) {
  if (!isUnderDir(filePath, startersRoot)) return null;
  const rel = path
    .relative(path.resolve(startersRoot), path.resolve(filePath))
    .split(path.sep)
    .join("/");
  const parts = rel.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[2] !== "dflow.template.json") {
    return {
      error: `Manifest must live at starters/<category>/<kebab-id>/dflow.template.json (got path segments: ${parts.join("/")})`,
    };
  }
  const [category, kebabId] = parts;
  return { category, kebabId, expectedId: `${category}/${kebabId}` };
}

function formatAjvErrors(validate) {
  return (validate.errors ?? []).map((e) => {
    const p = e.instancePath || "(root)";
    const msg = e.message ?? "invalid";
    const extra =
      e.params && Object.keys(e.params).length
        ? ` ${JSON.stringify(e.params)}`
        : "";
    return `${p} ${msg}${extra}`.trim();
  });
}

function loadSchemaValidator() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

/**
 * @param {string} filePath
 * @param {import("ajv").ValidateFunction} schemaValidate
 * @param {string} [startersRoot]
 * @returns {string[]}
 */
export function validateManifestFile(filePath, schemaValidate, startersRoot = getStartersRoot()) {
  const errors = [];
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    return errors;
  }

  if (!schemaValidate(data)) {
    errors.push(...formatAjvErrors(schemaValidate));
  }

  const pc = pathConstraintsForManifest(filePath, startersRoot);
  if (pc?.error) errors.push(pc.error);
  if (pc && !pc.error) {
    if (data.category !== undefined && data.category !== pc.category) {
      errors.push(
        `category "${data.category}" must match path starters/${pc.category}/... (directory is "${pc.category}")`,
      );
    }
    if (data.id !== undefined && data.id !== pc.expectedId) {
      errors.push(
        `id "${data.id}" must equal path-derived id "${pc.expectedId}"`,
      );
    }
  }

  return errors;
}

function printErrors(filePath, errors) {
  const rel = path.relative(REPO_ROOT, filePath) || filePath;
  console.error(`\n${rel}`);
  for (const line of errors) console.error(`  - ${line}`);
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: node validate.mjs [--] [dflow.template.json ...]

With no paths, validates every starters/**/dflow.template.json.
With paths, validates only those files (path/id rules apply under starters/ only).`);
    process.exit(0);
  }

  const paths = args.filter((a) => a !== "--");
  const schemaValidate = loadSchemaValidator();
  const startersRoot = getStartersRoot();
  const files =
    paths.length > 0
      ? paths.map((p) => path.resolve(REPO_ROOT, p))
      : listStarterManifests(startersRoot);

  let failed = false;
  for (const file of files) {
    if (!fs.existsSync(file)) {
      printErrors(file, ["File not found"]);
      failed = true;
      continue;
    }
    const errors = validateManifestFile(file, schemaValidate, startersRoot);
    if (errors.length) {
      printErrors(file, errors);
      failed = true;
    }
  }

  if (failed) {
    console.error(
      "\nvalidate:manifests failed: fix dflow.template.json files or see docs/manifest-v1.md",
    );
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("No dflow.template.json files under starters/ — nothing to validate.");
  } else {
    console.log(`OK — validated ${files.length} manifest(s).`);
  }
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runCli();
}
