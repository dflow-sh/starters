const TAG_PREFIX = "starters/v";

/**
 * @param {string} githubRepo `owner/name`
 */
function parseRepo(githubRepo) {
  const parts = githubRepo.split("/").filter(Boolean);
  if (parts.length !== 2) {
    throw new Error(`Invalid DFLOW_STARTERS_GITHUB_REPO (expected owner/repo): ${githubRepo}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * @param {string} linkHeader
 * @returns {string | null}
 */
function nextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  for (const chunk of linkHeader.split(",")) {
    const m = chunk.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Numeric segment comparison for tags like starters/v0.1.0 or starters/v2026.4.15.
 * @param {string} fullTag
 */
function versionRank(fullTag) {
  const rest = fullTag.startsWith(TAG_PREFIX) ? fullTag.slice(TAG_PREFIX.length) : fullTag;
  const segments = rest.split(/[.\-+]/).map((s) => {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
  });
  return segments;
}

/**
 * @param {string} a
 * @param {string} b
 */
function compareTagDesc(a, b) {
  const ra = versionRank(a);
  const rb = versionRank(b);
  const len = Math.max(ra.length, rb.length);
  for (let i = 0; i < len; i++) {
    const da = ra[i] ?? 0;
    const db = rb[i] ?? 0;
    if (da !== db) return db - da;
  }
  return b.localeCompare(a);
}

/**
 * Pick the newest starters/v* tag from the repository (GitHub REST tags list).
 * @param {string} githubRepo
 * @returns {Promise<{ ref: string, usedApi: boolean }>}
 */
export async function resolveLatestStartersTag(githubRepo) {
  const { owner, repo } = parseRepo(githubRepo);
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "create-dflow-app",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  /** @type {string[]} */
  const matches = [];
  let url = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`;

  for (let page = 0; page < 20 && url; page++) {
    const res = await fetch(url, { headers, redirect: "follow" });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Could not list tags for ${githubRepo} (${res.status} ${res.statusText})${body ? `: ${body.slice(0, 200)}` : ""}`,
      );
    }
    /** @type {Array<{ name?: string }>} */
    const batch = await res.json();
    if (!Array.isArray(batch)) {
      throw new Error(`Unexpected tags response from GitHub API for ${githubRepo}`);
    }
    for (const t of batch) {
      if (typeof t.name === "string" && t.name.startsWith(TAG_PREFIX)) {
        matches.push(t.name);
      }
    }
    url = nextPageUrl(res.headers.get("Link")) ?? null;
  }

  if (matches.length === 0) {
    return { ref: "main", usedApi: true };
  }

  matches.sort(compareTagDesc);
  return { ref: matches[0], usedApi: true };
}
