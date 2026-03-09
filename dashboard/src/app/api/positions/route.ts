import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { positions } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";
import { generateId } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(positions)
    .orderBy(desc(positions.openedAt))
    .limit(200);

  const parsed = rows.map((r) => {
    let metadata = null;
    if (r.metadata) {
      try { metadata = JSON.parse(r.metadata); } catch { /* malformed JSON, skip */ }
    }
    return { ...r, metadata };
  });

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const id = body.id ?? generateId();
  const openedAt = body.openedAt ?? new Date().toISOString();

  const row = {
    id,
    openedAt,
    closedAt: body.closedAt ?? null,
    type: body.type,
    protocol: body.protocol,
    chainId: body.chainId,
    tokenAddress: body.tokenAddress,
    tokenSymbol: body.tokenSymbol,
    amount: String(body.amount),
    entryValueUsd: body.entryValueUsd,
    currentValueUsd: body.currentValueUsd ?? null,
    entryPrice: body.entryPrice ?? null,
    stopLossPrice: body.stopLossPrice ?? null,
    apy: body.apy ?? null,
    maturity: body.maturity ?? null,
    status: body.status ?? "open",
    pnlUsd: body.pnlUsd ?? null,
    decisionId: body.decisionId ?? null,
    metadata: body.metadata ? JSON.stringify(body.metadata) : null,
  };

  await db.insert(positions).values(row);

  const position = { ...row, metadata: body.metadata ?? null };
  sseManager.broadcast("position", position);

  return NextResponse.json(position, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.closedAt !== undefined) updates.closedAt = body.closedAt;
  if (body.currentValueUsd !== undefined) updates.currentValueUsd = body.currentValueUsd;
  if (body.pnlUsd !== undefined) updates.pnlUsd = body.pnlUsd;
  if (body.amount !== undefined) updates.amount = String(body.amount);
  if (body.apy !== undefined) updates.apy = body.apy;
  if (body.entryValueUsd !== undefined) updates.entryValueUsd = body.entryValueUsd;
  if (body.entryPrice !== undefined) updates.entryPrice = body.entryPrice;
  if (body.stopLossPrice !== undefined) updates.stopLossPrice = body.stopLossPrice;
  if (body.maturity !== undefined) updates.maturity = body.maturity;
  if (body.metadata !== undefined) updates.metadata = JSON.stringify(body.metadata);
  if (body.type !== undefined) updates.type = body.type;
  if (body.protocol !== undefined) updates.protocol = body.protocol;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db.update(positions).set(updates).where(eq(positions.id, body.id));

  const [updated] = await db
    .select()
    .from(positions)
    .where(eq(positions.id, body.id));

  if (!updated) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  let metadata = null;
  if (updated.metadata) {
    try { metadata = JSON.parse(updated.metadata); } catch { /* malformed JSON, skip */ }
  }
  const parsed = { ...updated, metadata };

  sseManager.broadcast("position", parsed);
  return NextResponse.json(parsed);
}
