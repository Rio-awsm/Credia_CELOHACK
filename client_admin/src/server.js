import express from "express";
import bodyParser from "body-parser";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(join(process.cwd(), "src", "public")));

const RPC_URL =
  process.env.CELO_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!CONTRACT_ADDRESS) {
  console.error("CONTRACT_ADDRESS not set in .env");
}
if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY not set in .env");
}

// Load ABI from artifacts folder (reuse server artifact)
const artifactPath = join(
  process.cwd(),
  "..",
  "server",
  "artifacts",
  "contracts",
  "TaskEscrow.sol",
  "TaskEscrow.json"
);
let TaskEscrowABI;
try {
  TaskEscrowABI = JSON.parse(readFileSync(artifactPath, "utf8")).abi;
} catch (err) {
  console.error(
    "Failed to load TaskEscrow ABI from artifacts. Make sure path exists:",
    artifactPath
  );
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY || ethers.ZeroHash, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, TaskEscrowABI, wallet);

// Simple health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", contract: CONTRACT_ADDRESS });
});

// Check wallet balance and allowance
app.get("/api/wallet-info", async (req, res) => {
  try {
    console.log("Fetching wallet info...");
    const balance = await provider.getBalance(wallet.address);
    console.log("CELO balance:", ethers.formatEther(balance));

    // Get cUSD contract
    const cusdAddress = process.env.CUSD_SEPOLIA_ADDRESS;
    const cusdABI = [
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
    ];

    let cusdBalance = BigInt(0);
    let allowance = BigInt(0);

    if (cusdAddress) {
      try {
        console.log("Fetching cUSD info from:", cusdAddress);
        const cusd = new ethers.Contract(cusdAddress, cusdABI, provider);
        cusdBalance = await cusd.balanceOf(wallet.address);
        allowance = await cusd.allowance(wallet.address, CONTRACT_ADDRESS);
        console.log("cUSD balance:", ethers.formatEther(cusdBalance));
        console.log("Allowance:", ethers.formatEther(allowance));
      } catch (err) {
        console.error("Error fetching cUSD info:", err.message);
        // Continue with zero values
      }
    }

    const response = {
      walletAddress: wallet.address,
      celoBalance: ethers.formatEther(balance),
      cusdBalance: ethers.formatEther(cusdBalance),
      contractAllowance: ethers.formatEther(allowance),
    };

    console.log("Sending wallet info:", response);
    res.json(response);
  } catch (error) {
    console.error("Wallet info error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Approve cUSD spending
app.post("/api/approve-cusd", async (req, res) => {
  try {
    const { amount } = req.body;
    const approveAmount = ethers.parseEther(String(amount || "1000000")); // Default to 1M cUSD

    const cusdAddress = process.env.CUSD_SEPOLIA_ADDRESS;
    if (!cusdAddress) {
      return res
        .status(400)
        .json({ error: "CUSD_SEPOLIA_ADDRESS not configured" });
    }

    const cusdABI = [
      "function approve(address spender, uint256 amount) returns (bool)",
    ];

    const cusd = new ethers.Contract(cusdAddress, cusdABI, wallet);
    console.log(
      `Approving ${ethers.formatEther(
        approveAmount
      )} cUSD for contract ${CONTRACT_ADDRESS}`
    );

    const tx = await cusd.approve(CONTRACT_ADDRESS, approveAmount);
    console.log("Approve tx sent:", tx.hash);
    const receipt = await tx.wait();

    res.json({
      success: true,
      txHash: receipt.transactionHash,
      approvedAmount: ethers.formatEther(approveAmount),
    });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({
      error: error.message,
      details: error.reason || error.code,
    });
  }
});

// Create task endpoint
app.post("/api/create-task", async (req, res) => {
  try {
    const {
      taskName,
      taskType,
      description,
      paymentAmount,
      durationInDays,
      workerAddress,
    } = req.body;

    if (!paymentAmount || !durationInDays) {
      return res.status(400).json({
        error: "paymentAmount and durationInDays are required",
      });
    }

    // Log task metadata (in production, you'd store this in DB)
    console.log(`Creating task:`, {
      name: taskName || "unnamed",
      type: taskType || "unknown",
      description: description || "no description",
      payment: paymentAmount,
      duration: durationInDays,
      worker: workerAddress || "unassigned",
    });

    // Convert paymentAmount (cUSD) to wei - must be a string
    let amountWei;
    try {
      amountWei = ethers.parseEther(String(paymentAmount));
      console.log(`Amount in wei: ${amountWei.toString()}`);
    } catch (err) {
      console.error("Failed to parse amount:", err.message);
      return res.status(400).json({
        error: "Invalid payment amount",
        details: err.message,
      });
    }

    console.log(`About to call createTask on contract ${CONTRACT_ADDRESS}`);

    // Check wallet balance first
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet CELO balance:", ethers.formatEther(balance));

    if (balance < ethers.parseEther("0.001")) {
      return res.status(400).json({
        error: "Insufficient CELO balance for gas",
        details: `Balance: ${ethers.formatEther(
          balance
        )} CELO. Need at least 0.001 CELO`,
      });
    }

    const tx = await contract.createTask(amountWei, Number(durationInDays));
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();

    if (!receipt) {
      console.error("Transaction receipt is null/undefined!");
      return res.status(500).json({
        error: "Transaction failed - no receipt returned",
        details:
          "The transaction may have failed. Check if you have sufficient cUSD allowance.",
        txHash: tx.hash,
      });
    }

    console.log("Transaction confirmed:", {
      hash: receipt.hash,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      logsCount: receipt.logs.length,
    });

    // Try to parse event TaskCreated
    let taskId = null;
    console.log("Parsing logs...");
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        console.log("Parsed log:", parsed.name);
        if (parsed.name === "TaskCreated") {
          taskId = parsed.args[0].toString();
          console.log("Found TaskCreated event with taskId:", taskId);
          break;
        }
      } catch (e) {
        console.log("Could not parse log:", e.message);
      }
    }

    const finalTxHash = receipt.hash || receipt.transactionHash || tx.hash;
    console.log("Final txHash:", finalTxHash);
    console.log("Task creation complete. TaskId:", taskId);

    return res.json({
      success: true,
      txHash: finalTxHash,
      taskId,
      metadata: {
        name: taskName,
        type: taskType,
        description,
      },
    });
  } catch (error) {
    console.error("Create task error:", error);

    // Provide helpful error messages
    let errorMsg = String(error);
    let details = error.reason || error.message || "";

    if (error.code === "INSUFFICIENT_FUNDS") {
      errorMsg = "Insufficient balance to create task";
      details =
        "The wallet doesn't have enough CELO to pay for the transaction";
    } else if (error.code === "CALL_EXCEPTION") {
      errorMsg = "Contract call failed";
      details = error.reason || "Check that the contract address is correct";
    } else if (errorMsg.includes("Insufficient allowance")) {
      errorMsg = "Insufficient cUSD allowance";
      details = "Please approve the contract to spend cUSD first";
    }

    return res.status(500).json({
      error: errorMsg,
      details: details,
      code: error.code,
    });
  }
});

// Sync task to database (backend server)
app.post("/api/sync-task", async (req, res) => {
  try {
    const { taskId, txHash, metadata } = req.body;

    if (!taskId || !txHash) {
      return res.status(400).json({
        error: "taskId and txHash are required",
      });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    console.log(`Syncing task ${taskId} to backend: ${backendUrl}`);

    const syncPayload = {
      contractTaskId: parseInt(taskId),
      transactionHash: txHash,
      paymentAmount: parseFloat(metadata?.paymentAmount || "0"),
      taskName: metadata?.name || "Unnamed Task",
      taskType: metadata?.type || "text-labeling",
      description: metadata?.description || "Task created via admin dashboard",
      maxSubmissions: metadata?.maxSubmissions || 10,
      durationInDays: metadata?.durationInDays || 7,
      verificationCriteria: {
        transactionHash: txHash,
        blockchainCreated: true,
      },
    };

    console.log("Sync payload:", syncPayload);

    const syncResponse = await fetch(`${backendUrl}/api/v1/tasks/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload),
    });

    const syncData = await syncResponse.text();
    console.log(`Sync response status: ${syncResponse.status}`);
    console.log("Sync response body:", syncData);

    if (!syncResponse.ok) {
      console.error("Sync error response:", syncData);
      return res.status(500).json({
        error: "Failed to sync task to backend",
        details: syncData,
      });
    }

    const syncedTask = JSON.parse(syncData);
    console.log("Task synced successfully:", syncedTask);

    res.json({
      success: true,
      message: "Task synced to backend database",
      data: syncedTask,
    });
  } catch (error) {
    console.error("Sync task error:", error);
    res.status(500).json({
      error: error.message,
      details: "Failed to sync task to backend",
    });
  }
});

// Serve dashboard page
app.get("/", (req, res) => {
  res.sendFile(join(process.cwd(), "src", "public", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Admin dashboard listening on http://localhost:${PORT}`);
});
