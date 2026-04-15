import fs from "node:fs";
import path from "node:path";

const DEFAULT_REGISTRY_BASE = "https://raw.githubusercontent.com/dflow-sh/starters";

/**
 * @param {unknown} data
 * @returns {{ registryVersion: string, starters: Array<{ id: string, path: string, manifest: object }> }}
 */
export function assertRegistryShape(data) {
  if (!data || typeof data !== "object") {
    throw new Error("registry.json: expected a JSON object");
  }
  const { registryVersion, starters } = /** @type {Record<string, unknown>} */ (data);
  if (typeof registryVersion !== "string") {
    throw new Error('registry.json: missing string "registryVersion"');
  }
  if (!Array.isArray(starters)) {
    throw new Error('registry.json: missing array "starters"');
  }
  for (const s of starters) {
    if (!s || typeof s !== "object") {
      throw new Error("registry.json: each starter must be an object");
    }
    const entry = /** @type {Record<string, unknown>} */ (s);
    if (typeof entry.id !== "string" || !entry.id) {
      throw new Error("registry.json: each starter must have a non-empty string id");
    }
    if (typeof entry.path !== "string" || !entry.path) {
      throw new Error(`registry.json: starter "${entry.id}" missing path`);
    }
    if (!entry.manifest || typeof entry.manifest !== "object") {
      throw new Error(`registry.json: starter "${entry.id}" missing manifest object`);
    }
  }
  return /** @type {any} */ (data);
}

/**
 * @param {string} registryUrl
 */
export async function loadRegistryFromUrl(registryUrl) {
  const res = await fetch(registryUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch registry (${res.status} ${res.statusText}): ${registryUrl}`,
    );
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error(
      `registry.json is not valid JSON from ${registryUrl}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return assertRegistryShape(data);
}

/**
 * @param {string} repoRoot
 */
export function loadRegistryFromFile(repoRoot) {
  const p = path.join(repoRoot, "registry.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      `Missing registry.json at ${p}. Run "pnpm run build:registry" in the starters repo, or use --registry-url.`,
    );
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(
      `Could not read ${p}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return assertRegistryShape(data);
}

/**
 * @param {{ ref: string, registryBaseUrl?: string }} opts
 */
export function defaultRegistryUrl(opts) {
  const base = (opts.registryBaseUrl ?? DEFAULT_REGISTRY_BASE).replace(/\/$/, "");
  const ref = opts.ref.replace(/^\/+/, "");
  return `${base}/${ref}/registry.json`;
}
