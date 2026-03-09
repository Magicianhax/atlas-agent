#!/usr/bin/env node
// wait-for-tx.js — Waits for a transaction to be confirmed and returns the receipt
// Usage: node wait-for-tx.js <chainId> <txHash>

const { createPublicClient, http } = require("/tmp/node_modules/viem");
const { arbitrum, base, optimism } = require("/tmp/node_modules/viem/chains");

const CHAINS = { 42161: arbitrum, 8453: base, 10: optimism };
const RPC_URLS = {
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

async function main() {
  const [,, chainIdStr, txHash] = process.argv;

  if (!chainIdStr || !txHash) {
    console.log(JSON.stringify({ success: false, error: "Usage: node wait-for-tx.js <chainId> <txHash>" }));
    process.exit(1);
  }

  const chainId = Number(chainIdStr);
  const chain = CHAINS[chainId];
  if (!chain) {
    console.log(JSON.stringify({ success: false, error: `Unsupported chainId: ${chainId}` }));
    process.exit(1);
  }

  const rpcUrl = RPC_URLS[chainId];
  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000, // 2 min timeout
    });

    console.log(JSON.stringify({
      success: true,
      txHash: receipt.transactionHash,
      status: receipt.status === "success" ? "confirmed" : "reverted",
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
