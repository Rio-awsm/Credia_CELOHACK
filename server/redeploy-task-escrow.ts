import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

async function redeployTaskEscrow() {
    try {
        console.log('🚀 Redeploying TaskEscrow Contract...\n');

        const provider = new ethers.JsonRpcProvider(
            process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
        );

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY not configured');
        }

        const signer = new ethers.Wallet(privateKey, provider);
        console.log(`📝 Deploying from: ${signer.address}`);

        const balance = await provider.getBalance(signer.address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} CELO\n`);

        const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
        if (!cUSDAddress) {
            throw new Error('CUSD_SEPOLIA_ADDRESS not configured');
        }

        console.log(`💰 Using cUSD Token: ${cUSDAddress}\n`);

        // Load contract artifact
        const TaskEscrowArtifact = JSON.parse(
            readFileSync(
                join(__dirname, './artifacts/contracts/TaskEscrow.sol/TaskEscrow.json'),
                'utf8'
            )
        );

        const TaskEscrow = new ethers.ContractFactory(
            TaskEscrowArtifact.abi,
            TaskEscrowArtifact.bytecode,
            signer
        );

        console.log('⏳ Deploying TaskEscrow contract...');
        const taskEscrow = await TaskEscrow.deploy(cUSDAddress);

        console.log(`📍 Deployment transaction: ${taskEscrow.deploymentTransaction()?.hash}`);
        console.log('⏳ Waiting for confirmation...\n');

        await taskEscrow.waitForDeployment();
        const contractAddress = await taskEscrow.getAddress();

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TaskEscrow Contract Deployed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`cUSD Token: ${cUSDAddress}\n`);

        console.log('📝 Update your .env file with:');
        console.log(`   CONTRACT_ADDRESS=${contractAddress}\n`);

        console.log('🎯 Next Steps:');
        console.log('1. Update CONTRACT_ADDRESS in your .env file');
        console.log('2. Run: npx tsx approve-cusd.ts');
        console.log('3. Run: npx tsx create-task-with-blockchain.ts\n');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

redeployTaskEscrow();
