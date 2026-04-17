/**
 * Server-side merchant store backed by Upstash Redis.
 *
 * Redis keys:
 *   merchant:{id}       → JSON MerchantApplication
 *   merchant_ids         → JSON string[] (list of all merchant IDs)
 *   txns:{merchantId}   → JSON StoredTxn[]
 *   flags                → JSON TxnFlag[] (compliance flags)
 *   seeded               → "1" once seed data has been written
 */

import "server-only";
import { Redis } from "@upstash/redis";

// Support both Vercel KV var names (KV_REST_API_URL / KV_REST_API_TOKEN)
// and native Upstash var names (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
const redis = new Redis({
  url: (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL)!,
  token: (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)!,
});

export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

/** Fee applied to every completed transaction: 2.9% + R0.99 fixed. */
export const FLAMINGO_FEE_RATE = 0.029;
export const FLAMINGO_FEE_FIXED = 0.99;

export type KycTier = "simplified" | "standard" | "enhanced";

export type DocumentKind =
  | "id"
  | "selfie"
  | "affidavit"
  | "company_reg"
  | "proof_of_address"
  | "bank_letter"
  | "source_of_funds";

/** Volume thresholds that determine KYC tier (monthly, in ZAR). */
export const KYC_THRESHOLDS = {
  simplified: 25_000,   // < R25k/month
  standard: 100_000,    // R25k – R100k/month
  // enhanced: > R100k/month
} as const;

/** Determine KYC tier from expected monthly volume. */
export function kycTierForVolume(monthlyVolume: number): KycTier {
  if (monthlyVolume < KYC_THRESHOLDS.simplified) return "simplified";
  if (monthlyVolume <= KYC_THRESHOLDS.standard) return "standard";
  return "enhanced";
}

/** Human-readable tier labels. */
export const KYC_TIER_LABELS: Record<KycTier, string> = {
  simplified: "Simplified (< R25k/month)",
  standard: "Standard (R25k – R100k/month)",
  enhanced: "Enhanced (> R100k/month)",
};

export type DocumentStatus = "required" | "submitted" | "verified" | "rejected";

export type MerchantDocument = {
  kind: DocumentKind;
  label: string;
  status: DocumentStatus;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
  fileName?: string;
  /** Vercel Blob URL for the uploaded file. */
  blobUrl?: string;
};

export type StoredTxn = {
  id: string;
  amount: number;
  rail: "payshap" | "eft";
  buyerBank: string;
  timestamp: string;
  status: "completed" | "pending" | "refunded" | "partial_refund";
  reference: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
};

export type MerchantApplication = {
  id: string;
  phone: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  address: string;
  bank: string;
  accountLast4: string;
  accountType: "cheque" | "savings";
  status: MerchantStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  txnCount: number;
  grossVolume: number;
  documents: MerchantDocument[];
  /** KYC tier derived from declared monthly volume. */
  kycTier: KycTier;
  /** Self-declared expected monthly transaction volume (ZAR). */
  expectedMonthlyVolume: number;
  /** POPIA consent record. */
  consent?: {
    termsVersion: string;
    privacyVersion: string;
    consentedAt: string;
    ip?: string;
  };
  /** Last login timestamp. */
  lastLoginAt?: string;
};

// ---------------------- Helpers ----------------------

const DOC_LABELS: Record<DocumentKind, string> = {
  id: "SA ID document",
  selfie: "Selfie verification",
  affidavit: "Sworn affidavit",
  company_reg: "CIPC company registration",
  proof_of_address: "Proof of address (utility bill)",
  bank_letter: "Bank confirmation letter",
  source_of_funds: "Source of funds declaration",
};

/**
 * Documents required per KYC tier (cumulative):
 *   Simplified  (< R25k) : ID, selfie, proof of address              (3 docs)
 *   Standard (R25k–R100k): + bank letter + affidavit/company_reg      (5 docs)
 *   Enhanced   (> R100k) : + source of funds                          (6 docs)
 */
