"use client";

/**
 * PaymentNotifier — wraps the usePaymentNotifications hook and renders
 * the PaymentToast. Drop this into any merchant page layout.
 * Only activates when a merchantId is present in localStorage.
 */

import { useEffect, useState } from "react";
import { usePaymentNotifications } from "../../../lib/usePaymentNotifications";
import { PaymentToast } from "../../../components/PaymentToast";
import { currentMerchantId } from "../../../lib/merchant";

export function PaymentNotifier() {
  const [mid, setMid] = useState<string | null>(null);

  useEffect(() => {
    setMid(currentMerchantId());
  }, []);

  const { latestPayment, dismiss } = usePaymentNotifications(mid);

  return <PaymentToast payment={latestPayment} onDismiss={dismiss} />;
}
