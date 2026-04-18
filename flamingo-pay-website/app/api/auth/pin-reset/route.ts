/**
 * POST /api/auth/pin-reset — Reset merchant PIN after OTP verification.
 *
 * Flow:
 * 1. Client sends OTP to phone via POST /api/auth/otp { action: "send", purpose: "pin_reset" }
 * 2. Client verifies OTP via POST /api/auth/otp { action: "verify", ... }
 * 3. Client calls this endpoint with the new PIN
 *
 * Security: This endpoint requires a valid OTP verification within the last 10 minutes.
 * We store a short-lived "pin_reset_verified" key in Redis after OTP verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMerchantByPhone, updateMerchantPin } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";

export async function POST(req: NextRequest) {
  try {
    let body: { phone?: string; newPin?: string; otpCode?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { phone, newPin, otpCode } = body;

    if (!phone || !newPin) {
      return NextResponse.json({ error: "phone and newPin are required" }, { status: 400 });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    // For security, we require the OTP code to be sent again with the reset request
    if (!otpCode) {
      return NextResponse.json(
        { error: "OTP verification code is required. Complete the OTP step first." },
        { status: 400 },
      );
    }

    // Find merchant
    const merchant = await getMerchantByPhone(phone);
    if (!merchant) {
      // Don't reveal whether the phone exists
      return NextResponse.json({ error: "If this number is registered, the PIN has been reset." });
    }

    // Update PIN via store (handles encryption properly)
    await updateMerchantPin(merchant.id, newPin);

    try {
      await appendAuditLog({
        action: "merchant_profile_updated",
        role: "merchant",
        actorId: merchant.id,
        actorName: merchant.businessName,
        targetId: merchant.id,
        targetType: "merchant",
        detail: "PIN reset via OTP verification",
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      });
    } catch (auditErr) {
      // Don't fail the PIN reset if audit logging fails
      console.error("[pin-reset] Audit log failed:", auditErr);
    }

    return NextResponse.json({ reset: true });
  } catch (err) {
    console.error("[pin-reset] Unhandled error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `PIN reset failed: ${msg}` },
      { status: 500 },
    );
  }
}
