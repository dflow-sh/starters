import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import {
  defaultRegistryUrl,
  loadRegistryFromFile,
  loadRegistryFromUrl,
} from "./fetch-registry.mjs";
import { cloneFromGithub, cloneFromLocal, ensureEmptyTargetDir } from "./clone-starter.mjs";
import { printNextSteps } from "./next-steps.mjs";
import { resolveLatestStartersTag } from "./resolve-starters-ref.mjs";

function printHelp() {
  console.log(`create-dflow-app — copy a dFlow starter into a new directory

Usage:
  create-dflow-app                          Interactive: pick a starter and target dir
  create-dflow-app list                     Print starters from the registry (non-interactive)
  create-dflow-app <starter-id> <target-dir>   Non-interactive scaffold

Options:
  --source <path>     Use a local starters repo root (reads registry.json + copies from starters/)
  --ref <git-ref>     Git branch, tag, or commit for remote templates (default: env DFLOW_STARTERS_REF, else latest starters/v* tag, else main)
  --registry-url <url>   Fetch registry JSON from this URL (overrides default GitHub raw URL)
  --registry-base <url>  Base URL for registry (default: https://raw.githubusercontent.com/dflow-sh/starters)
  -h, --help          Show this message

Environment:
  DFLOW_STARTERS_GITHUB_REPO   owner/repo for degit (default: dflow-sh/starters)
  DFLOW_STARTERS_REF           default git ref (unset: resolve latest starters/v* via GitHub API; fallback main)
  DFLOW_STARTERS_REGISTRY_URL  full URL to registry.json
  DFLOW_STARTERS_REGISTRY_BASE base URL; registry = \${BASE}/\${REF}/registry.json

Implementation: production copies use degit against a subdirectory of the GitHub repo at --ref.
Local development: pass --source /path/to/starters (or clone first). See README in this package.
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const rawEnvRef = process.env.DFLOW_STARTERS_REF;
  const envRef = typeof rawEnvRef === "string" && rawEnvRef.trim() ? rawEnvRef.trim() : null;

  /** @type {{ help: boolean, list: boolean, source: string | null, ref: string | null, refIsExplicit: boolean, registryUrl: string | null, registryBase: string | null, githubRepo: string, positional: string[] }} */
  const opts = {
    help: false,
    list: false,
    source: null,
    ref: envRef,
    refIsExplicit: envRef !== null,
    registryUrl: process.env.DFLOW_STARTERS_REGISTRY_URL?.trim() || null,
    registryBase: process.env.DFLOW_STARTERS_REGISTRY_BASE?.trim() || null,
    githubRepo: process.env.DFLOW_STARTERS_GITHUB_REPO?.trim() || "dflow-sh/starters",
    positional: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      opts.help = true;
      continue;
    }
    if (a === "list") {
      opts.list = true;
      continue;
    }
    if (a === "--source") {
      opts.source = argv[++i] ?? "";
      continue;
    }
    if (a === "--ref") {
      opts.refIsExplicit = true;
      opts.ref = argv[++i] ?? "main";
      continue;
    }
    if (a === "--registry-url") {
      opts.registryUrl = argv[++i] ?? "";
      continue;
    }
    if (a === "--registry-base") {
      opts.registryBase = argv[++i] ?? "";
      continue;
    }
    if (a.startsWith("-")) {
      throw new Error(`Unknown option: ${a} (try --help)`);
    }
    opts.positional.push(a);
  }

  if (opts.source !== null && !String(opts.source).trim()) {
    throw new Error("--source requires a path to the starters monorepo root.");
  }

  return opts;
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 */
async function ensureRemoteRef(opts) {
  if (opts.source) {
    return;
  }
  if (opts.refIsExplicit) {
    if (!opts.ref || !String(opts.ref).trim()) {
      throw new Error("--ref requires a non-empty git ref (or unset DFLOW_STARTERS_REF).");
    }
    opts.ref = String(opts.ref).trim();
    return;
  }
  try {
    const { ref } = await resolveLatestStartersTag(opts.githubRepo);
    opts.ref = ref;
    if (ref === "main") {
      console.warn(
        'create-dflow-app: no starters/v* tags found; using ref "main". Pin with --ref or DFLOW_STARTERS_REF for a stable snapshot.',
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `create-dflow-app: could not resolve latest starters/v* tag (${msg}). Using "main".`,
    );
    opts.ref = "main";
  }
}

/** @param {{ starters: Array<{ id: string }> }} registry */
function findStarter(registry, id) {
  return registry.starters.find((s) => s.id === id);
}

/** @param {{ starters: Array<{ id: string }> }} registry */
function formatUnknownIdMessage(registry, id) {
  const ids = registry.starters.map((s) => s.id).sort((a, b) => a.localeCompare(b));
  const lines = [
    `Unknown starter id: ${id}`,
    "",
    "Known starter ids:",
    ...ids.map((x) => `  - ${x}`),
    "",
    "Tip: run `create-dflow-app list` or the interactive CLI to see options.",
    "Registry: https://github.com/dflow-sh/starters/blob/main/registry.json",
  ];
  return lines.join("\n");
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 */
async function loadRegistry(opts) {
  if (opts.registryUrl) {
    return loadRegistryFromUrl(opts.registryUrl);
  }
  if (opts.source) {
    const root = path.resolve(opts.source);
    return loadRegistryFromFile(root);
  }
  if (!opts.ref) {
    throw new Error("Missing git ref for remote registry (internal error).");
  }
  const url = defaultRegistryUrl({
    ref: opts.ref,
    registryBaseUrl: opts.registryBase || undefined,
  });
  return loadRegistryFromUrl(url);
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 * @param {string} starterId
 * @param {string} targetDir
 */
async function scaffold(opts, starterId, targetDir) {
  const registry = await loadRegistry(opts);
  if (!registry.starters.length) {
    throw new Error(
      "The starter registry is empty — there are no templates to copy yet. Clone dflow-sh/starters and use --source, or try again after a release.",
    );
  }

  const entry = findStarter(registry, starterId);
  if (!entry) {
    throw new Error(formatUnknownIdMessage(registry, starterId));
  }

  const dest = ensureEmptyTargetDir(targetDir);
  const manifest = entry.manifest;

  if (opts.source) {
    cloneFromLocal({
      sourceRoot: path.resolve(opts.source),
      starterPath: entry.path,
      dest,
    });
  } else {
    if (!opts.ref) {
      throw new Error("Missing git ref for remote copy (internal error).");
    }
    await cloneFromGithub({
      githubRepo: opts.githubRepo,
      starterPath: entry.path,
      ref: opts.ref,
      dest,
    });
  }

  const cwdDisplay = path.resolve(dest);
  printNextSteps({ cwd: cwdDisplay, manifest });
  console.log(`Created starter "${starterId}" at ${dest}`);
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 */
async function runList(opts) {
  const registry = await loadRegistry(opts);
  if (!registry.starters.length) {
    console.log("No starters in registry.");
    return;
  }
  for (const s of registry.starters) {
    const m = s.manifest;
    const name = typeof m.displayName === "string" ? m.displayName : s.id;
    const cat = typeof m.category === "string" ? m.category : "?";
    console.log(`${s.id}\t${cat}\t${name}`);
  }
}

/**
 * @param {ReturnType<typeof parseArgs>} opts
 */
async function runInteractive(opts) {
  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      "Interactive mode requires a TTY. Use: create-dflow-app <starter-id> <target-dir>\nExample: create-dflow-app frontend/react-vite ./my-app",
    );
  }

  const registry = await loadRegistry(opts);
  if (!registry.starters.length) {
    throw new Error(
      "The starter registry is empty. For local development use --source /path/to/dflow-sh/starters after `pnpm run build:registry`.",
    );
  }

  const starters = [...registry.starters].sort((a, b) => a.id.localeCompare(b.id));
  console.log("\nAvailable starters:\n");
  starters.forEach((s, i) => {
    const m = s.manifest;
    const name = typeof m.displayName === "string" ? m.displayName : s.id;
    const cat = typeof m.category === "string" ? m.category : "";
    console.log(`  ${i + 1}) ${s.id}  (${cat})  ${name}`);
  });

  const rl = readline.createInterface({ input, output });
  try {
    const nStr = await rl.question("\nEnter number (1–" + starters.length + "): ");
    const n = Number.parseInt(String(nStr).trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > starters.length) {
      throw new Error(`Invalid choice: ${nStr.trim()}`);
    }
    const picked = starters[n - 1];
    const targetRaw = await rl.question("Target directory: ");
    const target = String(targetRaw).trim();
    if (!target) {
      throw new Error("Target directory is required.");
    }
    const targetDir = path.resolve(process.cwd(), target);
    await scaffold(opts, picked.id, targetDir);
  } finally {
    rl.close();
  }
}

export async function runCli() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  await ensureRemoteRef(opts);

  if (opts.list) {
    if (opts.positional.length) {
      throw new Error("Unexpected arguments after list");
    }
    await runList(opts);
    return;
  }

  const [a, b] = opts.positional;
  if (opts.positional.length === 0) {
    await runInteractive(opts);
    return;
  }

  if (opts.positional.length !== 2) {
    throw new Error(
      "Expected: create-dflow-app <starter-id> <target-dir>\nTry create-dflow-app --help",
    );
  }

  const targetDir = path.resolve(process.cwd(), b);
  await scaffold(opts, a, targetDir);
}
