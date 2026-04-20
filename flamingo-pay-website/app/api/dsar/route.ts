/**
 * POST /api/dsar — Submit a new data subject access request (public).
 */

import { NextRequest, NextResponse } from "next/server";
import { createDsar } from "../../../lib/dsar";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requesterType, fullName, email, phone, idNumber, merchantId, description } = body;

    if (!fullName || !email || !phone || !description || !requesterType) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, phone, description, requesterType." },
        { status: 400 },
      );
    }

    if (!["buyer", "merchant"].includes(requesterType)) {
      return NextResponse.json({ error: "requesterType must be 'buyer' or 'merchant'." }, { status: 400 });
    }

    const result = await createDsar({
      requesterType,
      fullName,
      email,
      phone,
      idNumber,
      merchantId,
      description,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ dsar: { ref: result.ref, deadline: result.deadline } }, { status: 201 });
  } catch (err) {
    console.error("[dsar] Create error:", err);
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
  }
}
