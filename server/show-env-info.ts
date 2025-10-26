import 'dotenv/config';
import { blockchainService } from './src/services/blockchain.service';
import { prisma } from './src/database/connections';

async function showEnvironmentInfo() {
    try {
        console.log('🔍 Environment & Contract Information\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.log('\n📁 Working Directory:');
        console.log(`   ${process.cwd()}\n`);

        console.log('🌐 Network Configuration:');
        console.log(`   RPC URL: ${process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'}`);
        console.log(`   Chain ID: ${process.env.CHAIN_ID || '11142220'}\n`);

        console.log('📋 Contract Addresses:');
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
        console.log(`   TaskEscrow: ${contractAddress || 'NOT SET'}`);
        console.log(`   cUSD Token: ${cUSDAddress || 'NOT SET'}\n`);

        if (!contractAddress) {
            console.log('❌ CONTRACT_ADDRESS not configured in .env!');
            process.exit(1);
        }

        console.log('⛓️  Blockchain Service:');
        const actualContract = blockchainService.getContractAddress();
        console.log(`   Connected to: ${actualContract}`);
        console.log(`   Match: ${actualContract.toLowerCase() === contractAddress.toLowerCase() ? '✅' : '❌'}\n`);

        const taskCounter = await blockchainService.getTaskCounter();
        console.log(`   Total tasks on blockchain: ${taskCounter}\n`);

        console.log('💾 Database Statistics:');
        const totalTasks = await prisma.task.count();
        const tasksWithContract = await prisma.task.count({
            where: { contractTaskId: { not: null } },
        });
        const activeTasks = await prisma.task.count({
            where: {
                status: { in: ['open', 'in_progress'] },
                contractTaskId: { not: null },
            },
        });

        console.log(`   Total tasks in DB: ${totalTasks}`);
        console.log(`   Tasks with blockchain: ${tasksWithContract}`);
        console.log(`   Active blockchain tasks: ${activeTasks}\n`);

        if (activeTasks > 0) {
            console.log('📝 Active Tasks:');
            const tasks = await prisma.task.findMany({
                where: {
                    status: { in: ['open', 'in_progress'] },
                    contractTaskId: { not: null },
                },
                select: {
                    id: true,
                    title: true,
                    contractTaskId: true,
                    status: true,
                },
                take: 5,
            });

            for (const task of tasks) {
                console.log(`\n   Task: ${task.title.substring(0, 50)}...`);
                console.log(`   DB ID: ${task.id}`);
                console.log(`   Contract ID: ${task.contractTaskId}`);
                console.log(`   Status: ${task.status}`);

                try {
                    const blockchainTask = await blockchainService.getTask(task.contractTaskId!);
                    if (blockchainTask) {
                        const statuses = ['Open', 'InProgress', 'Completed', 'Cancelled', 'Expired'];
                        console.log(`   Blockchain: ✅ ${statuses[blockchainTask.status]}`);
                    } else {
                        console.log(`   Blockchain: ❌ NOT FOUND`);
                    }
                } catch (error: any) {
                    console.log(`   Blockchain: ❌ Error - ${error.message}`);
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Environment check complete!\n');

        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

showEnvironmentInfo();
