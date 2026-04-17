import { NextResponse } from "next/server";
import { complianceStats } from "../../../../lib/store";
import { requireSession } from "../../../../lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;
  const s = await complianceStats();
  return NextResponse.json(s);
}
