/**
 * Flamingo Pay — Sanctions & PEP Screening Engine
 *
 * Screens merchant names and owner names against:
 *
 * SANCTIONS LISTS:
 *   - UN Security Council Consolidated List
 *   - US OFAC Specially Designated Nationals (SDN)
 *   - EU Consolidated Financial Sanctions
 *   - SA FIC Targeted Financial Sanctions
 *
 * PEP (Politically Exposed Persons) LISTS:
 *   - Curated South African PEP database (Cabinet, MPs, Premiers, SOE boards, judiciary)
 *   - OpenSanctions global PEP dataset (100k+ entries)
 *   - Plug-in ready for Refinitiv / World-Check / LexisNexis
 *
 * Data source: OpenSanctions consolidated dataset (free for startups)
 * FICA compliant: FIC Act s21A requires PEP screening; no specific provider mandated.
 *
 * Redis keys:
 *   sanctions:entries:{N}        → JSON SanctionsEntry[] (chunked sanctions list)
 *   sanctions:meta               → JSON SanctionsMeta
 *   sanctions:chunk_count        → number
 *   pep:entries:{N}              → JSON PepEntry[] (chunked PEP list)
 *   pep:meta                     → JSON PepMeta
 *   pep:chunk_count              → number
 *   sanctions:flag:{merchantId}  → JSON SanctionsFlag
 *   sanctions:flag_ids           → JSON string[]
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

export type MatchSource = "sanctions" | "pep";

export type SanctionsMatchedEntry = {
  id: string;
  name: string;
  type: string;
  lists: string[];
  score: number;
  country?: string;
  programmes?: string[];
  /** Whether this match came from sanctions or PEP screening */
  source: MatchSource;
  /** PEP-specific: position/role held */
  pepPosition?: string;
  /** PEP-specific: PEP tier (senior, family, associate) */
  pepTier?: PepTier;
};

export type FlagType = "sanctions" | "pep" | "both";

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
  /** Whether this flag is for sanctions, PEP, or both */
  flagType: FlagType;
};

export type ScreeningResult = {
  businessNameResult: MatchResult;
  ownerNameResult: MatchResult;
  flagged: boolean;
  /** Combined highest score across both checks */
  highestScore: number;
  /** Whether the flag is sanctions, PEP, or both */
  flagType: FlagType;
};

// ─── PEP Types ─────────────────────────────────────────────

export type PepTier = "senior" | "family" | "associate";

export type PepEntry = {
  id: string;
  name: string;
  nameNorm: string;
  aliases: string[];
  position: string;
  tier: PepTier;
  country: string;
  source: string;         // "SA Curated" | "OpenSanctions PEP" | provider name
  active: boolean;        // Currently in office
  listedAt?: string;
};

export type PepMeta = {
  lastRefresh: string;
  totalEntries: number;
  sources: string[];
  refreshDurationMs: number;
  saCuratedCount: number;
  openSanctionsCount: number;
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
        source: "sanctions",
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
  // Run sanctions + PEP screens in parallel
  const [businessSanctions, ownerSanctions, businessPep, ownerPep] = await Promise.all([
    screenName(businessName),
    screenName(ownerName),
    screenNamePep(businessName),
    screenNamePep(ownerName),
  ]);

  // Merge sanctions + PEP results for each name
  const businessNameResult: MatchResult = {
    matched: businessSanctions.matched || businessPep.matched,
    score: Math.max(businessSanctions.score, businessPep.score),
    matchType: classifyMatch(Math.max(businessSanctions.score, businessPep.score)),
    matchedName: businessName,
    entries: [...businessSanctions.entries, ...businessPep.entries]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),
  };

  const ownerNameResult: MatchResult = {
    matched: ownerSanctions.matched || ownerPep.matched,
    score: Math.max(ownerSanctions.score, ownerPep.score),
    matchType: classifyMatch(Math.max(ownerSanctions.score, ownerPep.score)),
    matchedName: ownerName,
    entries: [...ownerSanctions.entries, ...ownerPep.entries]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10),
  };

  const highestScore = Math.max(businessNameResult.score, ownerNameResult.score);
  const flagged = businessNameResult.matched || ownerNameResult.matched;

  // Determine flag type
  const hasSanctions = businessSanctions.matched || ownerSanctions.matched;
  const hasPep = businessPep.matched || ownerPep.matched;
  const flagType: FlagType = hasSanctions && hasPep ? "both"
    : hasPep ? "pep"
    : "sanctions";

  return {
    businessNameResult,
    ownerNameResult,
    flagged,
    highestScore,
    flagType,
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
          flagType: result.flagType,
        });
        newFlags.push(m.id);
      }
    }
  }

  return { screened, flagged, newFlags };
}