export function docsForTier(tier: KycTier, businessType: string): DocumentKind[] {
  // Tier 1 — Simplified
  const docs: DocumentKind[] = ["id", "selfie", "proof_of_address"];

  if (tier === "simplified") return docs;

  // Tier 2 — Standard: add bank letter + business-type doc
  docs.push("bank_letter");
  const isCompany = /pty|ltd|cc|company|bakery|studio|boutique|transport/i.test(businessType);
  docs.push(isCompany ? "company_reg" : "affidavit");

  if (tier === "standard") return docs;

  // Tier 3 — Enhanced: add source of funds
  docs.push("source_of_funds");
  return docs;
}

function defaultDocsFor(
  tier: KycTier,
  businessType: string,
  status: MerchantStatus,
  iso: (d: number) => string,
): MerchantDocument[] {
  const kinds = docsForTier(tier, businessType);

  return kinds.map((k, i): MerchantDocument => {
    if (status === "approved") {
      return {
        kind: k, label: DOC_LABELS[k], status: "verified",
        submittedAt: iso(60), verifiedAt: iso(58),
        fileName: `${k}-${slugify(k)}.pdf`,
      };
    }
    if (status === "rejected") {
      return {
        kind: k, label: DOC_LABELS[k],
        status: i === 0 ? "rejected" : "submitted",
        submittedAt: iso(3),
        rejectedAt: i === 0 ? iso(2) : undefined,
        note: i === 0 ? "ID photo too blurry to read" : undefined,
        fileName: `${k}.jpg`,
      };
    }
    if (i < 2) {
      return { kind: k, label: DOC_LABELS[k], status: "submitted", submittedAt: iso(0), fileName: `${k}.jpg` };
    }
    return { kind: k, label: DOC_LABELS[k], status: "required" };
  });
}

function slugify(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "merchant"
  );
}

// ---------------------- Seeding ----------------------

function seededRand(seed: number) {
  let x = seed || 1;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 4242;
}

function generateTxnsFor(merchantId: string, count: number): StoredTxn[] {
  const rand = seededRand(hashSeed(merchantId));
  const banks = ["Capitec", "FNB", "Standard Bank", "Nedbank", "ABSA", "TymeBank", "Discovery Bank"];
  const now = Date.now();
  const txns: StoredTxn[] = [];
  for (let i = 0; i < count; i++) {
    const amount = Math.round((5 + rand() * 500) * 100) / 100;
    const hoursAgo = Math.floor(i * 2.4 + rand() * 3);
    const ts = new Date(now - hoursAgo * 3600 * 1000);
    const statusRoll = rand();
    txns.push({
      id: `tx_${merchantId.slice(0, 3)}_${(9000 + i).toString(36)}`,
      amount,
      rail: rand() > 0.35 ? "payshap" : "eft",
      buyerBank: banks[Math.floor(rand() * banks.length)],
      timestamp: ts.toISOString(),
      status: statusRoll < 0.04 ? "refunded" : statusRoll < 0.97 ? "completed" : "pending",
      reference: `FP-${Math.floor(rand() * 9e5 + 1e5)}`,
    });
  }
  return txns;
}

