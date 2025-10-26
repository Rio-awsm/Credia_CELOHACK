import 'dotenv/config';
import { prisma } from './src/database/connections';
import { blockchainService } from './src/services/blockchain.service';
import { TaskType } from './src/types/database.types';

/**
 * Seeds multiple tasks with blockchain integration.
 */
async function seedTasks() {
    try {
        console.log('🚀 Starting blockchain task seeding...\n');

        const requesterWallet = '0xA0e793E7257c065b30c46Ef6828F2B3C0de87A8E';

        // Find or create requester
        let requester = await prisma.user.findUnique({
            where: { walletAddress: requesterWallet.toLowerCase() },
        });

        if (!requester) {
            console.log('📝 Creating user...');
            requester = await prisma.user.create({
                data: {
                    walletAddress: requesterWallet.toLowerCase(),
                    reputationScore: 100,
                    role: 'worker',
                },
            });
            console.log(`✅ User created: ${requester.id}\n`);
        } else {
            console.log(`✅ User found: ${requester.id}\n`);
        }

        // Define tasks to seed
        const tasks = [
            {
                title: 'Grammar Check - Business Email',
                description: 'Review and verify that the business email text is grammatically correct and uses proper English.',
                taskType: TaskType.TEXT_VERIFICATION,
                paymentAmount: 0.01,
                verificationCriteria: {
                    aiPrompt: 'Check if the text has correct grammar, proper spelling, and uses professional English language.',
                    requiredFields: ['text'],
                },
                maxSubmissions: 3,
                expiresAt: new Date('2025-11-05T00:00:00Z'),
            },
            {
                title: 'English Text Verification - Blog Post',
                description: 'Verify that the blog post content follows proper English grammar rules and sentence structure.',
                taskType: TaskType.TEXT_VERIFICATION,
                paymentAmount: 0.015,
                verificationCriteria: {
                    aiPrompt: 'Verify the text has correct grammar, punctuation, sentence structure, and uses proper English.',
                    requiredFields: ['text'],
                },
                maxSubmissions: 2,
                expiresAt: new Date('2025-11-08T00:00:00Z'),
            },
            {
                title: 'Grammar Correction - Product Description',
                description: 'Check product description text for grammar errors and ensure it uses clear, proper English.',
                taskType: TaskType.TEXT_VERIFICATION,
                paymentAmount: 0.02,
                verificationCriteria: {
                    aiPrompt: 'Ensure the text is grammatically correct, has proper punctuation, and uses clear professional English.',
                    requiredFields: ['text'],
                },
                maxSubmissions: 5,
                expiresAt: new Date('2025-11-12T00:00:00Z'),
            },
        ];

        for (const taskData of tasks) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🧩 Creating task: ${taskData.title}`);
            console.log(`💰 Payment: ${taskData.paymentAmount} cUSD`);
            console.log(`⏰ Expires: ${taskData.expiresAt}\n`);

            const durationMs = taskData.expiresAt.getTime() - Date.now();
            const durationInDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

            console.log('⛓️  Creating task on blockchain...');
            const blockchainResult = await blockchainService.createTask(
                taskData.paymentAmount.toString(),
                durationInDays
            );

            console.log(`✅ Blockchain task created!`);
            console.log(`   Contract Task ID: ${blockchainResult.taskId}`);
            console.log(`   Tx Hash: ${blockchainResult.txHash}\n`);

            const dbTask = await prisma.task.create({
                data: {
                    requesterId: requester.id,
                    title: taskData.title,
                    description: taskData.description,
                    taskType: taskData.taskType,
                    paymentAmount: taskData.paymentAmount,
                    verificationCriteria: taskData.verificationCriteria,
                    maxSubmissions: taskData.maxSubmissions,
                    expiresAt: taskData.expiresAt,
                    contractTaskId: blockchainResult.taskId,
                    status: 'open',
                },
            });

            console.log(`✅ Task stored in DB! ID: ${dbTask.id}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        // Update user stats
        await prisma.user.update({
            where: { id: requester.id },
            data: {
                totalTasksCreated: { increment: tasks.length },
            },
        });

        console.log('✅ All tasks successfully created with blockchain integration!\n');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Error seeding tasks:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

seedTasks();
