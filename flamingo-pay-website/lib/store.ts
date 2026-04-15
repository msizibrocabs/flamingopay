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
};

declare global {
  // eslint-disable-next-line no-var
  var __flamingoMerchants: Map<string, MerchantApplication> | undefined;
}

function seed(store: Map<string, MerchantApplication>) {
  const now = Date.now();
  const iso = (daysAgo: number) =>
    new Date(now - daysAgo * 86400000).toISOString();

  const seeds: MerchantApplication[] = [
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
  seeds.forEach(m => store.set(m.id, m));
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
  };
  store.set(id, merchant);
  return merchant;
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
