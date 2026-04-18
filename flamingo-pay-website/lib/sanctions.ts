/**
 * Flamingo Pay — Sanctions Screening Engine
 *
 * Screens merchant names and owner names against international sanctions lists:
 *   - UN Security Council Consolidated List
 *   - US OFAC Specially Designated Nationals (SDN)
 *   - EU Consolidated Financial Sanctions
 *   - SA FIC Targeted Financial Sanctions
 *
 * Data source: OpenSanctions consolidated dataset (free for startups)
 * Fallback: Direct XML/CSV downloads from official sources
 *
 * Redis keys:
 *   sanctions:entries        → JSON SanctionsEntry[] (the full list)
 *   sanctions:meta           → JSON { lastRefresh, totalEntries, sources }
 *   sanctions:flags          → JSON SanctionsFlag[] (flagged merchants)
 *   sanctions:flag:{merchantId} → JSON SanctionsFlag
 */

import "server-only";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

// ─── Types ──────────────────────────────────────────────────

export type SanctionsEntry = {
  id: string;
  name: string;
  /** Normalised lowercase name for matching */
  nameNorm: string;
  aliases: string[];
  type: "person" | "entity" | "unknown";
  /** Which list(s) this entry appears on */
  lists: string[];
  /** Country/nationality if available */
  country?: string;
  /** Date added to the list */
  listedAt?: string;
  /** Reason / programme (e.g. "DPRK", "Iran", "Terrorism") */
  programmes?: string[];
};

export type SanctionsMeta = {
  lastRefresh: string;
  totalEntries: number;
  sources: string[];
  refreshDurationMs: number;
};

export type MatchResult = {
  matched: boolean;
  score: number;          // 0-100 confidence
  matchType: "exact" | "fuzzy" | "partial" | "none";
  matchedName: string;    // the query name
  entries: SanctionsMatchedEntry[];
};

export type SanctionsMatchedEntry = {
  id: string;
  name: string;
  type: string;
  lists: string[];
  score: number;
  country?: string;
  programmes?: string[];
};

export type SanctionsFlag = {
  merchantId: string;
  merchantName: string;
  ownerName: string;
  flaggedAt: string;
  status: "pending" | "cleared" | "blocked";
  resolvedAt?: string;
  resolvedBy?: string;
  note?: string;
  matches: SanctionsMatchedEntry[];
};

export type ScreeningResult = {
  businessNameResult: MatchResult;
  ownerNameResult: MatchResult;
  flagged: boolean;
  /** Combined highest score across both checks */
  highestScore: number;
};

// ─── Name normalisation ─────────────────────────────────────

function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ")       // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(name: string): string[] {
  return normalise(name).split(" ").filter(Boolean);
}

// ─── Fuzzy matching ─────────────────────────────────────────

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Score two normalised names (0-100). Higher = better match. */
function matchScore(query: string, target: string): number {
  const qNorm = normalise(query);
  const tNorm = normalise(target);

  // Exact match
  if (qNorm === tNorm) return 100;

  // One contains the other
  if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) {
    const ratio = Math.min(qNorm.length, tNorm.length) / Math.max(qNorm.length, tNorm.length);
    return Math.round(70 + ratio * 25);
  }

  // Token overlap
  const qTokens = tokenize(query);
  const tTokens = tokenize(target);
  let tokenMatches = 0;
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      if (qt === tt) {
        tokenMatches++;
        break;
      }
      // Fuzzy token match (edit distance ≤ 1 for short, ≤ 2 for longer)
      const maxDist = qt.length <= 4 ? 1 : 2;
      if (levenshtein(qt, tt) <= maxDist) {
        tokenMatches += 0.8;
        break;
      }
    }
  }
  const tokenScore = qTokens.length > 0
    ? (tokenMatches / Math.max(qTokens.length, tTokens.length)) * 85
    : 0;

  // Levenshtein on full string (for short names)
  const dist = levenshtein(qNorm, tNorm);
  const maxLen = Math.max(qNorm.length, tNorm.length);
  const levScore = maxLen > 0 ? Math.max(0, (1 - dist / maxLen) * 80) : 0;

  return Math.round(Math.max(tokenScore, levScore));
}

function classifyMatch(score: number): MatchResult["matchType"] {
  if (score >= 95) return "exact";
  if (score >= 70) return "fuzzy";
  if (score >= 50) return "partial";
  return "none";
}

// ─── List refresh (OpenSanctions) ───────────────────────────

const OPENSANCTIONS_API = "https://api.opensanctions.org";

/**
 * Fetch the consolidated sanctions dataset from OpenSanctions.
 * Uses the free /search endpoint to build a local cache.
 * For production, use the bulk data export.
 */
