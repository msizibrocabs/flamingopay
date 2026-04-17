import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPasscode, type SessionRole } from "../../../../lib/api-auth";
import { getMerchant } from "../../../../lib/store";
import { appendAuditLog } from "../../../../lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, passcode, name, merchantId, pin } = body as {
      role?: SessionRole;
      passcode?: string;
      name?: string;
      merchantId?: string;
      pin?: string;
    };

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // Merchant login
    if (role === "merchant") {
      if (!merchantId) {
        return NextResponse.json({ error: "Missing merchantId" }, { status: 400 });
      }
      // Demo: accept any 4-digit PIN. Production: verify against stored hash.
      if (!pin || pin.length !== 4) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }
      const merchant = await getMerchant(merchantId);
      if (!merchant) {
        return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
      }
      const token = await createSession("merchant", merchantId, merchant.businessName);
      await appendAuditLog({
        action: "login",
        role: "merchant",
        actorId: merchantId,
        actorName: merchant.businessName,
        detail: "Merchant login",
        ip,
      });
      return NextResponse.json({ ok: true, merchantId, name: merchant.businessName, token });
    }

    // Admin / Compliance login
    if (role === "admin" || role === "compliance") {
      if (!passcode || !name) {
        return NextResponse.json({ error: "Missing passcode or name" }, { status: 400 });
      }
      if (!verifyPasscode(role, passcode)) {
        await appendAuditLog({
          action: "login_failed",
          role,
          actorId: name,
          actorName: name,
          detail: `Failed ${role} login attempt`,
          ip,
        });
        return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
      }
      const token = await createSession(role, name, name);
      await appendAuditLog({
        action: "login",
        role,
        actorId: name,
        actorName: name,
        detail: `${role} login`,
        ip,
      });
      return NextResponse.json({ ok: true, name, token });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
