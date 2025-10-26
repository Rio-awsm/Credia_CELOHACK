import 'dotenv/config';
import { ethers } from 'ethers';

/**
 * Approve TaskEscrow contract to spend cUSD tokens
 * This needs to be done once before creating tasks
 */

async function approveCUSD() {
    try {
        console.log('🔐 Approving TaskEscrow to spend cUSD...\n');

        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider(
            process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
        );

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY not configured in .env');
        }

        const signer = new ethers.Wallet(privateKey, provider);
        console.log(`📝 Approving from: ${signer.address}`);

        // Get contract addresses
        const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
        const taskEscrowAddress = process.env.CONTRACT_ADDRESS;

        if (!cUSDAddress) {
            throw new Error('CUSD_SEPOLIA_ADDRESS not configured in .env');
        }
        if (!taskEscrowAddress) {
            throw new Error('CONTRACT_ADDRESS not configured in .env');
        }

        console.log(`💰 cUSD Token: ${cUSDAddress}`);
        console.log(`📋 TaskEscrow Contract: ${taskEscrowAddress}\n`);

        // Create cUSD contract instance
        const cUSDContract = new ethers.Contract(
            cUSDAddress,
            [
                'function approve(address spender, uint256 amount) returns (bool)',
                'function allowance(address owner, address spender) view returns (uint256)',
                'function balanceOf(address account) view returns (uint256)',
            ],
            signer
        );

        // Check current balance
        const balance = await cUSDContract.balanceOf(signer.address);
        console.log(`💵 Your cUSD Balance: ${ethers.formatEther(balance)} cUSD`);

        // Check current allowance
        const currentAllowance = await cUSDContract.allowance(signer.address, taskEscrowAddress);
        console.log(`🔓 Current Allowance: ${ethers.formatEther(currentAllowance)} cUSD\n`);

        // Approve a large amount (1 million cUSD) so we don't need to approve again
        const approvalAmount = ethers.parseEther('1000000');
        console.log(`⏳ Approving ${ethers.formatEther(approvalAmount)} cUSD...`);

        const tx = await cUSDContract.approve(taskEscrowAddress, approvalAmount);
        console.log(`📍 Transaction sent: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...\n');

        const receipt = await tx.wait();
        console.log(`✅ Approval confirmed in block ${receipt.blockNumber}\n`);

        // Verify new allowance
        const newAllowance = await cUSDContract.allowance(signer.address, taskEscrowAddress);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCESS! TaskEscrow approved to spend cUSD');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`New Allowance: ${ethers.formatEther(newAllowance)} cUSD`);
        console.log(`Transaction Hash: ${receipt.hash}\n`);

        console.log('🎯 Next Steps:');
        console.log('You can now create tasks with blockchain integration! 🎉\n');

        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Approval failed:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
        process.exit(1);
    }
}

approveCUSD();