// =====================================================================
// PEP (Politically Exposed Persons) SCREENING
// FICA s21A — Must determine if client is a domestic/foreign PEP
// =====================================================================

// ─── Curated South African PEP Database ─────────────────────
// These are public officials whose names are publicly available.
// This list should be updated when cabinet reshuffles or elections occur.
// Source: SA Government websites, Parliament, SOE annual reports.

const SA_PEP_DATABASE: Omit<PepEntry, "nameNorm">[] = [
  // ── National Executive (Cabinet) ──
  { id: "sa-pep-001", name: "Cyril Matamela Ramaphosa", aliases: ["Cyril Ramaphosa", "C Ramaphosa"], position: "President of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-002", name: "Paul Shipokosa Mashatile", aliases: ["Paul Mashatile"], position: "Deputy President of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-003", name: "Enoch Godongwana", aliases: ["E Godongwana"], position: "Minister of Finance", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-004", name: "Ronald Ozzy Lamola", aliases: ["Ronald Lamola", "R Lamola"], position: "Minister of International Relations", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-005", name: "Gwede Mantashe", aliases: ["S Mantashe"], position: "Minister of Mineral Resources and Energy", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-006", name: "Bheki Cele", aliases: ["B Cele"], position: "Former Minister of Police", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-007", name: "Angie Motshekga", aliases: ["A Motshekga"], position: "Minister of Defence", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-008", name: "Blade Nzimande", aliases: ["B Nzimande", "Bonginkosi Nzimande"], position: "Minister of Higher Education", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-009", name: "Fikile Mbalula", aliases: ["F Mbalula", "Mr Fix"], position: "Secretary-General ANC", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-010", name: "Pravin Gordhan", aliases: ["P Gordhan"], position: "Former Minister of Public Enterprises", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-011", name: "Nkosazana Dlamini-Zuma", aliases: ["Nkosazana Zuma", "NDZ"], position: "Former Minister of Cooperative Governance", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-012", name: "Aaron Motsoaledi", aliases: ["A Motsoaledi"], position: "Minister of Home Affairs", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-013", name: "Thoko Didiza", aliases: ["T Didiza"], position: "Former Minister of Agriculture", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-014", name: "Nosiviwe Mapisa-Nqakula", aliases: ["N Mapisa-Nqakula"], position: "Former Speaker of Parliament", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-015", name: "John Steenhuisen", aliases: ["J Steenhuisen"], position: "Minister of Agriculture / DA Leader", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-016", name: "Pieter Groenewald", aliases: ["P Groenewald"], position: "Minister of Police (GNU)", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-017", name: "Dean Macpherson", aliases: ["D Macpherson"], position: "Minister of Public Works (GNU)", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-018", name: "Gayton McKenzie", aliases: ["G McKenzie"], position: "Minister of Sports, Arts & Culture", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  // ── Premiers ──
  { id: "sa-pep-020", name: "Panyaza Lesufi", aliases: ["P Lesufi"], position: "Premier of Gauteng", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-021", name: "Nomusa Dube-Ncube", aliases: ["N Dube-Ncube"], position: "Premier of KwaZulu-Natal", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-022", name: "Alan Winde", aliases: ["A Winde"], position: "Premier of Western Cape", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-023", name: "Makhura David Maile", aliases: ["David Maile", "Lebogang Maile"], position: "Former Premier of Gauteng / MEC", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-024", name: "Oscar Mabuyane", aliases: ["O Mabuyane"], position: "Premier of Eastern Cape", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-025", name: "Zamani Saul", aliases: ["Z Saul"], position: "Premier of Northern Cape", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  // ── SOE Leadership ──
  { id: "sa-pep-030", name: "Dan Sobharan Sobharan Sobharan Sobharan Marokane", aliases: ["Dan Marokane"], position: "CEO of Eskom", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-031", name: "Bongani Sishi", aliases: ["B Sishi"], position: "Acting CEO of Transnet", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-032", name: "Mpho Makwana", aliases: ["M Makwana"], position: "Board Chair of Eskom", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  // ── Judiciary ──
  { id: "sa-pep-040", name: "Raymond Zondo", aliases: ["R Zondo"], position: "Chief Justice of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-041", name: "Mandisa Maya", aliases: ["M Maya"], position: "Deputy Chief Justice", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  // ── SARB / Financial Regulators ──
  { id: "sa-pep-050", name: "Lesetja Kganyago", aliases: ["L Kganyago"], position: "Governor of SARB", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-051", name: "Fundi Tshazibana", aliases: ["F Tshazibana"], position: "Deputy Governor of SARB", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-052", name: "Unathi Kamlana", aliases: ["U Kamlana"], position: "Commissioner of FSCA", tier: "senior", country: "ZA", source: "SA Curated", active: true },
  // ── Notable former PEPs (still PEPs under FICA for prescribed period) ──
  { id: "sa-pep-060", name: "Jacob Gedleyihlekisa Zuma", aliases: ["Jacob Zuma", "JZ", "Msholozi"], position: "Former President of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-061", name: "Thabo Mvuyelwa Mbeki", aliases: ["Thabo Mbeki"], position: "Former President of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-062", name: "Kgalema Motlanthe", aliases: ["K Motlanthe"], position: "Former President of South Africa", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  { id: "sa-pep-063", name: "Ace Magashule", aliases: ["Elias Magashule", "E Magashule"], position: "Former Secretary-General ANC / Former Premier Free State", tier: "senior", country: "ZA", source: "SA Curated", active: false },
  // ── Known PEP Family Members (FICA requires screening of family) ──
  { id: "sa-pep-070", name: "Duduzane Zuma", aliases: ["D Zuma"], position: "Son of former President Zuma", tier: "family", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-071", name: "Duduzile Zuma-Sambudla", aliases: ["Duduzile Zuma", "Dudu Zuma"], position: "Daughter of former President Zuma", tier: "family", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-072", name: "Andile Ramaphosa", aliases: ["A Ramaphosa"], position: "Son of President Ramaphosa", tier: "family", country: "ZA", source: "SA Curated", active: true },
  { id: "sa-pep-073", name: "Tshepo Magashule", aliases: ["T Magashule"], position: "Son of Ace Magashule", tier: "family", country: "ZA", source: "SA Curated", active: true },
];

/** Build normalised PEP entries from the curated list. */
function buildSaCuratedPeps(): PepEntry[] {
  return SA_PEP_DATABASE.map(p => ({
    ...p,
    nameNorm: normalise(p.name),
  }));
}

// ─── PEP List Refresh ───────────────────────────────────────

/**
 * Refresh PEP lists: curated SA database + OpenSanctions PEP dataset.
 * The OpenSanctions PEP dataset includes ~100k global PEP entries.
 */
export async function refreshPepList(): Promise<PepMeta> {
  const start = Date.now();
  const entries: PepEntry[] = [];

  // 1. Curated SA PEPs (always loaded)
  const saCurated = buildSaCuratedPeps();
  entries.push(...saCurated);

  // 2. OpenSanctions global PEP dataset
  let openSanctionsCount = 0;
  try {
    const res = await fetch(
      "https://data.opensanctions.org/datasets/latest/peps/targets.simple.json",
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(60000) },
    );
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split("\n");
      for (const line of lines) {
        try {
          const entity = JSON.parse(line);
          if (entity.schema !== "Person") continue; // PEPs are persons
          const name = entity.caption || entity.name || "";
          if (!name) continue;

          // Skip if already in curated list (avoid duplicates for SA PEPs)
          const normName = normalise(name);
          if (entries.some(e => e.nameNorm === normName && e.source === "SA Curated")) continue;

          const aliases: string[] = [];
          if (entity.properties?.alias) aliases.push(...entity.properties.alias);
          if (entity.properties?.name && Array.isArray(entity.properties.name)) {
            for (const n of entity.properties.name) {
              if (n !== name) aliases.push(n);
            }
          }

          const position = entity.properties?.position?.[0]
            || entity.properties?.role?.[0]
            || entity.properties?.description?.[0]
            || "PEP";

          entries.push({
            id: entity.id || `os-pep-${entries.length}`,
            name,
            nameNorm: normName,
            aliases,
            position,
            tier: "senior",
            country: entity.properties?.country?.[0] || "unknown",
            source: "OpenSanctions PEP",
            active: true,
            listedAt: entity.first_seen || undefined,
          });
          openSanctionsCount++;
        } catch {
          // Skip malformed lines
        }
      }
    } else {
      console.error(`PEP fetch failed: ${res.status}`);
    }
  } catch (err) {
    console.error("PEP fetch error:", err);
  }

  // Store in Redis (chunked)
  const CHUNK_SIZE = 5000;
  const chunkCount = Math.ceil(entries.length / CHUNK_SIZE);

  const meta: PepMeta = {
    lastRefresh: new Date().toISOString(),
    totalEntries: entries.length,
    sources: ["SA Curated", ...(openSanctionsCount > 0 ? ["OpenSanctions PEP"] : [])],
    refreshDurationMs: Date.now() - start,
    saCuratedCount: saCurated.length,
    openSanctionsCount,
  };

  const pipe = redis.pipeline();
  pipe.set("pep:meta", JSON.stringify(meta));
  pipe.set("pep:chunk_count", chunkCount);
  for (let i = 0; i < chunkCount; i++) {
    const chunk = entries.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    pipe.set(`pep:entries:${i}`, JSON.stringify(chunk));
  }
  await pipe.exec();

  return meta;
}

// ─── Load PEP entries from Redis ────────────────────────────

async function loadPepEntries(): Promise<PepEntry[]> {
  const countRaw = await redis.get("pep:chunk_count");
  const chunkCount = typeof countRaw === "number" ? countRaw : parseInt(String(countRaw) || "0", 10);

  if (chunkCount === 0) {
    // If not loaded yet, at least return the curated SA list
    return buildSaCuratedPeps();
  }

  const pipe = redis.pipeline();
  for (let i = 0; i < chunkCount; i++) {
    pipe.get(`pep:entries:${i}`);
  }
  const results = await pipe.exec();

  const all: PepEntry[] = [];
  for (const raw of results) {
    if (typeof raw === "string") {
      all.push(...JSON.parse(raw));
    } else if (Array.isArray(raw)) {
      all.push(...raw as PepEntry[]);
    }
  }
  return all;
}

export async function getPepMeta(): Promise<PepMeta | null> {
  const raw = await redis.get("pep:meta");
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as PepMeta;
}

// ─── Screen a name against PEP list ────────────────────────

export async function screenNamePep(name: string): Promise<MatchResult> {
  if (!name.trim()) {
    return { matched: false, score: 0, matchType: "none", matchedName: name, entries: [] };
  }

  const pepEntries = await loadPepEntries();
  if (pepEntries.length === 0) {
    return { matched: false, score: 0, matchType: "none", matchedName: name, entries: [] };
  }

  const matches: SanctionsMatchedEntry[] = [];

  for (const entry of pepEntries) {
    let bestScore = matchScore(name, entry.name);

    for (const alias of entry.aliases) {
      const aliasScore = matchScore(name, alias);
      if (aliasScore > bestScore) bestScore = aliasScore;
    }

    if (bestScore >= MATCH_THRESHOLD) {
      matches.push({
        id: entry.id,
        name: entry.name,
        type: "person",
        lists: [entry.source],
        score: bestScore,
        country: entry.country,
        programmes: [entry.position],
        source: "pep",
        pepPosition: entry.position,
        pepTier: entry.tier,
      });
    }
  }

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

// ─── Provider plug-in architecture ──────────────────────────
// Ready for Refinitiv / World-Check / LexisNexis integration.
// Implement PepProvider interface and register with setPepProvider().

export interface PepProvider {
  name: string;
  screenName(name: string): Promise<MatchResult>;
  refresh?(): Promise<{ count: number }>;
}

let externalPepProvider: PepProvider | null = null;

/** Register an external PEP provider (Refinitiv, World-Check, etc.). */
export function setPepProvider(provider: PepProvider): void {
  externalPepProvider = provider;
  console.log(`[PEP] External provider registered: ${provider.name}`);
}

/** Get the current PEP provider name. */
export function getPepProviderName(): string {
  return externalPepProvider?.name ?? "OpenSanctions + SA Curated (built-in)";
}
