"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
describe("TaskEscrow", function () {
    let taskEscrow;
    let cUSDMock;
    let owner;
    let requester;
    let worker;
    const PAYMENT_AMOUNT = hardhat_1.ethers.parseEther("10"); // 10 cUSD
    const DURATION_DAYS = 7;
    beforeEach(async function () {
        [owner, requester, worker] = await hardhat_1.ethers.getSigners();
        // Deploy mock cUSD token
        const MockERC20 = await hardhat_1.ethers.getContractFactory("MockERC20");
        cUSDMock = await MockERC20.deploy("Celo Dollar", "cUSD");
        await cUSDMock.waitForDeployment();
        // Deploy TaskEscrow
        const TaskEscrow = await hardhat_1.ethers.getContractFactory("TaskEscrow");
        taskEscrow = await TaskEscrow.deploy(await cUSDMock.getAddress());
        await taskEscrow.waitForDeployment();
        // Mint cUSD to requester
        await cUSDMock.mint(requester.address, hardhat_1.ethers.parseEther("1000"));
    });
    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            (0, chai_1.expect)(await taskEscrow.owner()).to.equal(owner.address);
        });
        it("Should set the correct cUSD address", async function () {
            (0, chai_1.expect)(await taskEscrow.cUSD()).to.equal(await cUSDMock.getAddress());
        });
        it("Should initialize with zero platform fees", async function () {
            (0, chai_1.expect)(await taskEscrow.platformFeesAccumulated()).to.equal(0);
        });
    });
    describe("Create Task", function () {
        it("Should create a task successfully", async function () {
            // Approve and create task
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await (0, chai_1.expect)(taskEscrow.connect(requester).createTask(PAYMENT_AMOUNT, DURATION_DAYS))
                .to.emit(taskEscrow, "TaskCreated")
                .withArgs(1, requester.address, PAYMENT_AMOUNT, (await hardhat_network_helpers_1.time.latest()) + DURATION_DAYS * 24 * 60 * 60);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.requester).to.equal(requester.address);
            (0, chai_1.expect)(task.paymentAmount).to.equal(PAYMENT_AMOUNT);
            (0, chai_1.expect)(task.status).to.equal(0); // Open
        });
        it("Should fail with zero payment amount", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).createTask(0, DURATION_DAYS)).to.be.revertedWith("Payment must be > 0");
        });
        it("Should fail with invalid duration", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).createTask(PAYMENT_AMOUNT, 0)).to.be.revertedWith("Invalid duration");
            await (0, chai_1.expect)(taskEscrow.connect(requester).createTask(PAYMENT_AMOUNT, 91)).to.be.revertedWith("Invalid duration");
        });
        it("Should transfer cUSD to contract", async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
            (0, chai_1.expect)(await cUSDMock.balanceOf(await taskEscrow.getAddress())).to.equal(PAYMENT_AMOUNT);
        });
    });
    describe("Assign Worker", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
        });
        it("Should assign worker successfully", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).assignWorker(1, worker.address))
                .to.emit(taskEscrow, "WorkerAssigned")
                .withArgs(1, worker.address);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.worker).to.equal(worker.address);
            (0, chai_1.expect)(task.status).to.equal(1); // InProgress
        });
        it("Should fail if not requester", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(worker).assignWorker(1, worker.address)).to.be.revertedWith("Not task requester");
        });
        it("Should fail with invalid worker address", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).assignWorker(1, hardhat_1.ethers.ZeroAddress)).to.be.revertedWith("Invalid worker address");
        });
        it("Should fail if requester tries to be worker", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).assignWorker(1, requester.address)).to.be.revertedWith("Requester cannot be worker");
        });
    });
    describe("Approve Submission", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
            await taskEscrow.connect(requester).assignWorker(1, worker.address);
        });
        it("Should approve and release payment", async function () {
            const workerBalanceBefore = await cUSDMock.balanceOf(worker.address);
            await taskEscrow.connect(owner).approveSubmission(1);
            const workerBalanceAfter = await cUSDMock.balanceOf(worker.address);
            const expectedWorkerPayment = (PAYMENT_AMOUNT * 9500n) / 10000n; // 95%
            (0, chai_1.expect)(workerBalanceAfter - workerBalanceBefore).to.equal(expectedWorkerPayment);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.status).to.equal(2); // Completed
        });
        it("Should accumulate platform fees", async function () {
            await taskEscrow.connect(owner).approveSubmission(1);
            const expectedFee = (PAYMENT_AMOUNT * 500n) / 10000n; // 5%
            (0, chai_1.expect)(await taskEscrow.platformFeesAccumulated()).to.equal(expectedFee);
        });
        it("Should fail if not owner", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).approveSubmission(1))
                .to.be.revertedWithCustomError(taskEscrow, "OwnableUnauthorizedAccount")
                .withArgs(requester.address);
        });
        it("Should fail if task not in progress", async function () {
            await taskEscrow.connect(owner).approveSubmission(1);
            await (0, chai_1.expect)(taskEscrow.connect(owner).approveSubmission(1)).to.be.revertedWith("Task not in progress");
        });
    });
    describe("Reject Submission", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
            await taskEscrow.connect(requester).assignWorker(1, worker.address);
        });
        it("Should reject and refund requester", async function () {
            const requesterBalanceBefore = await cUSDMock.balanceOf(requester.address);
            await taskEscrow.connect(owner).rejectSubmission(1);
            const requesterBalanceAfter = await cUSDMock.balanceOf(requester.address);
            (0, chai_1.expect)(requesterBalanceAfter - requesterBalanceBefore).to.equal(PAYMENT_AMOUNT);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.status).to.equal(3); // Cancelled
        });
        it("Should fail if not owner", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).rejectSubmission(1)).to.be.revertedWithCustomError(taskEscrow, "OwnableUnauthorizedAccount")
                .withArgs(requester.address);
        });
    });
    describe("Cancel Task", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
        });
        it("Should allow requester to cancel open task", async function () {
            const requesterBalanceBefore = await cUSDMock.balanceOf(requester.address);
            await taskEscrow.connect(requester).cancelTask(1);
            const requesterBalanceAfter = await cUSDMock.balanceOf(requester.address);
            (0, chai_1.expect)(requesterBalanceAfter - requesterBalanceBefore).to.equal(PAYMENT_AMOUNT);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.status).to.equal(3); // Cancelled
        });
        it("Should fail if not requester", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(worker).cancelTask(1)).to.be.revertedWith("Not task requester");
        });
    });
    describe("Expired Task", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
        });
        it("Should allow claiming expired task", async function () {
            // Fast forward time
            await hardhat_network_helpers_1.time.increase(DURATION_DAYS * 24 * 60 * 60 + 1);
            const requesterBalanceBefore = await cUSDMock.balanceOf(requester.address);
            await taskEscrow.connect(requester).claimExpiredTask(1);
            const requesterBalanceAfter = await cUSDMock.balanceOf(requester.address);
            (0, chai_1.expect)(requesterBalanceAfter - requesterBalanceBefore).to.equal(PAYMENT_AMOUNT);
            const task = await taskEscrow.getTask(1);
            (0, chai_1.expect)(task.status).to.equal(4); // Expired
        });
        it("Should fail if task not expired", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).claimExpiredTask(1)).to.be.revertedWith("Task not expired yet");
        });
    });
    describe("Withdraw Platform Fees", function () {
        beforeEach(async function () {
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await taskEscrow
                .connect(requester)
                .createTask(PAYMENT_AMOUNT, DURATION_DAYS);
            await taskEscrow.connect(requester).assignWorker(1, worker.address);
            await taskEscrow.connect(owner).approveSubmission(1);
        });
        it("Should allow owner to withdraw fees", async function () {
            const ownerBalanceBefore = await cUSDMock.balanceOf(owner.address);
            const expectedFee = (PAYMENT_AMOUNT * 500n) / 10000n;
            await taskEscrow.connect(owner).withdrawPlatformFees();
            const ownerBalanceAfter = await cUSDMock.balanceOf(owner.address);
            (0, chai_1.expect)(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedFee);
            (0, chai_1.expect)(await taskEscrow.platformFeesAccumulated()).to.equal(0);
        });
        it("Should fail if no fees to withdraw", async function () {
            await taskEscrow.connect(owner).withdrawPlatformFees();
            await (0, chai_1.expect)(taskEscrow.connect(owner).withdrawPlatformFees()).to.be.revertedWith("No fees to withdraw");
        });
        it("Should fail if not owner", async function () {
            await (0, chai_1.expect)(taskEscrow.connect(requester).withdrawPlatformFees()).to.be.revertedWithCustomError(taskEscrow, "OwnableUnauthorizedAccount")
                .withArgs(requester.address);
        });
    });
    describe("Pause Functionality", function () {
        it("Should allow owner to pause", async function () {
            await taskEscrow.connect(owner).pause();
            (0, chai_1.expect)(await taskEscrow.paused()).to.be.true;
        });
        it("Should prevent task creation when paused", async function () {
            await taskEscrow.connect(owner).pause();
            await cUSDMock
                .connect(requester)
                .approve(await taskEscrow.getAddress(), PAYMENT_AMOUNT);
            await (0, chai_1.expect)(taskEscrow.connect(requester).createTask(PAYMENT_AMOUNT, DURATION_DAYS)).to.be.revertedWithCustomError(taskEscrow, "EnforcedPause");
        });
        it("Should allow owner to unpause", async function () {
            await taskEscrow.connect(owner).pause();
            await taskEscrow.connect(owner).unpause();
            (0, chai_1.expect)(await taskEscrow.paused()).to.be.false;
        });
    });
});
