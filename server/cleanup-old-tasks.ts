import 'dotenv/config';
import { prisma } from './src/database/connections';
import { blockchainService } from './src/services/blockchain.service';

async function cleanupOldTasks() {
    try {
        console.log('🧹 Cleaning up tasks from old contracts...\n');

        const currentContract = blockchainService.getContractAddress();
        console.log(`📋 Current Contract: ${currentContract}\n`);

        // Find all tasks with contractTaskId
        const tasks = await prisma.task.findMany({
            where: {
                contractTaskId: {
                    not: null,
                },
                status: {
                    in: ['open', 'in_progress'],
                },
            },
        });

        console.log(`Found ${tasks.length} active tasks with blockchain integration\n`);

        let invalidTasks = 0;
        let validTasks = 0;

        for (const task of tasks) {
            try {
                const blockchainTask = await blockchainService.getTask(task.contractTaskId!);

                if (!blockchainTask) {
                    console.log(`❌ Task ${task.id} (Contract ID: ${task.contractTaskId}) - NOT FOUND on current contract`);
                    invalidTasks++;
                } else {
                    console.log(`✅ Task ${task.id} (Contract ID: ${task.contractTaskId}) - Valid`);
                    validTasks++;
                }
            } catch (error) {
                console.log(`❌ Task ${task.id} (Contract ID: ${task.contractTaskId}) - Error checking`);
                invalidTasks++;
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Summary:`);
        console.log(`  Valid tasks: ${validTasks}`);
        console.log(`  Invalid tasks: ${invalidTasks}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (invalidTasks > 0) {
            console.log('⚠️  Found tasks referencing old contract!\n');
            console.log('Options:');
            console.log('1. Mark invalid tasks as "cancelled" (recommended)');
            console.log('2. Delete invalid tasks completely');
            console.log('3. Do nothing (manual cleanup)\n');

            // For now, let's mark them as cancelled
            console.log('Marking invalid tasks as cancelled...\n');

            for (const task of tasks) {
                try {
                    const blockchainTask = await blockchainService.getTask(task.contractTaskId!);

                    if (!blockchainTask) {
                        await prisma.task.update({
                            where: { id: task.id },
                            data: { status: 'expired' as any },
                        });
                        console.log(`✅ Marked task ${task.id} as expired`);
                    }
                } catch (error) {
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { status: 'expired' as any },
                    });
                    console.log(`✅ Marked task ${task.id} as expired`);
                }
            }

            console.log('\n✅ Cleanup complete!');
        } else {
            console.log('✅ All tasks are valid - no cleanup needed!');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanupOldTasks();
