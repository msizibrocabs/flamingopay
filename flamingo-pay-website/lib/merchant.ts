/**
 * Mock merchant data & client-side helpers.
 * Replace with real API calls once backend is wired up.
 */

import { MS_PER_DAY } from "./time";

export type Txn = {
  id: string;
  amount: number;       // ZAR
  rail: "payshap" | "eft";
  buyerBank: string;
  timestamp: string;    // ISO
  status: "completed" | "pending" | "refunded" | "partial_refund";
  reference: string;
};

export type SettlementTxn = {
  id: string;
  amount: number;
  rail: string;
  buyerBank: string;
  timestamp: string;
  reference: string;
};

export type Settlement = {
  id: string;
  amount: number;
  /** Flamingo transaction fees (2.9% + R0.99 per txn) */
  txnFees: number;
  /** Ozow payout fee (flat R3 per settlement) */
  fee: number;
  net: number;
  date: string;
  txnCount: number;
  status: "settled" | "pending";
  transactions: SettlementTxn[];
};

export type Merchant = {
  id: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  bank: string;
  accountMasked: string;
  address: string;
  category: string;
  verified: boolean;
  feeRate: number;      // e.g., 0.029 = 2.9%
  joinedAt: string;
};

const MERCHANT_KEY = "flamingo_merchant_session";

export const DEMO_MERCHANT: Merchant = {
  id: "FP-TH4ND1",
  name: "Thandi's Spaza",
  owner: "Thandi Nkosi",
  phone: "+27 82 555 0142",
  email: "thandi@nkosispaza.co.za",
  bank: "Standard Bank",
  accountMasked: "•••• 4428",
  address: "12 Protea Street, Diepsloot, Johannesburg",
  category: "Spaza / General Dealer",
  verified: true,
  feeRate: 0.029,
  joinedAt: "2026-02-12",
};

/** Seeded pseudo-random so the demo stays stable across reloads. */
function seededRand(seed: number) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

export function makeMockTransactions(count = 48): Txn[] {
  const rand = seededRand(4242);
  const banks = ["Capitec", "FNB", "Standard Bank", "Nedbank", "ABSA", "TymeBank", "Discovery Bank"];
  const now = Date.now();
  const txns: Txn[] = [];
  for (let i = 0; i < count; i++) {
    const amount = Math.round((5 + rand() * 500) * 100) / 100;
    const hoursAgo = Math.floor(i * 2.4 + rand() * 3);
    const ts = new Date(now - hoursAgo * 3600 * 1000);
    txns.push({
      id: `tx_${(9000 + i).toString(36)}`,
      amount,
      rail: rand() > 0.35 ? "payshap" : "eft",
      buyerBank: banks[Math.floor(rand() * banks.length)],
      timestamp: ts.toISOString(),
      status: rand() < 0.04 ? "refunded" : rand() < 0.97 ? "completed" : "pending",
      reference: `FP-${Math.floor(rand() * 9e5 + 1e5)}`,
    });
  }
  return txns;
}

/** Flat R3 payout fee per settlement (Ozow settlement fee). */
const PAYOUT_FEE = 3;
/** Flamingo transaction fee: 2.9% + R0.99 per completed transaction. */
const TXN_FEE_RATE = 0.029;
const TXN_FEE_FIXED = 0.99;

/** Calculate Flamingo fee for a single transaction amount. */
export function calcTxnFee(amount: number): number {
  return +(amount * TXN_FEE_RATE + TXN_FEE_FIXED).toFixed(2);
}

/** Net amount merchant receives after Flamingo fee. */
export function calcNetAmount(amount: number): number {
  return +(amount - calcTxnFee(amount)).toFixed(2);
}

export function makeMockSettlements(txns: Txn[]): Settlement[] {
  const settled: Settlement[] = [];
  const now = new Date();
  // Group by day
  const byDay: Record<string, Txn[]> = {};
  txns.forEach(t => {
    const d = new Date(t.timestamp).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || [];
    byDay[d].push(t);
  });
  Object.entries(byDay).forEach(([day, list], idx) => {
    const completedTxns = list.filter(l => l.status === "completed");
    const gross = completedTxns.reduce((s, l) => s + l.amount, 0);
    // Flamingo transaction fees (2.9% + R0.99 per txn)
    const txnFees = +(completedTxns.reduce((s, l) => s + calcTxnFee(l.amount), 0)).toFixed(2);
    const payoutFee = PAYOUT_FEE;
    const net = +(gross - txnFees - payoutFee).toFixed(2);
    const dayDate = new Date(day);
    const daysAgo = Math.floor((now.getTime() - dayDate.getTime()) / MS_PER_DAY);
    settled.push({
      id: `st_${idx}`,
      amount: +gross.toFixed(2),
      txnFees,
      fee: payoutFee,
      net: Math.max(0, net),
      date: day,
      txnCount: list.length,
      status: daysAgo > 0 ? "settled" : "pending",
      transactions: list.map(t => ({
        id: t.id,
        amount: t.amount,
        rail: t.rail,
        buyerBank: t.buyerBank,
        timestamp: t.timestamp,
        reference: t.reference,
      })),
    });
  });
  return settled.sort((a, b) => b.date.localeCompare(a.date));
}

export function todayTotals(txns: Txn[]) {
  const today = new Date().toISOString().slice(0, 10);
  const todays = txns.filter(
    t => t.timestamp.slice(0, 10) === today && t.status === "completed"
  );
  const total = todays.reduce((s, t) => s + t.amount, 0);
  return { total, count: todays.length };
}

export function weekTotals(txns: Txn[]) {
  const days: { label: string; total: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayTxns = txns.filter(
      t => t.timestamp.slice(0, 10) === key && t.status === "completed"
    );
    days.push({
      label: d.toLocaleDateString("en-ZA", { weekday: "short" }),
      total: dayTxns.reduce((s, t) => s + t.amount, 0),
      count: dayTxns.length,
    });
  }
  return days;
}

export function formatZAR(n: number) {
  return "R " + n.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatZARCompact(n: number) {
  return "R " + Math.round(n).toLocaleString("en-ZA");
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA");
}

// ---- Session (localStorage-based for demo) ----
export function signIn(merchantId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MERCHANT_KEY, merchantId);
}
export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MERCHANT_KEY);
}
export function currentMerchantId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MERCHANT_KEY);
}
