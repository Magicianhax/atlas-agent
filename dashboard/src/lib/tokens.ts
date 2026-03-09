export interface TokenDef {
  address: string;
  symbol: string;
  decimals: number;
  type: "token" | "vault" | "lp" | "pt" | "yt";
  protocol?: string;
  underlyingAddress?: string; // for vault/PT tokens, the underlying asset
}

// Native ETH placeholder
export const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Well-known tokens per chain
export const TOKEN_REGISTRY: Record<number, TokenDef[]> = {
  // Arbitrum
  42161: [
    { address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", symbol: "USDC", decimals: 6, type: "token" },
    { address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", symbol: "USDC.e", decimals: 6, type: "token" },
    { address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", symbol: "USDT", decimals: 6, type: "token" },
    { address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", symbol: "WETH", decimals: 18, type: "token" },
    { address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", symbol: "DAI", decimals: 18, type: "token" },
  ],
  // Base
  8453: [
    { address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", symbol: "USDC", decimals: 6, type: "token" },
    { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, type: "token" },
    { address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", symbol: "DAI", decimals: 18, type: "token" },
  ],
  // Optimism
  10: [
    { address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", symbol: "USDC", decimals: 6, type: "token" },
    { address: "0x7f5c764cbc14f9669b88837ca1490cca17c31607", symbol: "USDC.e", decimals: 6, type: "token" },
    { address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", symbol: "USDT", decimals: 6, type: "token" },
    { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, type: "token" },
    { address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", symbol: "DAI", decimals: 18, type: "token" },
  ],
};

export const CHAIN_IDS = [42161, 8453, 10] as const;
export type SupportedChainId = (typeof CHAIN_IDS)[number];

export const CHAIN_NAMES: Record<number, string> = {
  42161: "Arbitrum",
  8453: "Base",
  10: "Optimism",
};
