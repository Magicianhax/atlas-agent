import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioSnapshots } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
import { generateId } from "@/lib/utils";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(portfolioSnapshots)
    .orderBy(desc(portfolioSnapshots.timestamp))
    .limit(500);

  const parsed = rows.map((r) => {
    let holdings: unknown[] = [];
    try {
      holdings = typeof r.holdings === "string" ? JSON.parse(r.holdings) : r.holdings;
    } catch {
      holdings = [];
    }
    return { ...r, holdings };
  });

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
    totalValueUsd: body.totalValueUsd,
    holdings: JSON.stringify(body.holdings),
    pnl24h: body.pnl24h ?? null,
    pnlTotal: body.pnlTotal ?? null,
  };

  await db.insert(portfolioSnapshots).values(row);

  const snapshot = {
    ...row,
    holdings: body.holdings,
  };

  sseManager.broadcast("portfolio", snapshot);

  return NextResponse.json(snapshot, { status: 201 });
}
