"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("🚀 Starting deployment to Celo Sepolia...\n");
    // Get deployer account
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    // Get account balance
    const balance = await hardhat_1.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hardhat_1.ethers.formatEther(balance), "CELO\n");
    // cUSD token address on Sepolia testnet
    const CUSD_SEPOLIA = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1";
    console.log("📄 cUSD Token Address:", CUSD_SEPOLIA);
    // Deploy TaskEscrow contract
    console.log("\n⏳ Deploying TaskEscrow contract...");
    const TaskEscrow = await hardhat_1.ethers.getContractFactory("TaskEscrow");
    const taskEscrow = await TaskEscrow.deploy(CUSD_SEPOLIA);
    await taskEscrow.waitForDeployment();
    const taskEscrowAddress = await taskEscrow.getAddress();
    console.log("✅ TaskEscrow deployed to:", taskEscrowAddress);
    // Verify contract details
    console.log("\n📋 Contract Details:");
    console.log("-----------------------------------");
    console.log("Network: Celo Sepolia");
    console.log("Contract: TaskEscrow");
    console.log("Address:", taskEscrowAddress);
    console.log("Owner:", deployer.address);
    console.log("cUSD Token:", CUSD_SEPOLIA);
    console.log("Platform Fee: 5%");
    console.log("-----------------------------------\n");
    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        contractName: "TaskEscrow",
        contractAddress: taskEscrowAddress,
        deployer: deployer.address,
        cUSDAddress: CUSD_SEPOLIA,
        deployedAt: new Date().toISOString(),
        blockNumber: await hardhat_1.ethers.provider.getBlockNumber(),
    };
    console.log("💾 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("\n🔍 Verify contract on Celoscan:");
    console.log(`npx hardhat verify --network sepolia ${taskEscrowAddress} ${CUSD_SEPOLIA}`);
    console.log("\n✨ Deployment completed successfully!\n");
    // Return addresses for use in scripts
    return {
        taskEscrowAddress,
        cUSDAddress: CUSD_SEPOLIA,
    };
}
// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
});
