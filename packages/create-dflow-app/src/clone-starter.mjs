import degit from "degit";
import fs from "node:fs";
import path from "node:path";
import { copyStarterTree } from "./copy-local.mjs";

/**
 * @param {{ githubRepo: string, starterPath: string, ref: string, dest: string }} opts
 * starterPath uses forward slashes (from registry), e.g. starters/frontend/react-vite
 */
export async function cloneFromGithub(opts) {
  const { githubRepo, starterPath, ref, dest } = opts;
  const normalizedPath = starterPath.split(path.sep).join("/").replace(/^\//, "").replace(/\/$/, "");
  const spec = `${githubRepo}/${normalizedPath}#${ref}`;
  const emitter = degit(spec, { cache: true, force: true });
  await emitter.clone(dest);
}

/**
 * @param {{ sourceRoot: string, starterPath: string, dest: string }} opts
 */
export function cloneFromLocal(opts) {
  const abs = path.join(opts.sourceRoot, ...opts.starterPath.split("/"));
  copyStarterTree(abs, opts.dest);
}

/**
 * @param {string} dest
 */
export function ensureEmptyTargetDir(dest) {
  const resolved = path.resolve(dest);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
    return resolved;
  }
  const entries = fs.readdirSync(resolved);
  if (entries.length > 0) {
    throw new Error(
      `Target directory is not empty (refusing to overwrite): ${resolved}`,
    );
  }
  return resolved;
}
