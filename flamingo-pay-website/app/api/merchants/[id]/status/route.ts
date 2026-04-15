import { NextRequest, NextResponse } from "next/server";
import {
  updateMerchantStatus,
  type MerchantStatus,
} from "../../../../../lib/store";

export const dynamic = "force-dynamic";

const VALID: MerchantStatus[] = ["pending", "approved", "rejected", "suspended"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { status?: MerchantStatus; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID.join(", ")}` },
      { status: 400 },
    );
  }
  if (body.status === "rejected" && !body.reason?.trim()) {
    return NextResponse.json(
      { error: "A reason is required when rejecting a merchant" },
      { status: 400 },
    );
  }
  const m = updateMerchantStatus(id, body.status, body.reason);
  if (!m) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ merchant: m });
}
