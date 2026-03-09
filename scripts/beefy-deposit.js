#!/usr/bin/env node
// beefy-deposit.js — Deposit into a Beefy auto-compounding vault
// Usage: echo '<json>' | node beefy-deposit.js
// Input JSON: { chainId, vaultAddress, wantTokenAddress, amount, decimals }
//   - If amount is "all" or "max", uses depositAll() to deposit entire balance
//   - If amount is close to actual balance (within 2%), automatically uses depositAll()
// Output JSON: { success, txHash, vaultAddress, shares } or { success: false, error }

const { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData, maxUint256 } = require("/tmp/node_modules/viem");
const { privateKeyToAccount } = require("/tmp/node_modules/viem/accounts");
const { arbitrum, base, optimism } = require("/tmp/node_modules/viem/chains");

const CHAINS = { 42161: arbitrum, 8453: base, 10: optimism };

const RPC_URLS = {
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "depositAll",
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
  const wantToken = input.wantTokenAddress;
  const decimals = input.decimals || 6;

  try {
    // Check actual token balance first
    const actualBalance = await publicClient.readContract({
      address: wantToken,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    if (actualBalance === 0n) {
      console.log(JSON.stringify({ success: false, error: "Zero token balance" }));
      process.exit(1);
    }

    const useAll = input.amount === "all" || input.amount === "max";
    let depositAmount;

    if (!useAll) {
      depositAmount = parseUnits(String(input.amount), decimals);
      // If requested amount is within 2% of actual balance or exceeds it, use depositAll
      const diff = depositAmount > actualBalance ? depositAmount - actualBalance : actualBalance - depositAmount;
      const threshold = actualBalance * 2n / 100n;
      if (depositAmount > actualBalance || diff <= threshold) {
        depositAmount = null; // will use depositAll
      }
    }

    // Step 1: Approve max to avoid repeated approvals and rounding issues
    const currentAllowance = await publicClient.readContract({
      address: wantToken,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account.address, vaultAddress],
    });

    const neededAllowance = depositAmount || actualBalance;
    if (currentAllowance < neededAllowance) {
      const approveHash = await walletClient.sendTransaction({
        to: wantToken,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vaultAddress, maxUint256],
        }),
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Step 2: Get shares balance before
    const sharesBefore = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    // Step 3: Deposit — use depositAll() when amount matches full balance
    let depositHash;
    if (!depositAmount) {
      depositHash = await walletClient.sendTransaction({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "depositAll",
          args: [],
        }),
      });
    } else {
      depositHash = await walletClient.sendTransaction({
        to: vaultAddress,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [depositAmount],
        }),
      });
    }

    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    // Step 4: Get shares received
    const sharesAfter = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    const sharesReceived = sharesAfter - sharesBefore;
    const method = depositAmount ? "deposit" : "depositAll";

    console.log(JSON.stringify({
      success: true,
      txHash: depositHash,
      vaultAddress,
      shares: sharesReceived.toString(),
      chainId,
      method,
      actualBalance: actualBalance.toString(),
      from: account.address,
    }));
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message || String(err) }));
    process.exit(1);
  }
}

main();
