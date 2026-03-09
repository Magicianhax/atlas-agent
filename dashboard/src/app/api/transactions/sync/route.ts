import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { validateApiKey } from "@/lib/auth";
import { sseManager } from "@/lib/sse";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/transactions/sync
//
// Scans on-chain transactions from Alchemy for the agent wallet across all
// supported chains, deduplicates against the DB by txHash, and inserts any
// missing transactions. Returns the count of newly synced records.
//
// This is the PERMANENT fix: instead of relying on the cron job to POST
// each transaction, we scan the chain as the source of truth.
//
// Can be called:
// 1. On page load (frontend)   — GET variant below
// 2. Via cron/heartbeat         — POST with API key
// 3. Manually                   — POST with API key
// ---------------------------------------------------------------------------

const ALCHEMY_CHAIN_URLS: Record<number, string> = {
  42161: "https://arb-mainnet.g.alchemy.com/v2",
  8453: "https://base-mainnet.g.alchemy.com/v2",
  10: "https://opt-mainnet.g.alchemy.com/v2",
};

const CHAIN_IDS = [42161, 8453, 10];

// LI.FI diamond contract
const LIFI_DIAMOND = "0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae";

// Known vault addresses → names (lowercase)
const VAULT_CONTRACTS: Record<string, { name: string; type: string }> = {
  "0x24a4fc8d00e33a3b7f158e3a455b88e674941dac": { name: "mooEulerArbUSDC", type: "deposit" },
  "0xef6ed674486e54507d0f711c0d388bd8a1552e6f": { name: "mooCompoundBaseUSDC", type: "deposit" },
  "0xf779fba773b28472749c071c5185e99014850406": { name: "mooMorphoIonicUSDC", type: "deposit" },
  "0xb3d2afbbc8485e3c89c8e511470988526763eaa8": { name: "mooMorphoOpGauntletPrime", type: "deposit" },
  "0x99925188f1b92661a443376319370acff1d68b87": { name: "mooMorphoArbHyperithmUSDC", type: "deposit" },
};

// Well-known token symbols by address (lowercase)
const TOKEN_SYMBOLS: Record<string, { symbol: string; decimals: number }> = {
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { symbol: "USDC", decimals: 6 },
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": { symbol: "USDC.e", decimals: 6 },
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { symbol: "USDT", decimals: 6 },
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": { symbol: "WETH", decimals: 18 },
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { symbol: "USDC", decimals: 6 },
  "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": { symbol: "USDC", decimals: 6 },
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607": { symbol: "USDC.e", decimals: 6 },
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": { symbol: "USDT", decimals: 6 },
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": { symbol: "DAI", decimals: 18 },
  // Growth tokens
  "0x912ce59144191c1204e64559fe8253a0e49e6548": { symbol: "ARB", decimals: 18 },
  "0x532f27101965dd16442e59d40670faf5ebb142e4": { symbol: "BRETT", decimals: 18 },
};

// Stablecoins for USD valuation
const STABLECOINS = new Set(["USDC", "USDC.e", "USDT", "DAI"]);

interface AlchemyTransfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string;
  value: number;
  asset: string | null;
  category: string;
  rawContract: {
    value: string | null;
    address: string | null;
    decimal: string | null;
  };
}

