import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decisions, predictions, transactions, portfolioSnapshots } from "@/lib/schema";
import { count, eq, desc, avg, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    [decisionCount],
    [predictionCount],
    [correctCount],
    [incorrectCount],
    [activePredictions],
    [tradeCount],
    [latestSnapshot],
    [avgConf],
  ] = await Promise.all([
    db.select({ value: count() }).from(decisions),
    db.select({ value: count() }).from(predictions),
    db.select({ value: count() }).from(predictions).where(eq(predictions.status, "correct")),
    db.select({ value: count() }).from(predictions).where(eq(predictions.status, "incorrect")),
    db.select({ value: count() }).from(predictions).where(eq(predictions.status, "pending")),
    db.select({ value: count() }).from(transactions).where(inArray(transactions.type, ["swap", "bridge"])),
    db.select().from(portfolioSnapshots).orderBy(desc(portfolioSnapshots.timestamp)).limit(1),
    db.select({ value: avg(predictions.confidence) }).from(predictions),
  ]);

  const resolved = correctCount.value + incorrectCount.value;
  const accuracy = resolved > 0 ? (correctCount.value / resolved) * 100 : 0;

  const currentValue = latestSnapshot?.totalValueUsd ?? 0;
  const pnlTotal = latestSnapshot?.pnlTotal ?? 0;

  return NextResponse.json({
    totalDecisions: decisionCount.value,
    totalPredictions: predictionCount.value,
    predictionAccuracy: Math.round(accuracy * 10) / 10,
    totalTradesExecuted: tradeCount.value,
    portfolioValueUsd: currentValue,
    pnlTotal: Math.round(pnlTotal * 100) / 100,
    activePredictions: activePredictions.value,
    avgConfidence: Math.round(Number(avgConf.value ?? 0) * 10) / 10,
  });
}