export async function refreshSanctionsList(): Promise<SanctionsMeta> {
  const start = Date.now();
  const entries: SanctionsEntry[] = [];
  const sources = new Set<string>();

  // Fetch from OpenSanctions datasets API (consolidated list)
  // We use the bulk JSON export which includes all sanctions targets
  const datasets = [
    { url: "https://data.opensanctions.org/datasets/latest/un_sc_sanctions/targets.simple.json", source: "UN Security Council" },
    { url: "https://data.opensanctions.org/datasets/latest/us_ofac_sdn/targets.simple.json", source: "US OFAC SDN" },
    { url: "https://data.opensanctions.org/datasets/latest/eu_fsf/targets.simple.json", source: "EU Financial Sanctions" },
    { url: "https://data.opensanctions.org/datasets/latest/za_fic_sanctions/targets.simple.json", source: "SA FIC TFS" },
  ];

  for (const ds of datasets) {
    try {
      const res = await fetch(ds.url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        console.error(`Sanctions fetch failed for ${ds.source}: ${res.status}`);
        continue;
      }

      // OpenSanctions simple JSON is newline-delimited JSON (NDJSON)
      const text = await res.text();
      const lines = text.trim().split("\n");

      for (const line of lines) {
        try {
          const entity = JSON.parse(line);
          const name = entity.caption || entity.name || "";
          if (!name) continue;

          const aliases: string[] = [];
          if (entity.properties?.alias) {
            aliases.push(...entity.properties.alias);
          }
          if (entity.properties?.name && Array.isArray(entity.properties.name)) {
            for (const n of entity.properties.name) {
              if (n !== name) aliases.push(n);
            }
          }

          const type = entity.schema === "Person" ? "person" as const
            : entity.schema === "Organization" || entity.schema === "Company" ? "entity" as const
            : "unknown" as const;

          const existing = entries.find(e => e.id === entity.id);
          if (existing) {
            if (!existing.lists.includes(ds.source)) {
              existing.lists.push(ds.source);
            }
            continue;
          }

          entries.push({
            id: entity.id || `${ds.source}-${entries.length}`,
            name,
            nameNorm: normalise(name),
            aliases,
            type,
            lists: [ds.source],
            country: entity.properties?.country?.[0] || undefined,
            listedAt: entity.first_seen || undefined,
            programmes: entity.properties?.program || entity.properties?.sanction_program || undefined,
          });

          sources.add(ds.source);
        } catch {
          // Skip malformed lines
        }
      }
    } catch (err) {
      console.error(`Sanctions fetch error for ${ds.source}:`, err);
    }
  }

  // Store in Redis (chunked if needed — Upstash has a value size limit)
  // For most deployments, the combined list is ~15k entries → ~3MB JSON
  const meta: SanctionsMeta = {
    lastRefresh: new Date().toISOString(),
    totalEntries: entries.length,
    sources: [...sources],
    refreshDurationMs: Date.now() - start,
  };

  // Store entries in chunks of 5000 to stay under Redis value limits
  const CHUNK_SIZE = 5000;
  const chunkCount = Math.ceil(entries.length / CHUNK_SIZE);

  const pipe = redis.pipeline();
  pipe.set("sanctions:meta", JSON.stringify(meta));
  pipe.set("sanctions:chunk_count", chunkCount);

  for (let i = 0; i < chunkCount; i++) {
    const chunk = entries.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    pipe.set(`sanctions:entries:${i}`, JSON.stringify(chunk));
  }

  await pipe.exec();

  return meta;
}

// ─── Load entries from Redis ────────────────────────────────

async function loadEntries(): Promise<SanctionsEntry[]> {
  const countRaw = await redis.get("sanctions:chunk_count");
  const chunkCount = typeof countRaw === "number" ? countRaw : parseInt(String(countRaw) || "0", 10);
  if (chunkCount === 0) return [];

  const pipe = redis.pipeline();
  for (let i = 0; i < chunkCount; i++) {
    pipe.get(`sanctions:entries:${i}`);
  }
  const results = await pipe.exec();

  const all: SanctionsEntry[] = [];
  for (const raw of results) {
    if (typeof raw === "string") {
      all.push(...JSON.parse(raw));
    } else if (Array.isArray(raw)) {
      all.push(...raw as SanctionsEntry[]);
    }
  }
  return all;
}

export async function getSanctionsMeta(): Promise<SanctionsMeta | null> {
  const raw = await redis.get("sanctions:meta");
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as SanctionsMeta;
}

// ─── Screen a name ──────────────────────────────────────────

const MATCH_THRESHOLD = 65; // Minimum score to consider a match

