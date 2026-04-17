import { NextRequest, NextResponse } from "next/server";
import {
  updateMerchantStatus,
  type MerchantStatus,
} from "../../../../../lib/store";
import { appendAuditLog } from "../../../../../lib/audit";

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
  const m = await updateMerchantStatus(id, body.status, body.reason);
  if (!m) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const actionMap: Record<string, string> = {
    approved: "merchant_approved",
    rejected: "merchant_rejected",
    suspended: "merchant_suspended",
    pending: "merchant_unsuspended",
  };
  await appendAuditLog({
    action: (actionMap[body.status] ?? "merchant_profile_updated") as import("../../../../../lib/audit").AuditAction,
    role: "admin",
    actorId: "admin",
    actorName: "Admin",
    targetId: id,
    targetType: "merchant",
    detail: `Merchant status changed to ${body.status}${body.reason ? `: ${body.reason}` : ""}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ merchant: m });
}
