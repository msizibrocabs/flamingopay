import { NextRequest, NextResponse } from "next/server";
import { loginMerchant } from "../../../../lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, pin } = body as { phone?: string; pin?: string };

    if (!phone || !pin) {
      return NextResponse.json(
        { error: "Phone number and PIN are required." },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits." },
        { status: 400 },
      );
    }

    const result = await loginMerchant(phone, pin);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          attemptsLeft: result.attemptsLeft,
          lockedUntil: result.lockedUntil,
        },
        { status: result.attemptsLeft === 0 ? 429 : 401 },
      );
    }

    // Don't expose pinHash to the client
    const { pinHash: _, ...safeM } = result.merchant;

    return NextResponse.json({
      merchant: safeM,
    });
  } catch (err) {
    console.error("Merchant login error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}
