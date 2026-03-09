import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const decisions = sqliteTable("decisions", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  phase: text("phase").notNull(), // RESEARCH | ORIENT | THESIS | PREDICT | EXECUTE | MONITOR
  title: text("title").notNull(),
  reasoning: text("reasoning").notNull(),
  observations: text("observations"), // JSON array
  thesis: text("thesis"),
  action: text("action"),
  confidence: integer("confidence"),
  metadata: text("metadata"), // JSON object
});

export const predictions = sqliteTable("predictions", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
  claim: text("claim").notNull(),
  evidence: text("evidence").notNull(), // JSON array
  counterEvidence: text("counter_evidence").notNull(), // JSON array
  confidence: integer("confidence").notNull(),
  timeframeHours: integer("timeframe_hours").notNull(),
  exitCriteria: text("exit_criteria").notNull(),
  status: text("status").notNull().default("pending"), // pending | correct | incorrect | expired | partially_correct
  outcome: text("outcome"),
  postMortem: text("post_mortem"),
  chainId: integer("chain_id"),
  category: text("category"),
});

export const portfolioSnapshots = sqliteTable("portfolio_snapshots", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  totalValueUsd: real("total_value_usd").notNull(),
  holdings: text("holdings").notNull(), // JSON array
  pnl24h: real("pnl_24h"),
  pnlTotal: real("pnl_total"),
});

export const positions = sqliteTable("positions", {
  id: text("id").primaryKey(),
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
  type: text("type").notNull(), // vault | pt | yt | lp | momentum
  protocol: text("protocol").notNull(), // beefy | pendle | aerodrome | lifi
  chainId: integer("chain_id").notNull(),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  amount: text("amount").notNull(),
  entryValueUsd: real("entry_value_usd").notNull(),
  currentValueUsd: real("current_value_usd"),
  entryPrice: real("entry_price"),
  stopLossPrice: real("stop_loss_price"),
  apy: real("apy"),
  maturity: text("maturity"),
  status: text("status").notNull().default("open"), // open | closed | stopped_out
  pnlUsd: real("pnl_usd"),
  decisionId: text("decision_id"),
  metadata: text("metadata"), // JSON
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  type: text("type").notNull(), // swap | bridge | approve | deposit | withdraw
  status: text("status").notNull(), // pending | confirmed | failed | bridging
  fromChainId: integer("from_chain_id").notNull(),
  toChainId: integer("to_chain_id").notNull(),
  fromToken: text("from_token").notNull(),
  toToken: text("to_token").notNull(),
  fromAmount: text("from_amount").notNull(),
  toAmount: text("to_amount"),
  valueUsd: real("value_usd").notNull(),
  txHash: text("tx_hash"),
  lifiRouteId: text("lifi_route_id"),
  gasCostUsd: real("gas_cost_usd"),
  bridgeFeeUsd: real("bridge_fee_usd"),
  decisionId: text("decision_id"),
  error: text("error"),
  updatedAt: text("updated_at"),
});
