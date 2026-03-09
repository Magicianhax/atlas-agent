import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decisions } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
import { generateId } from "@/lib/utils";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(decisions)
    .orderBy(desc(decisions.timestamp))
    .limit(100);

  const parsed = rows.map((r) => ({
    ...r,
    observations: r.observations ? JSON.parse(r.observations) : [],
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const id = generateId();
  const timestamp = new Date().toISOString();

  const row = {
    id,
    timestamp,
    phase: body.phase,
    title: body.title,
    reasoning: body.reasoning,
    observations: body.observations ? JSON.stringify(body.observations) : null,
    thesis: body.thesis ?? null,
    action: body.action ?? null,
    confidence: body.confidence ?? null,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  };

  await db.insert(decisions).values(row);

  const decision = {
    ...row,
    observations: body.observations ?? [],
    metadata: body.metadata ?? {},
  };

  sseManager.broadcast("decision", decision);

  return NextResponse.json(decision, { status: 201 });
}
