import { NextRequest, NextResponse } from "next/server";
import {
  createMerchant,
  listMerchants,
  getMerchantByPhone,
  type NewMerchantInput,
} from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ merchants: listMerchants() });
}

export async function POST(req: NextRequest) {
  let body: Partial<NewMerchantInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = [
    "phone",
    "businessName",
    "businessType",
    "ownerName",
    "bank",
    "accountNumber",
    "accountType",
  ] as const;
  for (const k of required) {
    if (!body[k] || typeof body[k] !== "string") {
      return NextResponse.json(
        { error: `Missing field: ${k}` },
        { status: 400 },
      );
    }
  }
  if (body.accountType !== "cheque" && body.accountType !== "savings") {
    return NextResponse.json(
      { error: "accountType must be 'cheque' or 'savings'" },
      { status: 400 },
    );
  }

  const existing = getMerchantByPhone(body.phone!);
  if (existing) {
    return NextResponse.json(
      { error: "A merchant with this phone is already registered", merchant: existing },
      { status: 409 },
    );
  }

  const merchant = createMerchant(body as NewMerchantInput);
  return NextResponse.json({ merchant }, { status: 201 });
}