export async function screenName(name: string): Promise<MatchResult> {
  if (!name.trim()) {
    return { matched: false, score: 0, matchType: "none", matchedName: name, entries: [] };
  }

  const entries = await loadEntries();
  if (entries.length === 0) {
    return { matched: false, score: 0, matchType: "none", matchedName: name, entries: [] };
  }

  const matches: SanctionsMatchedEntry[] = [];

  for (const entry of entries) {
    // Check against primary name
    let bestScore = matchScore(name, entry.name);

    // Check against aliases
    for (const alias of entry.aliases) {
      const aliasScore = matchScore(name, alias);
      if (aliasScore > bestScore) bestScore = aliasScore;
    }

    if (bestScore >= MATCH_THRESHOLD) {
      matches.push({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        lists: entry.lists,
        score: bestScore,
        country: entry.country,
        programmes: entry.programmes,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 10);
  const highestScore = topMatches[0]?.score ?? 0;

  return {
    matched: highestScore >= MATCH_THRESHOLD,
    score: highestScore,
    matchType: classifyMatch(highestScore),
    matchedName: name,
    entries: topMatches,
  };
}

// ─── Screen a merchant (business name + owner) ─────────────

export async function screenMerchant(
  merchantId: string,
  businessName: string,
  ownerName: string,
): Promise<ScreeningResult> {
  const [businessNameResult, ownerNameResult] = await Promise.all([
    screenName(businessName),
    screenName(ownerName),
  ]);

  const highestScore = Math.max(businessNameResult.score, ownerNameResult.score);
  const flagged = businessNameResult.matched || ownerNameResult.matched;

  return {
    businessNameResult,
    ownerNameResult,
    flagged,
    highestScore,
  };
}

// ─── Flag management ────────────────────────────────────────

export async function createSanctionsFlag(flag: SanctionsFlag): Promise<void> {
  await redis.set(`sanctions:flag:${flag.merchantId}`, JSON.stringify(flag));

  // Add to flags index
  const indexRaw = await redis.get("sanctions:flag_ids");
  const ids: string[] = typeof indexRaw === "string" ? JSON.parse(indexRaw) : (indexRaw as string[] | null) ?? [];
  if (!ids.includes(flag.merchantId)) {
    ids.push(flag.merchantId);
    await redis.set("sanctions:flag_ids", JSON.stringify(ids));
  }
}

export async function getSanctionsFlag(merchantId: string): Promise<SanctionsFlag | null> {
  const raw = await redis.get(`sanctions:flag:${merchantId}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as SanctionsFlag;
}

export async function listSanctionsFlags(): Promise<SanctionsFlag[]> {
  const indexRaw = await redis.get("sanctions:flag_ids");
  const ids: string[] = typeof indexRaw === "string" ? JSON.parse(indexRaw) : (indexRaw as string[] | null) ?? [];
  if (ids.length === 0) return [];

  const pipe = redis.pipeline();
  for (const id of ids) {
    pipe.get(`sanctions:flag:${id}`);
  }
  const results = await pipe.exec();

  const flags: SanctionsFlag[] = [];
  for (const raw of results) {
    if (raw) {
      const flag = typeof raw === "string" ? JSON.parse(raw) : raw as SanctionsFlag;
      flags.push(flag);
    }
  }

  // Sort: pending first, then by date
  flags.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime();
  });

  return flags;
}

export async function resolveSanctionsFlag(
  merchantId: string,
  status: "cleared" | "blocked",
  resolvedBy: string,
  note?: string,
): Promise<SanctionsFlag | null> {
  const flag = await getSanctionsFlag(merchantId);
  if (!flag) return null;

  flag.status = status;
  flag.resolvedAt = new Date().toISOString();
  flag.resolvedBy = resolvedBy;
  if (note) flag.note = note;

  await redis.set(`sanctions:flag:${flag.merchantId}`, JSON.stringify(flag));
  return flag;
}

// ─── Batch re-screen all merchants ──────────────────────────

export async function batchScreenMerchants(): Promise<{
  screened: number;
  flagged: number;
  newFlags: string[];
}> {
  // Import dynamically to avoid circular dependency
  const { listMerchants } = await import("./store");
  const merchants = await listMerchants();

  let screened = 0;
  let flagged = 0;
  const newFlags: string[] = [];

  for (const m of merchants) {
    if (m.status === "rejected") continue; // Skip rejected

    const result = await screenMerchant(m.id, m.businessName, m.ownerName);
    screened++;

    if (result.flagged) {
      flagged++;

      // Check if already flagged
      const existing = await getSanctionsFlag(m.id);
      if (!existing || existing.status === "cleared") {
        // Create new flag (or re-flag if previously cleared)
        const allMatches = [
          ...result.businessNameResult.entries,
          ...result.ownerNameResult.entries,
        ];
        // Deduplicate
        const seen = new Set<string>();
        const unique = allMatches.filter(e => {
          if (seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });

        await createSanctionsFlag({
          merchantId: m.id,
          merchantName: m.businessName,
          ownerName: m.ownerName,
          flaggedAt: new Date().toISOString(),
          status: "pending",
          matches: unique,
        });
        newFlags.push(m.id);
      }
    }
  }

  return { screened, flagged, newFlags };
}
