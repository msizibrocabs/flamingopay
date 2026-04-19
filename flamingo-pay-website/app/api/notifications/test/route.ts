/**
 * POST /api/notifications/test — Send a test payment notification.
 * Admin-only. Body: { phone?: string, merchantId?: string }
 *
 * If merchantId is provided, uses the merchant's phone from the database.
 * Otherwise, uses the phone provided directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../lib/api-auth";
import { getMerchant } from "../../../../lib/store";
import { sendPaymentNotification } from "../../../../lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let phone = body.phone as string | undefined;
    let merchantName = body.merchantName ?? "Test Merchant";

    // If merchantId provided, look up the merchant's phone
    if (body.merchantId) {
      const m = await getMerchant(body.merchantId);
      if (!m) {
        return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
      }
      phone = m.phone;
      merchantName = m.businessName;
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Provide 'phone' or 'merchantId'" },
        { status: 400 },
      );
    }

    // Check which providers are configured
    const config = {
      whatsappConfigured: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
      smsConfigured: !!(process.env.SMS_SA_CLIENT_ID && process.env.SMS_SA_SECRET),
    };

    const result = await sendPaymentNotification({
      phone,
      merchantName,
      amount: 5000, // R50.00 test
      reference: "FP-TEST",
      buyerBank: "Test Bank",
    });

    return NextResponse.json({
      ...result,
      config,
      phoneSent: phone,
    });
  } catch (err) {
    console.error("[notifications] Test error:", err);
    return NextResponse.json(
      { error: "Test failed", detail: (err as Error).message },
      { status: 500 },
    );
  }
}
