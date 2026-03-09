import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { predictions } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
import { generateId } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(predictions)
    .orderBy(desc(predictions.createdAt))
    .limit(200);

  const parsed = rows.map((r) => {
    let evidence: unknown = [];
    let counterEvidence: unknown = [];
    try { evidence = JSON.parse(r.evidence); } catch { /* malformed */ }
    try { counterEvidence = JSON.parse(r.counterEvidence); } catch { /* malformed */ }
    return { ...r, evidence, counterEvidence };
  });

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const row = {
    id,
    createdAt,
    claim: body.claim,
    evidence: JSON.stringify(body.evidence),
    counterEvidence: JSON.stringify(body.counterEvidence),
    confidence: body.confidence,
    timeframeHours: body.timeframeHours,
    exitCriteria: body.exitCriteria,
    status: "pending" as const,
    chainId: body.chainId ?? null,
    category: body.category ?? null,
    resolvedAt: null,
    outcome: null,
    postMortem: null,
  };

  await db.insert(predictions).values(row);

  const prediction = {
    ...row,
    evidence: body.evidence,
    counterEvidence: body.counterEvidence,
  };

  sseManager.broadcast("prediction", prediction);

  return NextResponse.json(prediction, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const { id, status, outcome, postMortem } = body;

  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status required" },
      { status: 400 }
    );
  }

  const isResolved = ["correct", "incorrect", "expired", "partially_correct"].includes(status);
  const resolvedAt = isResolved ? new Date().toISOString() : null;

  await db
    .update(predictions)
    .set({
      status,
      outcome: outcome ?? null,
      postMortem: postMortem ?? null,
      ...(isResolved ? { resolvedAt } : { resolvedAt: null }),
    })
    .where(eq(predictions.id, id));

  const [updated] = await db
    .select()
    .from(predictions)
    .where(eq(predictions.id, id));

  if (updated) {
    let evidence: unknown = [];
    let counterEvidence: unknown = [];
    try { evidence = JSON.parse(updated.evidence); } catch { /* malformed */ }
    try { counterEvidence = JSON.parse(updated.counterEvidence); } catch { /* malformed */ }
    const parsed = { ...updated, evidence, counterEvidence };
    sseManager.broadcast("prediction", parsed);
    return NextResponse.json(parsed);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
