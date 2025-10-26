import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import MockERC20Artifact from './artifacts/contracts/MockERC20.sol/MockERC20.json';

dotenv.config();

async function deployTestToken() {
    try {
        console.log('🚀 Deploying Test Token to Celo Sepolia...\n');

        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider(
            process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
        );

        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY not configured in .env');
        }

        const signer = new ethers.Wallet(privateKey, provider);
        console.log(`📝 Deploying from: ${signer.address}`);

        // Check balance
        const balance = await provider.getBalance(signer.address);
        const balanceInCELO = ethers.formatEther(balance);
        console.log(`💰 Account balance: ${balanceInCELO} CELO\n`);

        if (parseFloat(balanceInCELO) === 0) {
            console.log('❌ Insufficient balance! Get testnet CELO from:');
            console.log('   https://faucet.celo.org');
            process.exit(1);
        }

        // Deploy token with name and symbol
        const tokenName = 'Test USD';
        const tokenSymbol = 'tUSD';
        console.log(`📦 Deploying ${tokenName} (${tokenSymbol})...\n`);

        const TestToken = new ethers.ContractFactory(
            MockERC20Artifact.abi,
            MockERC20Artifact.bytecode,
            signer
        );

        console.log('⏳ Sending deployment transaction...');
        const token = await TestToken.deploy(tokenName, tokenSymbol);

        console.log(`📍 Deployment transaction sent: ${token.deploymentTransaction()?.hash}`);
        console.log('⏳ Waiting for confirmation...\n');

        await token.waitForDeployment();
        const tokenAddress = await token.getAddress();

        console.log('✅ Token deployed successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log(`Token Address: ${tokenAddress}`);
        console.log('═══════════════════════════════════════\n');

        // Verify deployment - create a properly typed contract instance
        const deployedToken = new ethers.Contract(tokenAddress, MockERC20Artifact.abi, signer);

        // Mint initial supply (1 million tokens)
        const initialSupply = ethers.parseEther('1000000');
        console.log('⏳ Minting initial supply...');
        const mintTx = await deployedToken.mint(signer.address, initialSupply);
        await mintTx.wait();
        console.log('✅ Minted 1,000,000 tokens\n');

        const name = await deployedToken.name();
        const symbol = await deployedToken.symbol();
        const totalSupply = await deployedToken.totalSupply();
        const deployerBalance = await deployedToken.balanceOf(signer.address);

        console.log('📊 Token Details:');
        console.log(`   Name: ${name}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
        console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} ${symbol}\n`);

        // Output for .env
        console.log('📝 Update your .env file with:');
        console.log(`   CUSD_SEPOLIA_ADDRESS=${tokenAddress}\n`);

        console.log('📄 To verify on Celoscan:');
        console.log(`   1. Go to https://sepolia.celoscan.io/address/${tokenAddress}#code`);
        console.log(`   2. Click "Verify and Publish"`);
        console.log(`   3. Use contract: contracts/MockERC20.sol:MockERC20`);
        console.log(`   4. Constructor arguments: "${tokenName}", "${tokenSymbol}"\n`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

deployTestToken();