/**
 * Server-side merchant store.
 *
 * Current backing: in-memory Map, persisted on the Node.js globalThis
 * so Next.js dev hot-reload doesn't wipe it.
 *
 * UPGRADE PATH: swap the Map for Vercel Postgres / Supabase and keep
 * the same exported functions. Callers (API routes) won't change.
 *
 * Caveats:
 *  - Data is lost on server cold start / deploy.
 *  - Does not scale across serverless regions.
 *  - Fine for pilot / demo; NOT for production.
 */

import "server-only";

export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

/** Fee applied to every completed transaction: 2.9% + R0.99 fixed. */
export const FLAMINGO_FEE_RATE = 0.029; // 2.9%
export const FLAMINGO_FEE_FIXED = 0.99; // R0.99 per txn

export type DocumentKind =
  | "id"
  | "selfie"
  | "affidavit"
  | "company_reg"
  | "proof_of_address"
  | "bank_letter";

export type DocumentStatus = "required" | "submitted" | "verified" | "rejected";

export type MerchantDocument = {
  kind: DocumentKind;
  label: string;
  status: DocumentStatus;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  note?: string;
  /** Mock filename — in real life this would be an S3 key */
  fileName?: string;
};

export type StoredTxn = {
  id: string;
  amount: number;
  rail: "payshap" | "eft";
  buyerBank: string;
  timestamp: string;
  status: "completed" | "pending" | "refunded";
  reference: string;
  refundedAt?: string;
};

export type MerchantApplication = {
  id: string;
  phone: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  address: string;
  bank: string;
  accountLast4: string;   // stored masked; full number only kept on create
  accountType: "cheque" | "savings";
  status: MerchantStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  /** Lifetime counters — incremented by webhook in future. */
  txnCount: number;
  grossVolume: number;
  documents: MerchantDocument[];
};

declare global {
  // eslint-disable-next-line no-var
  var __flamingoMerchants: Map<string, MerchantApplication> | undefined;
  // eslint-disable-next-line no-var
  var __flamingoTxns: Map<string, StoredTxn[]> | undefined;
}

const DOC_LABELS: Record<DocumentKind, string> = {
  id: "SA ID document",
  selfie: "Selfie verification",
  affidavit: "Sworn affidavit",
  company_reg: "CIPC company registration",
  proof_of_address: "Proof of address (utility bill)",
  bank_letter: "Bank confirmation letter",
};

/** Required doc set depends on business type — sole traders need an affidavit, companies need CIPC. */
function defaultDocsFor(businessType: string, status: MerchantStatus, iso: (d: number) => string): MerchantDocument[] {
  const isCompany = /pty|ltd|cc|company|bakery|studio|boutique|transport/i.test(businessType);
  const base: DocumentKind[] = ["id", "selfie", "proof_of_address", "bank_letter"];
  const kinds: DocumentKind[] = isCompany
    ? [...base, "company_reg"]
    : [...base, "affidavit"];

  return kinds.map((k, i): MerchantDocument => {
    // Approved merchants have verified docs; pending merchants have a mix.
    if (status === "approved") {
      return {
        kind: k,
        label: DOC_LABELS[k],
        status: "verified",
        submittedAt: iso(60),
        verifiedAt: iso(58),
        fileName: `${k}-${slugify(k)}.pdf`,
      };
    }
    if (status === "rejected") {
      return {
        kind: k,
        label: DOC_LABELS[k],
        status: i === 0 ? "rejected" : "submitted",
        submittedAt: iso(3),
        rejectedAt: i === 0 ? iso(2) : undefined,
        note: i === 0 ? "ID photo too blurry to read" : undefined,
        fileName: `${k}.jpg`,
      };
    }
    // pending / suspended: some submitted, some still required
    if (i < 2) {
      return {
        kind: k,
        label: DOC_LABELS[k],
        status: "submitted",
        submittedAt: iso(0),
        fileName: `${k}.jpg`,
      };
    }
    return { kind: k, label: DOC_LABELS[k], status: "required" };
  });
}

