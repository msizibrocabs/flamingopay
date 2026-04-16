"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredTxn } from "./store";

type TxnStats = {
  count: number;
  completedCount: number;
  refundedCount: number;
  processed: number;
  refundedValue: number;
  fees: number;
  feeRate: number;
  feeFixed: number;
};

type UseTxns = {
  loading: boolean;
  error: string | null;
  txns: StoredTxn[];
  stats: TxnStats | null;
  refetch: () => Promise<void>;
  refund: (txnId: string) => Promise<{ ok: true; txn: StoredTxn } | { ok: false; error: string }>;
};

export function useMerchantTxns(merchantId: string | null | undefined): UseTxns {
  const [txns, setTxns] = useState<StoredTxn[]>([]);
  const [stats, setStats] = useState<TxnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/merchants/${merchantId}/transactions`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const d = await res.json();
      setTxns(d.transactions ?? []);
      setStats(d.stats ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  const refund = useCallback(
    async (txnId: string) => {
      if (!merchantId) return { ok: false as const, error: "No merchant" };
      try {
        const res = await fetch(`/api/merchants/${merchantId}/transactions/${txnId}/refund`, {
          method: "POST",
        });
        const d = await res.json();
        if (!res.ok) return { ok: false as const, error: d.error || "Refund failed" };
        // Optimistically update local state and then refetch stats
        setTxns(prev => prev.map(t => (t.id === txnId ? d.txn : t)));
        // Refresh stats without a full reload
        load();
        return { ok: true as const, txn: d.txn as StoredTxn };
      } catch (e) {
        return { ok: false as const, error: (e as Error).message };
      }
    },
    [merchantId, load],
  );

  return { loading, error, txns, stats, refetch: load, refund };
}