async function ensureSeeded(): Promise<void> {
  const already = await redis.get("seeded");
  if (already) return;

  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();

  const seedInputs: Array<Omit<MerchantApplication, "documents">> = [
    {
      id: "thandis-spaza", phone: "+27 82 555 0142",
      businessName: "Thandi's Spaza", businessType: "Spaza / General Dealer",
      ownerName: "Thandi Nkosi", address: "12 Protea Street, Diepsloot, Johannesburg",
      bank: "Standard Bank", accountLast4: "4428", accountType: "cheque",
      status: "approved", createdAt: iso(62), approvedAt: iso(61),
      txnCount: 842, grossVolume: 48291.5,
      kycTier: "standard", expectedMonthlyVolume: 50_000,
    },
    {
      id: "bra-mike-braai", phone: "+27 83 555 0891",
      businessName: "Bra Mike's Braai", businessType: "Takeaway / Food",
      ownerName: "Mike Dlamini", address: "Corner Soweto Hwy & Chris Hani Rd, Soweto",
      bank: "Capitec", accountLast4: "9112", accountType: "savings",
      status: "approved", createdAt: iso(31), approvedAt: iso(30),
      txnCount: 421, grossVolume: 19447.0,
      kycTier: "simplified", expectedMonthlyVolume: 15_000,
    },
    {
      id: "mama-joy-fruit", phone: "+27 71 222 3344",
      businessName: "Mama Joy Fruit & Veg", businessType: "Fruit & veg",
      ownerName: "Joyce Mokoena", address: "Noord Taxi Rank, Johannesburg CBD",
      bank: "FNB", accountLast4: "7701", accountType: "cheque",
      status: "pending", createdAt: iso(1), txnCount: 0, grossVolume: 0,
      kycTier: "standard", expectedMonthlyVolume: 30_000,
    },
    {
      id: "sis-lindiwe-hair", phone: "+27 76 789 1234",
      businessName: "Sis Lindi Hair Studio", businessType: "Hair salon / Barber",
      ownerName: "Lindiwe Zulu", address: "Umlazi J Section, Durban",
      bank: "TymeBank", accountLast4: "0321", accountType: "savings",
      status: "pending", createdAt: iso(0), txnCount: 0, grossVolume: 0,
      kycTier: "simplified", expectedMonthlyVolume: 8_000,
    },
    {
      id: "uncle-sipho-taxi", phone: "+27 82 333 4455",
      businessName: "Uncle Sipho Transport", businessType: "Service provider",
      ownerName: "Sipho Ndlovu", address: "Ga-Rankuwa, Pretoria",
      bank: "Nedbank", accountLast4: "8855", accountType: "cheque",
      status: "rejected", createdAt: iso(3), rejectedAt: iso(2),
      rejectionReason: "Phone number could not be verified (RICA mismatch)",
      txnCount: 0, grossVolume: 0,
      kycTier: "enhanced", expectedMonthlyVolume: 120_000,
    },
    {
      id: "afro-braids-boutique", phone: "+27 84 111 2233",
      businessName: "Afro Braids Boutique", businessType: "Hair salon / Barber",
      ownerName: "Nomsa Khumalo", address: "Vanderbijlpark, Gauteng",
      bank: "Discovery Bank", accountLast4: "6677", accountType: "cheque",
      status: "approved", createdAt: iso(14), approvedAt: iso(13),
      txnCount: 204, grossVolume: 12_880.0,
      kycTier: "simplified", expectedMonthlyVolume: 10_000,
    },
  ];

  const ids: string[] = [];
  const pipe = redis.pipeline();
  for (const m of seedInputs) {
    const full: MerchantApplication = {
      ...m,
      documents: defaultDocsFor(m.kycTier, m.businessType, m.status, iso),
    };
    pipe.set(`merchant:${m.id}`, JSON.stringify(full));
    ids.push(m.id);
    // Seed transactions for approved merchants
    if (m.status === "approved") {
      pipe.set(`txns:${m.id}`, JSON.stringify(generateTxnsFor(m.id, 48)));
    }
  }
  pipe.set("merchant_ids", JSON.stringify(ids));
  pipe.set("seeded", "1");
  await pipe.exec();
}

// ---------------------- Merchant CRUD ----------------------

