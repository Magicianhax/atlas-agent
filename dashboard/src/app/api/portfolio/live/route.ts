import { NextResponse } from "next/server";
import {
  CHAIN_IDS,
  NATIVE_ETH,
  CHAIN_NAMES,
  type SupportedChainId,
} from "@/lib/tokens";
import { type Address } from "viem";

export const dynamic = "force-dynamic";

// Simple in-memory cache
let cachedResult: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

interface LiveHolding {
  chainId: number;
  token: string;
  tokenAddress: string;
  amount: number;
  valueUsd: number;
  type: "token" | "vault" | "lp" | "pt" | "yt";
  protocol?: string;
  apy?: number;
  metadata?: Record<string, unknown>;
}

const ALCHEMY_CHAIN_URLS: Record<number, string> = {
  42161: "https://arb-mainnet.g.alchemy.com/v2",
  8453: "https://base-mainnet.g.alchemy.com/v2",
  10: "https://opt-mainnet.g.alchemy.com/v2",
};

const DEFI_LLAMA_CHAIN_SLUGS: Record<number, string> = {
  42161: "arbitrum",
  8453: "base",
  10: "optimism",
};

// Known Beefy vault token prefixes
function detectTokenType(symbol: string): { type: LiveHolding["type"]; protocol?: string } {
  const s = symbol.toLowerCase();
  if (s.startsWith("moo")) return { type: "vault", protocol: "beefy" };
  if (s.startsWith("pt-")) return { type: "pt", protocol: "pendle" };
  if (s.startsWith("yt-")) return { type: "yt", protocol: "pendle" };
  if (s.includes("-lp") || s.includes("slp") || s.includes("vlp")) return { type: "lp" };
  return { type: "token" };
}

// Alchemy JSON-RPC helper
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

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

interface AlchemyTokenMeta {
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
}

// Fetch ALL token balances for a wallet on one chain via Alchemy
async function fetchChainBalances(
  chainId: SupportedChainId,
  wallet: Address
): Promise<LiveHolding[]> {
  const holdings: LiveHolding[] = [];

  // 1. Native ETH balance
  const ethHex = await alchemyRpc(chainId, "eth_getBalance", [wallet, "latest"]) as string | null;
  if (ethHex) {
    const ethWei = BigInt(ethHex);
    if (ethWei > BigInt(0)) {
      holdings.push({
        chainId,
        token: "ETH",
        tokenAddress: NATIVE_ETH,
        amount: Number(ethWei) / 1e18,
        valueUsd: 0,
        type: "token",
      });
    }
  }

  // 2. ALL ERC-20 balances via Alchemy's enhanced API
  const tokenResult = await alchemyRpc(chainId, "alchemy_getTokenBalances", [wallet]) as {
    tokenBalances: AlchemyTokenBalance[];
  } | null;

  if (!tokenResult?.tokenBalances) return holdings;

  // Filter to non-zero balances
  const nonZero = tokenResult.tokenBalances.filter(
    (t) => t.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      && BigInt(t.tokenBalance) > BigInt(0)
  );

  // 3. Fetch metadata for all non-zero tokens in parallel
  const metaResults = await Promise.allSettled(
    nonZero.map((t) =>
      alchemyRpc(chainId, "alchemy_getTokenMetadata", [t.contractAddress]) as Promise<AlchemyTokenMeta | null>
    )
  );

  for (let i = 0; i < nonZero.length; i++) {
    const tb = nonZero[i];
    const metaResult = metaResults[i];
    const meta = metaResult.status === "fulfilled" ? metaResult.value : null;

    if (!meta || !meta.symbol || meta.decimals == null) continue;

    const rawBalance = BigInt(tb.tokenBalance);
    // Use string division for precision safety with large 18-decimal balances
    const amount = Number(rawBalance) / 10 ** meta.decimals;

    // Skip dust (less than $0.001 worth typically)
    if (amount === 0) continue;

    const { type, protocol } = detectTokenType(meta.symbol);

    holdings.push({
      chainId,
      token: meta.symbol,
      tokenAddress: tb.contractAddress.toLowerCase(),
      amount,
      valueUsd: 0,
      type,
      protocol,
      metadata: type !== "token" ? { name: meta.name, decimals: meta.decimals, rawBalance: tb.tokenBalance } : undefined,
    });
  }

  return holdings;
}

// Fetch Beefy vault prices (lps.json gives price per vault share token)
async function fetchBeefyPrices(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://api.beefy.finance/lps");
    if (!res.ok) return {};
    return await res.json() as Record<string, number>;
  } catch {
    return {};
  }
}

// Fetch token prices from DefiLlama + Beefy
async function fetchPrices(
  tokens: { chainId: number; address: string; protocol?: string }[]
): Promise<Record<string, number>> {
  if (tokens.length === 0) return {};

  const coinIds = tokens.map((t) => {
    const slug = DEFI_LLAMA_CHAIN_SLUGS[t.chainId] ?? "ethereum";
    return `${slug}:${t.address}`;
  });

  coinIds.push("coingecko:ethereum");

  // Fetch DefiLlama and Beefy prices in parallel
  const [llamaRes, beefyPrices] = await Promise.all([
    fetch(`https://coins.llama.fi/prices/current/${coinIds.join(",")}`).catch(() => null),
    fetchBeefyPrices(),
  ]);

  const prices: Record<string, number> = {};

  if (llamaRes?.ok) {
    const data = await llamaRes.json();
    for (const [key, val] of Object.entries(data.coins || {})) {
      prices[key] = (val as { price: number }).price;
    }
  }

  // Beefy vault tokens are NOT priced by DefiLlama.
  // Mark them for on-chain valuation later (in the GET handler).
  // We just skip them here - they'll be valued separately.

  return prices;
}