function seed(store: Map<string, MerchantApplication>) {
  const now = Date.now();
  const iso = (daysAgo: number) =>
    new Date(now - daysAgo * 86400000).toISOString();

  const seedInputs: Array<Omit<MerchantApplication, "documents">> = [
    {
      id: "thandis-spaza",
      phone: "+27 82 555 0142",
      businessName: "Thandi's Spaza",
      businessType: "Spaza / General Dealer",
      ownerName: "Thandi Nkosi",
      address: "12 Protea Street, Diepsloot, Johannesburg",
      bank: "Standard Bank",
      accountLast4: "4428",
      accountType: "cheque",
      status: "approved",
      createdAt: iso(62),
      approvedAt: iso(61),
      txnCount: 842,
      grossVolume: 48291.5,
    },
    {
      id: "bra-mike-braai",
      phone: "+27 83 555 0891",
      businessName: "Bra Mike's Braai",
      businessType: "Takeaway / Food",
      ownerName: "Mike Dlamini",
      address: "Corner Soweto Hwy & Chris Hani Rd, Soweto",
      bank: "Capitec",
      accountLast4: "9112",
      accountType: "savings",
      status: "approved",
      createdAt: iso(31),
      approvedAt: iso(30),
      txnCount: 421,
      grossVolume: 19447.0,
    },
    {
      id: "mama-joy-fruit",
      phone: "+27 71 222 3344",
      businessName: "Mama Joy Fruit & Veg",
      businessType: "Fruit & veg",
      ownerName: "Joyce Mokoena",
      address: "Noord Taxi Rank, Johannesburg CBD",
      bank: "FNB",
      accountLast4: "7701",
      accountType: "cheque",
      status: "pending",
      createdAt: iso(1),
      txnCount: 0,
      grossVolume: 0,
    },
    {
      id: "sis-lindiwe-hair",
      phone: "+27 76 789 1234",
      businessName: "Sis Lindi Hair Studio",
      businessType: "Hair salon / Barber",
      ownerName: "Lindiwe Zulu",
      address: "Umlazi J Section, Durban",
      bank: "TymeBank",
      accountLast4: "0321",
      accountType: "savings",
      status: "pending",
      createdAt: iso(0),
      txnCount: 0,
      grossVolume: 0,
    },
    {
      id: "uncle-sipho-taxi",
      phone: "+27 82 333 4455",
      businessName: "Uncle Sipho Transport",
      businessType: "Service provider",
      ownerName: "Sipho Ndlovu",
      address: "Ga-Rankuwa, Pretoria",
      bank: "Nedbank",
      accountLast4: "8855",
      accountType: "cheque",
      status: "rejected",
      createdAt: iso(3),
      rejectedAt: iso(2),
      rejectionReason: "Phone number could not be verified (RICA mismatch)",
      txnCount: 0,
      grossVolume: 0,
    },
    {
      id: "afro-braids-boutique",
      phone: "+27 84 111 2233",
      businessName: "Afro Braids Boutique",
      businessType: "Hair salon / Barber",
      ownerName: "Nomsa Khumalo",
      address: "Vanderbijlpark, Gauteng",
      bank: "Discovery Bank",
      accountLast4: "6677",
      accountType: "cheque",
      status: "approved",
      createdAt: iso(14),
      approvedAt: iso(13),
      txnCount: 204,
      grossVolume: 12_880.0,
    },
  ];
  seedInputs.forEach(m => {
    const full: MerchantApplication = {
      ...m,
      documents: defaultDocsFor(m.businessType, m.status, iso),
    };
    store.set(m.id, full);
  });
}

function getStore(): Map<string, MerchantApplication> {
  if (!globalThis.__flamingoMerchants) {
    const s = new Map<string, MerchantApplication>();
    seed(s);
    globalThis.__flamingoMerchants = s;
  }
  return globalThis.__flamingoMerchants;
}

// ---------------------- Public API ----------------------

export function listMerchants(): MerchantApplication[] {
  return Array.from(getStore().values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getMerchant(id: string): MerchantApplication | undefined {
  return getStore().get(id);
}

export function getMerchantByPhone(
  phone: string,
): MerchantApplication | undefined {
  const clean = phone.replace(/\s/g, "");
  return listMerchants().find(
    m => m.phone.replace(/\s/g, "") === clean,
  );
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
};

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "merchant"
  );
}

export function createMerchant(input: NewMerchantInput): MerchantApplication {
  const store = getStore();
  const baseId = slugify(input.businessName);
  let id = baseId;
  let suffix = 0;
  while (store.has(id)) {
    suffix += 1;
    id = `${baseId}-${suffix}`;
  }
  const accLast4 = input.accountNumber.slice(-4).padStart(4, "•");
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
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
    documents: defaultDocsFor(input.businessType, "pending", iso),
  };
  store.set(id, merchant);
  return merchant;
}

