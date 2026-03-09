#!/usr/bin/env node
// sign-and-send.js — Signs and broadcasts a transaction using viem
// Usage: echo '<json>' | node sign-and-send.js
// Input JSON: { chainId, to, data, value, gasLimit } (from LI.FI transactionRequest)
// Output JSON: { success, txHash } or { success: false, error }

const { createWalletClient, createPublicClient, http, defineChain } = require("/tmp/node_modules/viem");
const { privateKeyToAccount } = require("/tmp/node_modules/viem/accounts");
const { arbitrum, base, optimism } = require("/tmp/node_modules/viem/chains");

const CHAINS = {
  42161: arbitrum,
  8453: base,
  10: optimism,
};

const RPC_URLS = {
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

async function main() {
  // Read stdin
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = JSON.parse(Buffer.concat(chunks).toString());

  const chainId = Number(input.chainId);
  const chain = CHAINS[chainId];
  if (!chain) {
    console.log(JSON.stringify({ success: false, error: `Unsupported chainId: ${chainId}` }));
    process.exit(1);
  }

  const rpcUrl = RPC_URLS[chainId];
  const pk = process.env.ATLAS_WALLET_PK;
  if (!pk) {
    console.log(JSON.stringify({ success: false, error: "ATLAS_WALLET_PK not set" }));
    process.exit(1);
  }

  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  try {
    // Estimate gas if not provided
    let gasLimit = input.gasLimit ? BigInt(input.gasLimit) : undefined;
    if (!gasLimit) {
      gasLimit = await publicClient.estimateGas({
        account: account.address,
        to: input.to,
        data: input.data,
        value: input.value ? BigInt(input.value) : 0n,
      });
      // Add 20% buffer
      gasLimit = (gasLimit * 120n) / 100n;
    }

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: input.to,
      data: input.data,
      value: input.value ? BigInt(input.value) : 0n,
      gas: gasLimit,
    });

    console.log(JSON.stringify({ success: true, txHash: hash, chainId, from: account.address }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
