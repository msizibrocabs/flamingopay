import { NextResponse } from "next/server";
import { complianceStats } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await complianceStats();
  return NextResponse.json(s);
}