// Get Beefy vault value: rawBalance * ppfs / 1e18 gives underlying amount in underlying decimals
// Then divide by 10^underlyingDecimals to get human-readable amount
async function getBeefyVaultValue(
  chainId: number,
  vaultAddress: string,
  rawBalance: bigint
): Promise<{ amount: number; valueUsd: number }> {
  // getPricePerFullShare() selector = 0x77c7b8fc
  const ppfsResult = await alchemyRpc(chainId, "eth_call", [
    { to: vaultAddress, data: "0x77c7b8fc" },
    "latest",
  ]) as string | null;

  // want() selector = 0x521eb273 — returns underlying token address
  const wantResult = await alchemyRpc(chainId, "eth_call", [
    { to: vaultAddress, data: "0x521eb273" },
    "latest",
  ]) as string | null;

  if (!ppfsResult || ppfsResult === "0x") return { amount: 0, valueUsd: 0 };

  try {
    const ppfs = BigInt(ppfsResult);
    // underlyingAmount (in underlying's raw units) = rawBalance * ppfs / 1e18
    const underlyingRaw = (rawBalance * ppfs) / BigInt(1e18);

    // Detect underlying decimals: if want() returns a known stablecoin, use 6
    // Default to 6 for USDC-based vaults (most common)
    let underlyingDecimals = 6;
    if (wantResult && wantResult !== "0x" && wantResult.length >= 66) {
      const wantAddr = "0x" + wantResult.slice(26).toLowerCase();
      // Check if underlying is an 18-decimal token (DAI, WETH)
      const eighteenDecimalTokens = [
        "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH Arb
        "0x4200000000000000000000000000000000000006", // WETH Base/OP
      ];
      if (eighteenDecimalTokens.includes(wantAddr)) {
        underlyingDecimals = 18;
      }
    }

    const amount = Number(underlyingRaw) / Math.pow(10, underlyingDecimals);
    // For stablecoin vaults, value ≈ amount. For other vaults, we'd need the underlying price.
    // Since our vaults are all USDC-based, $1 per unit is accurate.
    return { amount, valueUsd: amount };
  } catch {
    return { amount: 0, valueUsd: 0 };
  }
}

export async function GET() {
  if (cachedResult && Date.now() - cachedResult.ts < CACHE_TTL) {
    return NextResponse.json(cachedResult.data);
  }

  const wallet = process.env.AGENT_WALLET as Address | undefined;
  if (!wallet) {
    return NextResponse.json(
      { error: "AGENT_WALLET not configured" },
      { status: 500 }
    );
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ALCHEMY_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Fetch balances from all chains in parallel
  const chainResults = await Promise.allSettled(
    CHAIN_IDS.map((chainId) => fetchChainBalances(chainId, wallet))
  );

  const allHoldings: LiveHolding[] = [];
  for (const result of chainResults) {
    if (result.status === "fulfilled") {
      allHoldings.push(...result.value);
    }
  }

  // Collect tokens that need pricing
  const priceable = allHoldings
    .filter((h) => h.tokenAddress !== NATIVE_ETH)
    .map((h) => ({ chainId: h.chainId, address: h.tokenAddress, protocol: h.protocol }));

  const prices = await fetchPrices(priceable);

  // Apply prices
  const ethPrice = prices["coingecko:ethereum"] ?? 0;
  // Value Beefy vaults on-chain in parallel
  const beefyVaults = allHoldings.filter((h) => h.protocol === "beefy");
  if (beefyVaults.length > 0) {
    const vaultValues = await Promise.allSettled(
      beefyVaults.map((h) => {
        const rawHex = (h.metadata?.rawBalance as string) ?? "0x0";
        const rawBalance = BigInt(rawHex);
        return getBeefyVaultValue(h.chainId, h.tokenAddress, rawBalance);
      })
    );
    for (let i = 0; i < beefyVaults.length; i++) {
      const result = vaultValues[i];
      if (result.status === "fulfilled" && result.value.valueUsd > 0) {
        beefyVaults[i].amount = result.value.amount;
        beefyVaults[i].valueUsd = result.value.valueUsd;
      }
    }
  }

  for (const h of allHoldings) {
    if (h.protocol === "beefy") continue; // already valued above
    if (h.tokenAddress === NATIVE_ETH) {
      h.valueUsd = h.amount * ethPrice;
    } else {
      const slug = DEFI_LLAMA_CHAIN_SLUGS[h.chainId] ?? "ethereum";
      const key = `${slug}:${h.tokenAddress}`;
      const price = prices[key] ?? 0;
      h.valueUsd = h.amount * price;
    }
  }

  // Clean up internal metadata before sending to client
  for (const h of allHoldings) {
    if (h.metadata) {
      delete (h.metadata as Record<string, unknown>).rawBalance;
      delete (h.metadata as Record<string, unknown>).decimals;
      if (Object.keys(h.metadata).length === 0) h.metadata = undefined;
    }
  }

  // Filter out zero-value dust and sort
  const meaningful = allHoldings.filter((h) => h.valueUsd >= 0.001 || h.type !== "token");
  const totalValueUsd = meaningful.reduce((sum, h) => sum + h.valueUsd, 0);

  const response = {
    wallet,
    timestamp: new Date().toISOString(),
    totalValueUsd,
    holdings: meaningful.sort((a, b) => b.valueUsd - a.valueUsd),
  };

  cachedResult = { data: response, ts: Date.now() };

  return NextResponse.json(response);
}