export async function listMerchants(): Promise<MerchantApplication[]> {
  await ensureSeeded();
  const idsRaw = await redis.get("merchant_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  if (ids.length === 0) return [];

  const pipe = redis.pipeline();
  for (const id of ids) pipe.get(`merchant:${id}`);
  const results = await pipe.exec();

  const merchants: MerchantApplication[] = [];
  for (const raw of results) {
    if (!raw) continue;
    const m: MerchantApplication = typeof raw === "string" ? JSON.parse(raw) : raw as MerchantApplication;
    merchants.push(m);
  }
  return merchants.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMerchant(id: string): Promise<MerchantApplication | undefined> {
  await ensureSeeded();
  const raw = await redis.get(`merchant:${id}`);
  if (!raw) return undefined;
  return typeof raw === "string" ? JSON.parse(raw) : raw as MerchantApplication;
}

export async function getMerchantByPhone(phone: string): Promise<MerchantApplication | undefined> {
  const clean = phone.replace(/\s/g, "");
  const all = await listMerchants();
  return all.find(m => m.phone.replace(/\s/g, "") === clean);
}

export type NewMerchantInput = {
  phone: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  address?: string;
  bank: string;
  accountNumber: string;
  accountType: "cheque" | "savings";
  /** Expected monthly volume in ZAR — determines KYC tier. */
  expectedMonthlyVolume: number;
};

export async function createMerchant(input: NewMerchantInput): Promise<MerchantApplication> {
  await ensureSeeded();
  const baseId = slugify(input.businessName);
  let id = baseId;
  let suffix = 0;
  while (await redis.exists(`merchant:${id}`)) {
    suffix += 1;
    id = `${baseId}-${suffix}`;
  }
  const accLast4 = input.accountNumber.slice(-4).padStart(4, "•");
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
  const tier = kycTierForVolume(input.expectedMonthlyVolume);
  const merchant: MerchantApplication = {
    id,
    phone: input.phone,
    businessName: input.businessName,
    businessType: input.businessType,
    ownerName: input.ownerName,
    address: input.address ?? "",
    bank: input.bank,
    accountLast4: accLast4,
    accountType: input.accountType,
    status: "pending",
    createdAt: new Date().toISOString(),
    txnCount: 0,
    grossVolume: 0,
    kycTier: tier,
    expectedMonthlyVolume: input.expectedMonthlyVolume,
    documents: defaultDocsFor(tier, input.businessType, "pending", iso),
  };

  // Add to Redis
  const idsRaw = await redis.get("merchant_ids");
  const ids: string[] = typeof idsRaw === "string" ? JSON.parse(idsRaw) : (idsRaw as string[] | null) ?? [];
  ids.push(id);
  await redis.pipeline()
    .set(`merchant:${id}`, JSON.stringify(merchant))
    .set("merchant_ids", JSON.stringify(ids))
    .exec();

  return merchant;
}

// ---------------------- Documents ----------------------

export async function updateMerchantDocument(
  merchantId: string,
  kind: DocumentKind,
  patch: Partial<Pick<MerchantDocument, "status" | "note" | "fileName" | "blobUrl">>,
): Promise<MerchantApplication | null> {
  const m = await getMerchant(merchantId);
  if (!m) return null;
  const now = new Date().toISOString();
  m.documents = m.documents.map(d => {
    if (d.kind !== kind) return d;
    const merged: MerchantDocument = { ...d, ...patch };
    if (patch.status === "submitted" && !merged.submittedAt) merged.submittedAt = now;
    if (patch.status === "verified") { merged.verifiedAt = now; merged.rejectedAt = undefined; }
    if (patch.status === "rejected") merged.rejectedAt = now;
    if (patch.status === "required") {
      merged.submittedAt = undefined; merged.verifiedAt = undefined;
      merged.rejectedAt = undefined; merged.fileName = undefined;
    }
    return merged;
  });
  await redis.set(`merchant:${merchantId}`, JSON.stringify(m));
  return m;
}

// ---------------------- Transactions ----------------------

export async function listTransactions(merchantId: string): Promise<StoredTxn[]> {
  await ensureSeeded();
  const raw = await redis.get(`txns:${merchantId}`);
  if (raw) {
    return typeof raw === "string" ? JSON.parse(raw) : raw as StoredTxn[];
  }
  // No transactions yet — check if merchant exists and generate seed if approved
  const m = await getMerchant(merchantId);
  if (!m) return [];
  const count = m.status === "approved" ? 48 : 0;
  const txns = generateTxnsFor(merchantId, count);
  await redis.set(`txns:${merchantId}`, JSON.stringify(txns));
  return txns;
}

export async function createTransaction(
  merchantId: string,
  input: { amount: number; rail: "payshap" | "eft"; buyerBank: string },
): Promise<StoredTxn | { error: string }> {
  const m = await getMerchant(merchantId);
  if (!m) return { error: "Merchant not found" };

  // Enforce KYC tier volume cap — check rolling 30-day volume
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const allTxns = await listTransactions(merchantId);
  const monthVolume = allTxns
    .filter(t => t.timestamp >= thirtyDaysAgo && (t.status === "completed" || t.status === "partial_refund"))
    .reduce((s, t) => s + t.amount, 0);
  const tierLimit = m.kycTier === "simplified" ? KYC_THRESHOLDS.simplified
    : m.kycTier === "standard" ? KYC_THRESHOLDS.standard
    : Infinity; // enhanced has no hard cap
  if (monthVolume + input.amount > tierLimit && tierLimit !== Infinity) {
    return {
      error: `Transaction would exceed your ${m.kycTier} KYC tier limit of R${tierLimit.toLocaleString("en-ZA")}/month. Please upgrade your KYC tier.`,
    };
  }

  // Block suspended merchants
  if (m.status === "suspended") {
    return { error: "Merchant account is suspended" };
  }
  const list = allTxns;
  const ref = `FP-${Math.floor(Math.random() * 9e5 + 1e5)}`;
  const txn: StoredTxn = {
    id: `tx_${merchantId.slice(0, 6)}_${Date.now().toString(36)}`,
    amount: input.amount,
    rail: input.rail,
    buyerBank: input.buyerBank,
    timestamp: new Date().toISOString(),
    status: "completed",
    reference: ref,
  };
  list.unshift(txn);
  m.txnCount += 1;
  m.grossVolume += input.amount;
  await redis.pipeline()
    .set(`txns:${merchantId}`, JSON.stringify(list))
    .set(`merchant:${merchantId}`, JSON.stringify(m))
    .exec();

  // Run compliance auto-flagging rules
  await evaluateRules(merchantId, txn);

  return txn;
}

export async function refundTransaction(
  merchantId: string,
  txnId: string,
  refundAmount?: number,
  refundReason?: string,
): Promise<{ merchant: MerchantApplication; txn: StoredTxn } | { error: string }> {
  const m = await getMerchant(merchantId);
  if (!m) return { error: "Merchant not found" };
  const list = await listTransactions(merchantId);
  const idx = list.findIndex(t => t.id === txnId);
  if (idx === -1) return { error: "Transaction not found" };
  const t = list[idx];
  if (t.status === "refunded") return { error: "Already refunded" };
  if (t.status === "partial_refund") return { error: "Already partially refunded" };
  if (t.status !== "completed") return { error: "Only completed transactions can be refunded" };

  const amt = refundAmount != null && refundAmount > 0 ? refundAmount : t.amount;
  if (amt > t.amount) return { error: "Refund amount exceeds transaction amount" };

  const isPartial = amt < t.amount;
  const refunded: StoredTxn = {
    ...t,
    status: isPartial ? "partial_refund" : "refunded",
    refundedAt: new Date().toISOString(),
    refundAmount: amt,
    refundReason: refundReason || undefined,
  };
  list[idx] = refunded;
  m.grossVolume = Math.max(0, m.grossVolume - amt);
  if (!isPartial) m.txnCount = Math.max(0, m.txnCount - 1);
  await redis.pipeline()
    .set(`txns:${merchantId}`, JSON.stringify(list))
    .set(`merchant:${merchantId}`, JSON.stringify(m))
    .exec();
  return { merchant: m, txn: refunded };
}

export async function transactionStats(merchantId: string) {
  const list = await listTransactions(merchantId);
  const completed = list.filter(t => t.status === "completed" || t.status === "partial_refund");
  const refunded = list.filter(t => t.status === "refunded" || t.status === "partial_refund");
  const processed = completed.reduce((s, t) => s + t.amount, 0);
  const refundedValue = refunded.reduce((s, t) => s + (t.refundAmount ?? t.amount), 0);
  const fees = +(processed * FLAMINGO_FEE_RATE + completed.length * FLAMINGO_FEE_FIXED).toFixed(2);
  return {
    count: list.length,
    completedCount: completed.length,
    refundedCount: refunded.length,
    processed: +processed.toFixed(2),
    refundedValue: +refundedValue.toFixed(2),
    fees,
    feeRate: FLAMINGO_FEE_RATE,
    feeFixed: FLAMINGO_FEE_FIXED,
  };
}

// ---------------------- Status ----------------------

export async function updateMerchantStatus(
  id: string,
  status: MerchantStatus,
  reason?: string,
): Promise<MerchantApplication | null> {
  const m = await getMerchant(id);
  if (!m) return null;
  const now = new Date().toISOString();
  m.status = status;
  if (status === "approved") {
    m.approvedAt = now;
    m.rejectedAt = undefined;
    m.rejectionReason = undefined;
  }
  if (status === "rejected") {
    m.rejectedAt = now;
    m.rejectionReason = reason;
    m.approvedAt = undefined;
  }
  await redis.set(`merchant:${id}`, JSON.stringify(m));
  return m;
}

// ---------------------- Search ----------------------

export type SearchHit =
  | { kind: "merchant"; merchant: MerchantApplication }
  | { kind: "transaction"; txn: StoredTxn; merchant: MerchantApplication };

export async function searchAll(query: string, limit = 20): Promise<SearchHit[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: SearchHit[] = [];
  const merchants = await listMerchants();

  for (const m of merchants) {
    if (
      m.businessName.toLowerCase().includes(needle) ||
      m.ownerName.toLowerCase().includes(needle) ||
      m.phone.toLowerCase().includes(needle) ||
      m.id.toLowerCase().includes(needle)
    ) {
      hits.push({ kind: "merchant", merchant: m });
    }
  }

  for (const m of merchants) {
    const txns = await listTransactions(m.id);
    for (const t of txns) {
      if (
        t.reference.toLowerCase().includes(needle) ||
        t.id.toLowerCase().includes(needle) ||
        t.buyerBank.toLowerCase().includes(needle)
      ) {
        hits.push({ kind: "transaction", txn: t, merchant: m });
        if (hits.length >= limit) return hits;
      }
    }
    if (hits.length >= limit) return hits;
  }

  return hits.slice(0, limit);
}

// ---------------------- Stats ----------------------

export async function stats() {
  const all = await listMerchants();
  return {
    total: all.length,
    pending: all.filter(m => m.status === "pending").length,
    approved: all.filter(m => m.status === "approved").length,
    rejected: all.filter(m => m.status === "rejected").length,
    suspended: all.filter(m => m.status === "suspended").length,
    lifetimeVolume: all.reduce((s, m) => s + m.grossVolume, 0),
    lifetimeTxns: all.reduce((s, m) => s + m.txnCount, 0),
  };
}

// ====================== COMPLIANCE ======================

export type FlagReason =
  | "high_amount"
  | "velocity"
  | "unusual_hours"
  | "manual";

export type FlagStatus = "open" | "investigating" | "cleared" | "confirmed";

export type TxnFlag = {
  id: string;
  txnId: string;
  merchantId: string;
  reason: FlagReason;
  ruleLabel: string;
  status: FlagStatus;
  createdAt: string;
  updatedAt: string;
  officerNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  txnSnapshot: StoredTxn;
};

export type FlagRule = {
  id: string;
  reason: FlagReason;
  label: string;
  enabled: boolean;
  amountThreshold?: number;
  velocityMax?: number;
  velocityWindowMinutes?: number;
  hourStart?: number;
  hourEnd?: number;
};

export const DEFAULT_RULES: FlagRule[] = [
  {
    id: "rule_high_amount",
    reason: "high_amount",
    label: "Single transaction over R5,000",
    enabled: true,
    amountThreshold: 5000,
  },
  {
    id: "rule_velocity",
    reason: "velocity",
    label: "More than 10 transactions in 15 minutes",
    enabled: true,
    velocityMax: 10,
    velocityWindowMinutes: 15,
  },
  {
    id: "rule_unusual_hours",
    reason: "unusual_hours",
    label: "Transaction between 23:00 and 05:00",
    enabled: true,
    hourStart: 5,
    hourEnd: 23,
  },
];

async function getAllFlags(): Promise<TxnFlag[]> {
  const raw = await redis.get("flags");
  if (!raw) return [];
  return typeof raw === "string" ? JSON.parse(raw) : raw as TxnFlag[];
}

async function saveFlags(flags: TxnFlag[]): Promise<void> {
  await redis.set("flags", JSON.stringify(flags));
}

export async function evaluateRules(
  merchantId: string,
  txn: StoredTxn,
): Promise<TxnFlag[]> {
  const rules = DEFAULT_RULES.filter(r => r.enabled);
  const newFlags: TxnFlag[] = [];
  const now = new Date().toISOString();

  for (const rule of rules) {
    let triggered = false;

    if (rule.reason === "high_amount" && rule.amountThreshold) {
      triggered = txn.amount >= rule.amountThreshold;
    }

    if (rule.reason === "velocity" && rule.velocityMax && rule.velocityWindowMinutes) {
      const allTxns = await listTransactions(merchantId);
      const windowMs = rule.velocityWindowMinutes * 60 * 1000;
      const txnTime = new Date(txn.timestamp).getTime();
      const recentCount = allTxns.filter(t => {
        const tTime = new Date(t.timestamp).getTime();
        return tTime >= txnTime - windowMs && tTime <= txnTime;
      }).length;
      triggered = recentCount >= rule.velocityMax;
    }

    if (rule.reason === "unusual_hours" && rule.hourStart != null && rule.hourEnd != null) {
      const hour = new Date(txn.timestamp).getHours();
      triggered = hour < rule.hourStart || hour >= rule.hourEnd;
    }

    if (triggered) {
      newFlags.push({
        id: `flag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        txnId: txn.id,
        merchantId,
        reason: rule.reason,
        ruleLabel: rule.label,
        status: "open",
        createdAt: now,
        updatedAt: now,
        txnSnapshot: txn,
      });
    }
  }

  if (newFlags.length > 0) {
    const existing = await getAllFlags();
    existing.push(...newFlags);
    await saveFlags(existing);
  }

  return newFlags;
}

export async function listFlags(filters?: {
  status?: FlagStatus;
  merchantId?: string;
}): Promise<TxnFlag[]> {
  let flags = await getAllFlags();
  if (filters?.status) flags = flags.filter(f => f.status === filters.status);
  if (filters?.merchantId) flags = flags.filter(f => f.merchantId === filters.merchantId);
  return flags.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFlag(flagId: string): Promise<TxnFlag | undefined> {
  const flags = await getAllFlags();
  return flags.find(f => f.id === flagId);
}

export async function createManualFlag(
  merchantId: string,
  txnId: string,
  note: string,
  officerName: string,
): Promise<TxnFlag | { error: string }> {
  const m = await getMerchant(merchantId);
  if (!m) return { error: "Merchant not found" };
  const txns = await listTransactions(merchantId);
  const txn = txns.find(t => t.id === txnId);
  if (!txn) return { error: "Transaction not found" };

  const now = new Date().toISOString();
  const flag: TxnFlag = {
    id: `flag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    txnId,
    merchantId,
    reason: "manual",
    ruleLabel: `Manually flagged by ${officerName}`,
    status: "open",
    createdAt: now,
    updatedAt: now,
    officerNote: note,
    txnSnapshot: txn,
  };

  const flags = await getAllFlags();
  flags.push(flag);
  await saveFlags(flags);
  return flag;
}

export async function updateFlag(
  flagId: string,
  patch: {
    status?: FlagStatus;
    officerNote?: string;
    resolvedBy?: string;
  },
): Promise<TxnFlag | null> {
  const flags = await getAllFlags();
  const idx = flags.findIndex(f => f.id === flagId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updated: TxnFlag = { ...flags[idx], ...patch, updatedAt: now };
  if (patch.status === "cleared" || patch.status === "confirmed") {
    updated.resolvedAt = now;
    if (patch.resolvedBy) updated.resolvedBy = patch.resolvedBy;
  }
  flags[idx] = updated;
  await saveFlags(flags);
  return updated;
}

export async function freezeMerchant(
  merchantId: string,
  reason: string,
): Promise<MerchantApplication | null> {
  return updateMerchantStatus(merchantId, "suspended", reason);
}

export async function unfreezeMerchant(
  merchantId: string,
): Promise<MerchantApplication | null> {
  return updateMerchantStatus(merchantId, "approved");
}

export async function complianceStats() {
  const flags = await getAllFlags();
  const open = flags.filter(f => f.status === "open").length;
  const investigating = flags.filter(f => f.status === "investigating").length;
  const cleared = flags.filter(f => f.status === "cleared").length;
  const confirmed = flags.filter(f => f.status === "confirmed").length;

  const merchantsUnderReview = new Set(
    flags.filter(f => f.status === "open" || f.status === "investigating").map(f => f.merchantId),
  ).size;

  const flaggedAmount = flags
    .filter(f => f.status === "open" || f.status === "investigating")
    .reduce((s, f) => s + f.txnSnapshot.amount, 0);

  return {
    total: flags.length,
    open,
    investigating,
    cleared,
    confirmed,
    merchantsUnderReview,
    flaggedAmount,
  };
}
