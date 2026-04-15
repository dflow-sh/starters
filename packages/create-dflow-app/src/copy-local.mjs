import fs from "node:fs";
import path from "node:path";

const IGNORE_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  ".turbo",
  "__pycache__",
  ".venv",
]);

/**
 * @param {string} srcDir absolute source starter directory
 * @param {string} destDir absolute empty or missing destination
 */
export function copyStarterTree(srcDir, destDir) {
  const resolvedSrc = path.resolve(srcDir);
  const resolvedDest = path.resolve(destDir);
  if (!fs.existsSync(resolvedSrc) || !fs.statSync(resolvedSrc).isDirectory()) {
    throw new Error(`Source starter directory not found: ${resolvedSrc}`);
  }

  fs.mkdirSync(resolvedDest, { recursive: true });

  /**
   * @param {string} from
   * @param {string} to
   */
  function walk(from, to) {
    for (const name of fs.readdirSync(from)) {
      if (IGNORE_NAMES.has(name)) continue;
      const fp = path.join(from, name);
      const tp = path.join(to, name);
      const st = fs.statSync(fp);
      if (st.isDirectory()) {
        fs.mkdirSync(tp, { recursive: true });
        walk(fp, tp);
      } else if (st.isFile()) {
        fs.copyFileSync(fp, tp);
      }
    }
  }

  walk(resolvedSrc, resolvedDest);
}