async function alchemyRpc(chainId: number, method: string, params: unknown[]): Promise<unknown> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return null;
  const url = `${ALCHEMY_CHAIN_URLS[chainId]}/${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

async function getBlockTimestamp(chainId: number, blockHex: string): Promise<string> {
  const block = await alchemyRpc(chainId, "eth_getBlockByNumber", [blockHex, false]) as { timestamp: string } | null;
  if (!block?.timestamp) return new Date().toISOString();
  const ts = parseInt(block.timestamp, 16);
  return new Date(ts * 1000).toISOString();
}

function classifyTransfer(
  transfer: AlchemyTransfer,
  wallet: string,
  chainId: number,
  direction: "from" | "to"
): {
  type: string;
  fromToken: string;
  toToken: string;
  fromChainId: number;
  toChainId: number;
  valueUsd: number;
  fromAmount: string;
} | null {
  const walletLower = wallet.toLowerCase();
  const toLower = transfer.to?.toLowerCase() ?? "";
  const fromLower = transfer.from?.toLowerCase() ?? "";
  const asset = transfer.asset ?? "ETH";
  const value = transfer.value ?? 0;

  // Resolve token symbol
  const contractAddr = transfer.rawContract?.address?.toLowerCase();
  const tokenInfo = contractAddr ? TOKEN_SYMBOLS[contractAddr] : null;
  const symbol = tokenInfo?.symbol ?? asset;

  // Determine USD value
  let valueUsd = 0;
  if (STABLECOINS.has(symbol)) {
    valueUsd = value;
  } else if (symbol === "ETH" || symbol === "WETH") {
    // Rough ETH price — will be refined by DefiLlama if needed
    valueUsd = value * 1950; // conservative estimate
  }

  if (direction === "from") {
    // Outgoing from wallet
    // Check if it's a vault deposit
    const vault = VAULT_CONTRACTS[toLower];
    if (vault) {
      return {
        type: "deposit",
        fromToken: symbol,
        toToken: vault.name,
        fromChainId: chainId,
        toChainId: chainId,
        valueUsd,
        fromAmount: value.toFixed(4),
      };
    }

    // Check if it's going to LI.FI (bridge or swap)
    if (toLower === LIFI_DIAMOND) {
      // We'll mark as "swap" — could be bridge too but we can't tell from transfer alone
      // The frontend already handles both
      return {
        type: "swap",
        fromToken: symbol,
        toToken: symbol, // will be corrected if we find the matching inbound
        fromChainId: chainId,
        toChainId: chainId,
        valueUsd,
        fromAmount: value.toFixed(4),
      };
    }

    // Burn (vault token sent to 0x0) = withdraw
    if (toLower === "0x0000000000000000000000000000000000000000") {
      // This is a vault share burn — it's part of a withdraw
      // Skip these as the actual withdraw will show up as an inbound USDC
      return null;
    }

    // Generic outgoing transfer
    return {
      type: "swap",
      fromToken: symbol,
      toToken: symbol,
      fromChainId: chainId,
      toChainId: chainId,
      valueUsd,
      fromAmount: value.toFixed(4),
    };
  } else {
    // Incoming to wallet
    const vault = VAULT_CONTRACTS[fromLower];
    if (vault) {
      return {
        type: "withdraw",
        fromToken: vault.name,
        toToken: symbol,
        fromChainId: chainId,
        toChainId: chainId,
        valueUsd,
        fromAmount: value.toFixed(4),
      };
    }

    // Incoming from LI.FI = bridge receive
    if (fromLower === LIFI_DIAMOND) {
      return {
        type: "bridge",
        fromToken: symbol,
        toToken: symbol,
        fromChainId: chainId, // destination chain
        toChainId: chainId,
        valueUsd,
        fromAmount: value.toFixed(4),
      };
    }

    // Minted vault tokens (from 0x0) = part of deposit, skip
    if (fromLower === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return null; // ignore random inbound
  }
}

async function fetchChainTransfers(
  chainId: number,
  wallet: string,
  direction: "from" | "to"
): Promise<AlchemyTransfer[]> {
  const param: Record<string, unknown> = {
    fromBlock: "0x0",
    toBlock: "latest",
    category: ["external", "erc20"],
    order: "desc",
    maxCount: "0x20", // 32 recent txs
  };

  if (direction === "from") {
    param.fromAddress = wallet;
  } else {
    param.toAddress = wallet;
  }

  const result = await alchemyRpc(chainId, "alchemy_getAssetTransfers", [param]) as {
    transfers: AlchemyTransfer[];
  } | null;

  return result?.transfers ?? [];
}

async function syncChain(chainId: number, wallet: string, existingHashes: Set<string>): Promise<unknown[]> {
  const newRows: unknown[] = [];

  // Fetch both directions
  const [fromTransfers, toTransfers] = await Promise.all([
    fetchChainTransfers(chainId, wallet, "from"),
    fetchChainTransfers(chainId, wallet, "to"),
  ]);

  // Process outgoing transfers
  for (const t of fromTransfers) {
    const hash = t.hash.toLowerCase();
    if (existingHashes.has(hash)) continue;

    const classified = classifyTransfer(t, wallet, chainId, "from");
    if (!classified) continue;

    const timestamp = await getBlockTimestamp(chainId, t.blockNum);
    const now = new Date().toISOString();
    const row = {
      id: generateId(),
      timestamp,
      type: classified.type,
      status: "confirmed",
      fromChainId: classified.fromChainId,
      toChainId: classified.toChainId,
      fromToken: classified.fromToken,
      toToken: classified.toToken,
      fromAmount: classified.fromAmount,
      toAmount: null,
      valueUsd: classified.valueUsd,
      txHash: t.hash,
      lifiRouteId: null,
      gasCostUsd: null,
      bridgeFeeUsd: null,
      decisionId: null,
      error: null,
      updatedAt: now,
    };

    await db.insert(transactions).values(row);
    existingHashes.add(hash); // prevent double-insert from toTransfers
    sseManager.broadcast("transaction", row);
    newRows.push(row);
  }

  // Process incoming transfers (for withdrawals, bridge receives)
  for (const t of toTransfers) {
    const hash = t.hash.toLowerCase();
    if (existingHashes.has(hash)) continue;

    const classified = classifyTransfer(t, wallet, chainId, "to");
    if (!classified) continue;

    const timestamp = await getBlockTimestamp(chainId, t.blockNum);
    const now = new Date().toISOString();
    const row = {
      id: generateId(),
      timestamp,
      type: classified.type,
      status: "confirmed",
      fromChainId: classified.fromChainId,
      toChainId: classified.toChainId,
      fromToken: classified.fromToken,
      toToken: classified.toToken,
      fromAmount: classified.fromAmount,
      toAmount: null,
      valueUsd: classified.valueUsd,
      txHash: t.hash,
      lifiRouteId: null,
      gasCostUsd: null,
      bridgeFeeUsd: null,
      decisionId: null,
      error: null,
      updatedAt: now,
    };

    await db.insert(transactions).values(row);
    existingHashes.add(hash);
    sseManager.broadcast("transaction", row);
    newRows.push(row);
  }

  return newRows;
}

// Rate-limit: allow unauthenticated GET at most once per 60 seconds
let lastSyncTime = 0;
let lastSyncResult: { synced: number; transactions: unknown[]; timestamp: string } | null = null;
const SYNC_COOLDOWN_MS = 60_000;

// GET — unauthenticated, called by frontend on page load
// Triggers a sync and returns the result
export async function GET() {
  const now = Date.now();
  if (lastSyncResult && now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return NextResponse.json(lastSyncResult);
  }
  const wallet = process.env.AGENT_WALLET;
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!wallet || !apiKey) {
    return NextResponse.json(
      { error: "AGENT_WALLET or ALCHEMY_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Get all existing tx hashes from DB
  const existing = await db.select({ txHash: transactions.txHash }).from(transactions);
  const existingHashes = new Set(
    existing.map((r) => r.txHash?.toLowerCase()).filter(Boolean) as string[]
  );

  // Sync all chains in parallel
  const results = await Promise.allSettled(
    CHAIN_IDS.map((chainId) => syncChain(chainId, wallet, existingHashes))
  );

  const synced: unknown[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") synced.push(...r.value);
  }

  lastSyncResult = {
    synced: synced.length,
    transactions: synced,
    timestamp: new Date().toISOString(),
  };
  lastSyncTime = Date.now();

  return NextResponse.json(lastSyncResult);
}

// POST — authenticated, called by cron/heartbeat
export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Same logic as GET
  const wallet = process.env.AGENT_WALLET;
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!wallet || !apiKey) {
    return NextResponse.json(
      { error: "AGENT_WALLET or ALCHEMY_API_KEY not configured" },
      { status: 500 }
    );
  }

  const existing = await db.select({ txHash: transactions.txHash }).from(transactions);
  const existingHashes = new Set(
    existing.map((r) => r.txHash?.toLowerCase()).filter(Boolean) as string[]
  );

  const results = await Promise.allSettled(
    CHAIN_IDS.map((chainId) => syncChain(chainId, wallet, existingHashes))
  );

  const synced: unknown[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") synced.push(...r.value);
  }

  return NextResponse.json({
    synced: synced.length,
    transactions: synced,
    timestamp: new Date().toISOString(),
  });
}
