#!/usr/bin/env node
// approve-token.js — Approves an ERC-20 token for LI.FI diamond contract
// Usage: node approve-token.js <chainId> <tokenAddress> <amount>
// amount: in wei (hex or decimal), or "max" for unlimited approval

const { createWalletClient, createPublicClient, http, encodeFunctionData, parseAbi } = require("/tmp/node_modules/viem");
const { privateKeyToAccount } = require("/tmp/node_modules/viem/accounts");
const { arbitrum, base, optimism } = require("/tmp/node_modules/viem/chains");

const CHAINS = { 42161: arbitrum, 8453: base, 10: optimism };
const RPC_URLS = {
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

// LI.FI Diamond contract — same on all EVM chains
const LIFI_DIAMOND = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

async function main() {
  const [,, chainIdStr, tokenAddress, amountStr] = process.argv;

  if (!chainIdStr || !tokenAddress) {
    console.log(JSON.stringify({ success: false, error: "Usage: node approve-token.js <chainId> <tokenAddress> <amount|max>" }));
    process.exit(1);
  }

  const chainId = Number(chainIdStr);
  const chain = CHAINS[chainId];
  if (!chain) {
    console.log(JSON.stringify({ success: false, error: `Unsupported chainId: ${chainId}` }));
    process.exit(1);
  }

  const pk = process.env.ATLAS_WALLET_PK;
  if (!pk) {
    console.log(JSON.stringify({ success: false, error: "ATLAS_WALLET_PK not set" }));
    process.exit(1);
  }

  const amount = amountStr === "max"
    ? 2n ** 256n - 1n  // type(uint256).max
    : BigInt(amountStr || "0");

  const account = privateKeyToAccount(pk);
  const rpcUrl = RPC_URLS[chainId];

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

  try {
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account.address, LIFI_DIAMOND],
    });

    if (currentAllowance >= amount) {
      console.log(JSON.stringify({
        success: true,
        txHash: null,
        message: `Already approved. Current allowance: ${currentAllowance.toString()}`,
        chainId,
      }));
      return;
    }

    // Send approve transaction
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [LIFI_DIAMOND, amount],
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(JSON.stringify({
      success: true,
      txHash: hash,
      status: receipt.status === "success" ? "confirmed" : "reverted",
      chainId,
      spender: LIFI_DIAMOND,
      amount: amount.toString(),
    }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
