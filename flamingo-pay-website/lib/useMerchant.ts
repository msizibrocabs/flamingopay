"use client";

import { useCallback, useEffect, useState } from "react";
import { currentMerchantId } from "./merchant";

export type MerchantData = {
  id: string;
  phone: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  address: string;
  bank: string;
  accountLast4: string;
  accountType: "cheque" | "savings";
  status: string;
  createdAt: string;
  approvedAt?: string;
  txnCount: number;
  grossVolume: number;
};

type UseMerchant = {
  loading: boolean;
  merchant: MerchantData | null;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMerchant(): UseMerchant {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const id = currentMerchantId();
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/merchants/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed (${res.status})`);
      }
      const d = await res.json();
      setMerchant(d.merchant ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, merchant, error, refetch: load };
}
