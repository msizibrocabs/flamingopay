/**
 * POST /api/auth/otp — Send or verify an OTP.
 *
 * Body: { phone, purpose, action: "send" | "verify", code? }
 */

import { NextRequest, NextResponse } from "next/server";
import { sendOTP, verifyOTP, type OTPPurpose } from "../../../../lib/otp";

export async function POST(req: NextRequest) {
  let body: {
    phone?: string;
    purpose?: OTPPurpose;
    action?: "send" | "verify";
    code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, purpose, action, code } = body;

  if (!phone || !purpose || !action) {
    return NextResponse.json(
      { error: "phone, purpose, and action are required" },
      { status: 400 },
    );
  }

  if (!["login_2fa", "pin_reset", "signup"].includes(purpose)) {
    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
  }

  if (action === "send") {
    const result = await sendOTP(phone, purpose);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfter: result.retryAfter },
        { status: 429 },
      );
    }
    return NextResponse.json({
      sent: true,
      expiresIn: result.expiresIn,
      // Only included in dev mode for testing
      ...(result.devOTP ? { devOTP: result.devOTP } : {}),
    });
  }

  if (action === "verify") {
    if (!code) {
      return NextResponse.json({ error: "code is required for verification" }, { status: 400 });
    }
    const result = await verifyOTP(phone, purpose, code);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, attemptsLeft: result.attemptsLeft },
        { status: 401 },
      );
    }
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ error: "action must be 'send' or 'verify'" }, { status: 400 });
}
