import 'dotenv/config';
import { blockchainService } from './src/services/blockchain.service';

async function checkWalletBalance() {
    try {

        const walletAddress = '0xA0e793E7257c065b30c46Ef6828F2B3C0de87A8E';

        console.log('💰 Checking cUSD balance...\n');
        console.log(`Wallet: ${walletAddress}`);

        const balance = await blockchainService.getCUSDBalance(walletAddress);

        console.log(`\nBalance: ${balance} cUSD`);

        if (parseFloat(balance) === 0) {
            console.log('\n❌ No cUSD balance!');
            console.log('\n📝 To get cUSD on Celo Sepolia:');
            console.log('1. Get testnet CELO from: https://faucet.celo.org');
            console.log('2. Swap CELO for cUSD on Uniswap or Mento');
            console.log('3. Or use the Celo wallet to get test cUSD');
        } else {
            console.log('\n✅ Wallet has cUSD!');
            console.log('\n📝 Next step:');
            console.log('The wallet needs to APPROVE the TaskEscrow contract to spend cUSD.');
            console.log('This is normally done through the frontend when creating a task.');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkWalletBalance();
