"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("🔧 Interacting with TaskEscrow contract...\n");
    // Replace with your deployed contract address
    const TASK_ESCROW_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    const [deployer, worker] = await hardhat_1.ethers.getSigners();
    // Get contract instances
    const TaskEscrow = await hardhat_1.ethers.getContractAt("TaskEscrow", TASK_ESCROW_ADDRESS);
    const cUSD = await hardhat_1.ethers.getContractAt("IERC20", CUSD_ADDRESS);
    console.log("📝 Contract Address:", TASK_ESCROW_ADDRESS);
    console.log("👤 Deployer:", deployer.address);
    console.log("👷 Worker:", worker.address, "\n");
    // Check cUSD balance
    const balance = await cUSD.balanceOf(deployer.address);
    console.log("💰 Deployer cUSD Balance:", hardhat_1.ethers.formatEther(balance), "\n");
    // Example: Create a task
    console.log("📝 Creating a task...");
    const paymentAmount = hardhat_1.ethers.parseEther("5"); // 5 cUSD
    const durationInDays = 7;
    // Approve TaskEscrow to spend cUSD
    console.log("✅ Approving cUSD spending...");
    const approveTx = await cUSD.approve(TASK_ESCROW_ADDRESS, paymentAmount);
    await approveTx.wait();
    console.log("✅ Approved!\n");
    // Create task
    const createTx = await TaskEscrow.createTask(paymentAmount, durationInDays);
    const receipt = await createTx.wait();
    // Get taskId from event
    const event = receipt?.logs.find((log) => {
        try {
            return TaskEscrow.interface.parseLog(log)?.name === "TaskCreated";
        }
        catch {
            return false;
        }
    });
    const parsedEvent = TaskEscrow.interface.parseLog(event);
    const taskId = parsedEvent?.args[0];
    console.log("✅ Task created! Task ID:", taskId.toString(), "\n");
    // Get task details
    const task = await TaskEscrow.getTask(taskId);
    console.log("📋 Task Details:");
    console.log("-----------------------------------");
    console.log("Task ID:", task.taskId.toString());
    console.log("Requester:", task.requester);
    console.log("Payment Amount:", hardhat_1.ethers.formatEther(task.paymentAmount), "cUSD");
    console.log("Status:", task.status);
    console.log("-----------------------------------\n");
    // Assign worker
    console.log("👷 Assigning worker...");
    const assignTx = await TaskEscrow.assignWorker(taskId, worker.address);
    await assignTx.wait();
    console.log("✅ Worker assigned!\n");
    // Approve submission (as owner)
    console.log("✅ Approving submission...");
    const approveTx2 = await TaskEscrow.approveSubmission(taskId);
    await approveTx2.wait();
    console.log("✅ Submission approved! Payment released.\n");
    // Check worker balance
    const workerBalance = await cUSD.balanceOf(worker.address);
    console.log("💰 Worker cUSD Balance:", hardhat_1.ethers.formatEther(workerBalance), "\n");
    console.log("✨ Interaction completed!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
