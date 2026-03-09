import { createPublicClient, http, type PublicClient } from "viem";
import { arbitrum, base, optimism } from "viem/chains";
import type { SupportedChainId } from "./tokens";

const CHAINS_CONFIG = {
  42161: arbitrum,
  8453: base,
  10: optimism,
} as const;

const RPC_URLS: Record<number, string> = {
  42161: process.env.ALCHEMY_API_KEY
    ? `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : "https://arb1.arbitrum.io/rpc",
  8453: process.env.ALCHEMY_API_KEY
    ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : "https://mainnet.base.org",
  10: process.env.ALCHEMY_API_KEY
    ? `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : "https://mainnet.optimism.io",
};

const clients: Partial<Record<SupportedChainId, PublicClient>> = {};

export function getPublicClient(chainId: SupportedChainId): PublicClient {
  if (!clients[chainId]) {
    const chain = CHAINS_CONFIG[chainId];
    clients[chainId] = createPublicClient({
      chain,
      transport: http(RPC_URLS[chainId]),
      batch: { multicall: true },
    }) as PublicClient;
  }
  return clients[chainId]!;
}

// ERC-20 balanceOf ABI for multicall
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Beefy vault ABI for getPricePerFullShare
export const BEEFY_VAULT_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getPricePerFullShare",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
