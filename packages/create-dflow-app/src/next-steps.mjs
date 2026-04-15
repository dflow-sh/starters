const DEPLOY_DOCS_URL =
  "https://docs.dflow.sh/articles/7377791-github-integration";

/**
 * @param {string | string[]} cmd
 */
export function formatCommand(cmd) {
  if (Array.isArray(cmd)) return cmd.join(" ");
  return cmd;
}

/**
 * @param {{ cwd: string, manifest: Record<string, unknown> }} opts
 */
export function printNextSteps({ cwd, manifest }) {
  const install = manifest.installCommand;
  const build = manifest.buildCommand;
  const start = manifest.startCommand;
  const port = manifest.port;

  console.log("\nNext steps:\n");
  if (typeof install === "string" || Array.isArray(install)) {
    const line = formatCommand(/** @type {string | string[]} */ (install));
    if (line.trim()) {
      console.log(`  1. Install dependencies`);
      console.log(`       cd ${cwd}`);
      console.log(`       ${line}`);
    }
  }

  if (typeof build === "string" || Array.isArray(build)) {
    const isEmptyArray = Array.isArray(build) && build.length === 0;
    const isEmptyString = typeof build === "string" && build.trim() === "";
    if (!isEmptyArray && !isEmptyString) {
      const line = formatCommand(/** @type {string | string[]} */ (build));
      console.log(`  2. Build`);
      console.log(`       ${line}`);
    }
  }

  if (typeof start === "string" || Array.isArray(start)) {
    const line = formatCommand(/** @type {string | string[]} */ (start));
    console.log(`  3. Run locally`);
    console.log(`       ${line}`);
    if (typeof port === "number") {
      console.log(`     (manifest listen port: ${port})`);
    }
  }

  console.log(`\n  Deploy on dFlow: ${DEPLOY_DOCS_URL}\n`);
}
