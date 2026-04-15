#!/usr/bin/env node
// Aggregates starters/**/dflow.template.json into repo-root registry.json (see docs/registry-v1.md).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getStartersRoot,
  listStarterManifests,
  loadTemplateSchemaValidator,
  validateManifestFile,
} from "./validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_OUT = path.join(REPO_ROOT, "registry.json");
const REGISTRY_SCHEMA_VERSION = "1";

/**
 * @param {Array<{ id: string, manifestPath: string }>} starters
 * @returns {Array<[string, string[]]>}
 */
export function findDuplicateStarterIds(starters) {
  /** @type {Map<string, string[]>} */
  const byId = new Map();
  for (const s of starters) {
    const id = s.id;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(s.manifestPath);
  }
  return [...byId.entries()].filter(([, paths]) => paths.length > 1);
}

/**
 * @param {string} startersRoot
 * @param {import("ajv").ValidateFunction} schemaValidate
 * @param {string} repoRoot
 */
export function buildRegistryObject(startersRoot, schemaValidate, repoRoot) {
  const files = listStarterManifests(startersRoot);
  const errors = [];
  /** @type {Array<{ id: string, path: string, manifestPath: string, manifest: object }>} */
  const starters = [];

  for (const filePath of files) {
    const relManifest =
      path.relative(repoRoot, filePath).split(path.sep).join("/") || filePath;
    const ve = validateManifestFile(filePath, schemaValidate, startersRoot);
    if (ve.length) {
      errors.push({ filePath, messages: ve });
      continue;
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      errors.push({
        filePath,
        messages: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`],
      });
      continue;
    }
    const id = manifest.id;
    if (typeof id !== "string" || !id) {
      errors.push({ filePath, messages: ["missing or invalid id after validation"] });
      continue;
    }
    const starterDir = path.dirname(filePath);
    const relStarter =
      path.relative(repoRoot, starterDir).split(path.sep).join("/") || starterDir;
    starters.push({
      id,
      path: relStarter,
      manifestPath: relManifest,
      manifest,
    });
  }

  if (errors.length) {
    for (const { filePath, messages } of errors) {
      const rel = path.relative(repoRoot, filePath) || filePath;
      console.error(`\n${rel}`);
      for (const line of messages) console.error(`  - ${line}`);
    }
    console.error(
      "\nbuild-registry failed: fix manifests or see docs/manifest-v1.md",
    );
    return null;
  }

  const dupes = findDuplicateStarterIds(starters);
  if (dupes.length) {
    for (const [id, paths] of dupes) {
      console.error(`\nDuplicate starter id "${id}" in:\n${paths.map((p) => `  - ${p}`).join("\n")}`);
    }
    console.error(
      "\nbuild-registry failed: each manifest id must be unique across the repo (see docs/registry-v1.md).",
    );
    return null;
  }

  starters.sort((a, b) => a.id.localeCompare(b.id));

  return {
    registryVersion: REGISTRY_SCHEMA_VERSION,
    starters,
  };
}

function serializeRegistry(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: node build-registry.mjs [--check] [--out path]

Writes registry.json at the repo root by default (committed catalog).
  --check   Fail if the file on disk differs from the generated output (no write).
  --out P   Write to P instead of <repo>/registry.json`);
    process.exit(0);
  }

  const check = args.includes("--check");
  const outIdx = args.indexOf("--out");
  const outPath =
    outIdx >= 0 && args[outIdx + 1] ? path.resolve(args[outIdx + 1]) : DEFAULT_OUT;

  const startersRoot = getStartersRoot();
  const schemaValidate = loadTemplateSchemaValidator();
  const obj = buildRegistryObject(startersRoot, schemaValidate, REPO_ROOT);
  if (!obj) process.exit(1);

  const serialized = serializeRegistry(obj);

  if (check) {
    if (!fs.existsSync(outPath)) {
      console.error(`build-registry --check: missing ${outPath} (run build-registry to generate).`);
      process.exit(1);
    }
    const existing = fs.readFileSync(outPath, "utf8");
    if (existing !== serialized) {
      console.error(
        `build-registry --check: ${path.relative(REPO_ROOT, outPath) || outPath} is out of date; run pnpm run build:registry`,
      );
      process.exit(1);
    }
    console.log("OK — registry.json matches starters/**/dflow.template.json.");
    return;
  }

  fs.writeFileSync(outPath, serialized, "utf8");
  console.log(
    `Wrote ${path.relative(REPO_ROOT, outPath) || outPath} (${obj.starters.length} starter(s)).`,
  );
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runCli();
}
