/**
 * POST /api/push/subscribe — Register a push subscription for a merchant.
 * Body: { merchantId: string, subscription: PushSubscriptionJSON }
 *
 * DELETE /api/push/subscribe — Unsubscribe.
 * Body: { merchantId: string, endpoint: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getMerchant } from "../../../../lib/store";
import { savePushSubscription, removePushSubscription } from "../../../../lib/push";
import type { PushSub } from "../../../../lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, subscription } = body;

    if (!merchantId || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: "Provide merchantId and subscription (with endpoint + keys)" },
        { status: 400 },
      );
    }

    // Verify merchant exists
    const m = await getMerchant(merchantId);
    if (!m) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const sub: PushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await savePushSubscription(merchantId, sub);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push] Subscribe error:", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, endpoint } = body;

    if (!merchantId || !endpoint) {
      return NextResponse.json(
        { error: "Provide merchantId and endpoint" },
        { status: 400 },
      );
    }

    await removePushSubscription(merchantId, endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push] Unsubscribe error:", err);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }
}
