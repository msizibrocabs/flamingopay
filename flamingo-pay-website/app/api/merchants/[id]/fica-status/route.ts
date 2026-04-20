/**
 * GET /api/merchants/[id]/fica-status — FICA compliance status for a merchant.
 * Admin or compliance session required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/api-auth";
import { getFICAStatus } from "../../../../../lib/fica";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { id } = await params;
  const status = await getFICAStatus(id);
  return NextResponse.json(status);
}
