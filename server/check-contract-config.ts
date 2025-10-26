import 'dotenv/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

async function checkContractConfig() {
    try {
        console.log('🔍 Checking TaskEscrow Contract Configuration...\n');

        const provider = new ethers.JsonRpcProvider(
            process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
        );

        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error('CONTRACT_ADDRESS not configured');
        }

        const TaskEscrowABI = JSON.parse(
            readFileSync(
                join(__dirname, './artifacts/contracts/TaskEscrow.sol/TaskEscrow.json'),
                'utf8'
            )
        );

        const contract = new ethers.Contract(
            contractAddress,
            TaskEscrowABI.abi,
            provider
        );

        console.log(`📋 TaskEscrow Contract: ${contractAddress}`);

        const cUSDAddress = await contract.cUSD();
        console.log(`💰 Configured cUSD Token: ${cUSDAddress}`);
        console.log(`💰 Expected cUSD Token: ${process.env.CUSD_SEPOLIA_ADDRESS}\n`);

        if (cUSDAddress.toLowerCase() !== process.env.CUSD_SEPOLIA_ADDRESS?.toLowerCase()) {
            console.log('❌ MISMATCH DETECTED!');
            console.log('\nThe TaskEscrow contract is configured with a different cUSD token address.');
            console.log('\n🔧 Solutions:');
            console.log('1. Redeploy TaskEscrow contract with the new cUSD address');
            console.log('2. Update CUSD_SEPOLIA_ADDRESS in .env to match the contract\'s cUSD address');
            console.log(`   CUSD_SEPOLIA_ADDRESS=${cUSDAddress}\n`);
        } else {
            console.log('✅ cUSD addresses match!');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkContractConfig();
