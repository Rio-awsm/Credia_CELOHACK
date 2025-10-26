import 'dotenv/config';
import { prisma } from './src/database/connections';

async function checkTasksWithoutContract() {
    console.log('🔍 Checking tasks without blockchain contract...\n');

    const tasksWithoutContract = await prisma.task.findMany({
        where: {
            contractTaskId: null,
        },
        include: {
            requester: {
                select: {
                    walletAddress: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 10,
    });

    console.log(`Found ${tasksWithoutContract.length} tasks without blockchain contract:\n`);

    for (const task of tasksWithoutContract) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📋 Task: ${task.title}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   Requester: ${task.requester.walletAddress}`);
        console.log(`   Amount: ${task.paymentAmount} cUSD`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Created: ${task.createdAt}`);
        console.log(`   Contract Task ID: ${task.contractTaskId}`);
    }

    process.exit(0);
}

checkTasksWithoutContract().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
