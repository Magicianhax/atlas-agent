#!/usr/bin/env node
// beefy-withdraw.js — Withdraw from a Beefy auto-compounding vault
// Usage: echo '<json>' | node beefy-withdraw.js
// Input JSON: { chainId, vaultAddress, shares } (shares = mooToken amount, or "all")
// Output JSON: { success, txHash, vaultAddress, sharesWithdrawn } or { success: false, error }

const { createWalletClient, createPublicClient, http, encodeFunctionData } = require("/tmp/node_modules/viem");
const { privateKeyToAccount } = require("/tmp/node_modules/viem/accounts");
const { arbitrum, base, optimism } = require("/tmp/node_modules/viem/chains");

const CHAINS = { 42161: arbitrum, 8453: base, 10: optimism };

const RPC_URLS = {
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

const VAULT_ABI = [
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_shares", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdrawAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = JSON.parse(Buffer.concat(chunks).toString());

  const chainId = Number(input.chainId);
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

  const account = privateKeyToAccount(pk);
  const rpcUrl = RPC_URLS[chainId];

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

  const vaultAddress = input.vaultAddress;

  try {
    // Get current share balance
    const currentShares = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    if (currentShares === 0n) {
      console.log(JSON.stringify({ success: false, error: "No vault shares to withdraw" }));
      process.exit(1);
    }

    let txHash;
    let sharesWithdrawn;

    if (input.shares === "all" || !input.shares) {
      // Withdraw all
      txHash = await walletClient.sendTransaction({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "withdrawAll",
        }),
      });
      sharesWithdrawn = currentShares;
    } else {
      // Withdraw specific amount
      const shares = BigInt(input.shares);
      txHash = await walletClient.sendTransaction({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "withdraw",
          args: [shares],
        }),
      });
      sharesWithdrawn = shares;
    }

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(JSON.stringify({
      success: true,
      txHash,
      vaultAddress,
      sharesWithdrawn: sharesWithdrawn.toString(),
      chainId,
      from: account.address,
    }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