// ---------------------- Documents ----------------------

export function updateMerchantDocument(
  merchantId: string,
  kind: DocumentKind,
  patch: Partial<Pick<MerchantDocument, "status" | "note" | "fileName">>,
): MerchantApplication | null {
  const m = getStore().get(merchantId);
  if (!m) return null;
  const now = new Date().toISOString();
  const next = m.documents.map(d => {
    if (d.kind !== kind) return d;
    const merged: MerchantDocument = { ...d, ...patch };
    if (patch.status === "submitted" && !merged.submittedAt) merged.submittedAt = now;
    if (patch.status === "verified") {
      merged.verifiedAt = now;
      merged.rejectedAt = undefined;
    }
    if (patch.status === "rejected") merged.rejectedAt = now;
    if (patch.status === "required") {
      merged.submittedAt = undefined;
      merged.verifiedAt = undefined;
      merged.rejectedAt = undefined;
      merged.fileName = undefined;
    }
    return merged;
  });
  m.documents = next;
  getStore().set(merchantId, m);
  return m;
}

// ---------------------- Transactions ----------------------

function txnStore(): Map<string, StoredTxn[]> {
  if (!globalThis.__flamingoTxns) {
    globalThis.__flamingoTxns = new Map();
  }
  return globalThis.__flamingoTxns;
}

function seededRand(seed: number) {
  let x = seed || 1;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
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

export function listTransactions(merchantId: string): StoredTxn[] {
  const s = txnStore();
  if (!s.has(merchantId)) {
    const m = getMerchant(merchantId);
    if (!m) return [];
    // Approved merchants get a realistic spread; pending/rejected start empty.
    const count = m.status === "approved" ? 48 : 0;
    s.set(merchantId, generateTxnsFor(merchantId, count));
  }
  return s.get(merchantId) ?? [];
}

export function refundTransaction(
  merchantId: string,
  txnId: string,
): { merchant: MerchantApplication; txn: StoredTxn } | { error: string } {
  const m = getStore().get(merchantId);
  if (!m) return { error: "Merchant not found" };
  const list = listTransactions(merchantId);
  const idx = list.findIndex(t => t.id === txnId);
  if (idx === -1) return { error: "Transaction not found" };
  const t = list[idx];
  if (t.status === "refunded") return { error: "Already refunded" };
  if (t.status !== "completed") return { error: "Only completed transactions can be refunded" };
  const refunded: StoredTxn = {
    ...t,
    status: "refunded",
    refundedAt: new Date().toISOString(),
  };
  list[idx] = refunded;
  txnStore().set(merchantId, list);
  // Keep merchant lifetime counters consistent for admin displays.
  m.grossVolume = Math.max(0, m.grossVolume - t.amount);
  m.txnCount = Math.max(0, m.txnCount - 1);
  getStore().set(merchantId, m);
  return { merchant: m, txn: refunded };
}

export function transactionStats(merchantId: string) {
  const list = listTransactions(merchantId);
  const completed = list.filter(t => t.status === "completed");
  const refunded = list.filter(t => t.status === "refunded");
  const processed = completed.reduce((s, t) => s + t.amount, 0);
  const refundedValue = refunded.reduce((s, t) => s + t.amount, 0);
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

export function updateMerchantStatus(
  id: string,
  status: MerchantStatus,
  reason?: string,
): MerchantApplication | null {
  const m = getStore().get(id);
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
  getStore().set(id, m);
  return m;
}

export type SearchHit =
  | {
      kind: "merchant";
      merchant: MerchantApplication;
    }
  | {
      kind: "transaction";
      txn: StoredTxn;
      merchant: MerchantApplication;
    };

/**
 * Full-text-ish search across every merchant and every transaction.
 * Matches merchant business name / owner / phone / id, and transaction
 * reference / buyer bank / id. Returns up to `limit` hits.
 */
export function searchAll(query: string, limit = 20): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: SearchHit[] = [];

  const merchants = listMerchants();
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

  // Transaction reference / id / buyer bank lookup across the entire fleet.
  for (const m of merchants) {
    const txns = listTransactions(m.id);
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

export function stats() {
  const all = listMerchants();
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
