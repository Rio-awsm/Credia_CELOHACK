import 'dotenv/config';
import { prisma } from './src/database/connections';
import { blockchainService } from './src/services/blockchain.service';

async function diagnoseTaskMismatch() {
    try {
        console.log('🔍 Diagnosing Task Mismatch between Database and Blockchain...\n');

        // Get contract info
        const contractAddress = blockchainService.getContractAddress();
        console.log(`📋 Contract Address: ${contractAddress}`);

        const taskCounter = await blockchainService.getTaskCounter();
        console.log(`📊 Blockchain Task Counter: ${taskCounter}\n`);

        // Get tasks from database with contractTaskId
        const tasksInDb = await prisma.task.findMany({
            where: {
                contractTaskId: {
                    not: null,
                },
            },
            select: {
                id: true,
                title: true,
                contractTaskId: true,
                status: true,
                paymentAmount: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });

        console.log(`💾 Found ${tasksInDb.length} tasks in database with contractTaskId\n`);

        if (tasksInDb.length === 0) {
            console.log('⚠️  No tasks with blockchain integration found in database');
            process.exit(0);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Checking each task on blockchain...\n');

        for (const task of tasksInDb) {
            console.log(`\n📋 Task: ${task.title}`);
            console.log(`   DB ID: ${task.id}`);
            console.log(`   Contract Task ID: ${task.contractTaskId}`);
            console.log(`   DB Status: ${task.status}`);
            console.log(`   Payment: ${task.paymentAmount} cUSD`);

            try {
                const blockchainTask = await blockchainService.getTask(task.contractTaskId!);

                if (!blockchainTask) {
                    console.log(`   ❌ NOT FOUND on blockchain`);
                    console.log(`   Issue: Task ${task.contractTaskId} does not exist on contract ${contractAddress}`);
                } else {
                    console.log(`   ✅ FOUND on blockchain`);
                    console.log(`   Blockchain Status: ${['Open', 'InProgress', 'Completed', 'Cancelled', 'Expired'][blockchainTask.status]}`);
                    console.log(`   Requester: ${blockchainTask.requester}`);
                    console.log(`   Worker: ${blockchainTask.worker === '0x0000000000000000000000000000000000000000' ? 'None' : blockchainTask.worker}`);
                    console.log(`   Payment: ${blockchainTask.paymentAmount} cUSD`);
                }
            } catch (error: any) {
                console.log(`   ❌ ERROR checking blockchain: ${error.message}`);
            }

            console.log('   ' + '─'.repeat(60));
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n💡 Recommendations:');
        console.log('1. If tasks are NOT FOUND on blockchain:');
        console.log('   - The contract address may have changed');
        console.log('   - Check CONTRACT_ADDRESS in .env matches the deployed contract');
        console.log('   - You may need to create new tasks with the current contract\n');

        console.log('2. If tasks exist but have wrong status:');
        console.log('   - Database and blockchain are out of sync');
        console.log('   - Verify worker assignment happened on blockchain\n');

        console.log('3. To fix:');
        console.log('   - Option A: Update CONTRACT_ADDRESS to the old contract');
        console.log('   - Option B: Create new tasks with current contract');
        console.log('   - Option C: Clear old tasks and start fresh\n');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

diagnoseTaskMismatch();
