import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
import { generateId } from "@/lib/utils";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.timestamp))
    .limit(200);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const id = body.id ?? generateId();
  const timestamp = body.timestamp ?? new Date().toISOString();

  const now = new Date().toISOString();

  const row = {
    id,
    timestamp,
    type: body.type,
    status: body.status ?? "pending",
    fromChainId: body.fromChainId,
    toChainId: body.toChainId,
    fromToken: body.fromToken,
    toToken: body.toToken,
    fromAmount: body.fromAmount,
    toAmount: body.toAmount ?? null,
    valueUsd: body.valueUsd,
    txHash: body.txHash ?? null,
    lifiRouteId: body.lifiRouteId ?? null,
    gasCostUsd: body.gasCostUsd ?? null,
    bridgeFeeUsd: body.bridgeFeeUsd ?? null,
    decisionId: body.decisionId ?? null,
    error: body.error ?? null,
    updatedAt: now,
  };

  await db.insert(transactions).values(row);
  sseManager.broadcast("transaction", row);

  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const allowedFields = ["status", "txHash", "toAmount", "gasCostUsd", "bridgeFeeUsd", "error", "lifiRouteId", "timestamp"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Always stamp updated_at on mutations
  updates.updatedAt = new Date().toISOString();

  await db.update(transactions).set(updates).where(eq(transactions.id, id));

  const [updated] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));

  if (updated) {
    sseManager.broadcast("transaction", updated);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
