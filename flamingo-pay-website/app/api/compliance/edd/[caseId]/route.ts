import { NextRequest, NextResponse } from "next/server";
import {
  getEDDCase,
  assignEDDCase,
  completeEDDCheck,
  waiveEDDCheck,
  decideEDDCase,
  addEDDNote,
  closeEDDCase,
  type EDDCheckType,
} from "../../../../../lib/edd";
import { requireSession } from "../../../../../lib/api-auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ caseId: string }> };

/**
 * GET /api/compliance/edd/[caseId]
 * Get full EDD case detail including checks and timeline.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { caseId } = await params;
  const eddCase = await getEDDCase(caseId);
  if (!eddCase) {
    return NextResponse.json({ error: "EDD case not found" }, { status: 404 });
  }

  return NextResponse.json({ case: eddCase });
}

/**
 * PATCH /api/compliance/edd/[caseId]
 * Update an EDD case. Supports multiple actions via the `action` field:
 * - assign: Assign to a compliance officer
 * - complete_check: Mark a check as completed
 * - waive_check: Waive a non-required check
 * - decide: Senior management decision (approve/reject)
 * - add_note: Add a note to the timeline
 * - close: Close the case
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let session = await requireSession("compliance");
  if (session instanceof Response) session = await requireSession("admin");
  if (session instanceof Response) return session;

  const { caseId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string;
  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  let result;

  switch (action) {
    case "assign": {
      const officerName = body.officerName as string;
      if (!officerName) return NextResponse.json({ error: "officerName required" }, { status: 400 });
      result = await assignEDDCase(caseId, officerName);
      break;
    }

    case "complete_check": {
      const checkType = body.checkType as EDDCheckType;
      const completedBy = body.completedBy as string;
      const findings = body.findings as string;
      if (!checkType || !completedBy || !findings) {
        return NextResponse.json({ error: "checkType, completedBy, and findings required" }, { status: 400 });
      }
      result = await completeEDDCheck(caseId, checkType, {
        completedBy,
        findings,
        documentRef: body.documentRef as string | undefined,
      });
      break;
    }

    case "waive_check": {
      const waiveCheckType = body.checkType as EDDCheckType;
      const waivedBy = body.waivedBy as string;
      const justification = body.justification as string;
      if (!waiveCheckType || !waivedBy || !justification) {
        return NextResponse.json({ error: "checkType, waivedBy, and justification required" }, { status: 400 });
      }
      result = await waiveEDDCheck(caseId, waiveCheckType, { waivedBy, justification });
      break;
    }

    case "decide": {
      const decision = body.decision as "approved" | "rejected";
      const decidedBy = body.decidedBy as string;
      const note = body.note as string;
      if (!decision || !decidedBy || !note) {
        return NextResponse.json({ error: "decision, decidedBy, and note required" }, { status: 400 });
      }
      if (decision !== "approved" && decision !== "rejected") {
        return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
      }
      result = await decideEDDCase(caseId, {
        decision,
        decidedBy,
        note,
        conditions: body.conditions as string[] | undefined,
      });
      break;
    }

    case "add_note": {
      const actor = body.actor as string;
      const noteText = body.note as string;
      if (!actor || !noteText) {
        return NextResponse.json({ error: "actor and note required" }, { status: 400 });
      }
      result = await addEDDNote(caseId, actor, noteText);
      break;
    }

    case "close": {
      const closedBy = body.closedBy as string;
      const reason = body.reason as string;
      if (!closedBy || !reason) {
        return NextResponse.json({ error: "closedBy and reason required" }, { status: 400 });
      }
      result = await closeEDDCase(caseId, closedBy, reason);
      break;
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}. Use: assign, complete_check, waive_check, decide, add_note, close` },
        { status: 400 },
      );
  }

  if (!result) {
    return NextResponse.json({ error: "EDD case not found or action not applicable" }, { status: 404 });
  }

  return NextResponse.json({ case: result });
}
