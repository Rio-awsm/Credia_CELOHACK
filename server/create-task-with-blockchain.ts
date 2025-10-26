import 'dotenv/config';
import { ethers } from 'ethers';
import { prisma } from './src/database/connections';
import { blockchainService } from './src/services/blockchain.service';
import { TaskType } from './src/types/database.types';

/**
 * This script creates a task directly using the blockchain service,
 * bypassing the API authentication requirements.
 * 
 * This is useful for testing the complete payment flow.
 */

async function createTaskDirectly() {
    try {
        console.log('🚀 Creating task with blockchain integration...\n');

        // Task creator wallet (must be registered first)
        const requesterWallet = '0xA0e793E7257c065b30c46Ef6828F2B3C0de87A8E';

        // Check if user exists, if not create them
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

        // Task details
        const taskData = {
            title: 'Verify this text - BLOCKCHAIN TASK 3',
            description: 'Check if text makes sense. This task has proper blockchain integration!',
            taskType: TaskType.TEXT_VERIFICATION,
            paymentAmount: 0.01,
            verificationCriteria: {
                aiPrompt: 'Verify if the text makes sense',
                requiredFields: ['text'],
            },
            maxSubmissions: 1,
            expiresAt: new Date('2025-11-01T00:00:00Z'),
        };

        console.log('💰 Task Details:');
        console.log(`   Title: ${taskData.title}`);
        console.log(`   Payment: ${taskData.paymentAmount} cUSD`);
        console.log(`   Type: ${taskData.taskType}`);
        console.log(`   Max Submissions: ${taskData.maxSubmissions}`);
        console.log(`   Expires: ${taskData.expiresAt}\n`);

        // Calculate duration
        const durationMs = taskData.expiresAt.getTime() - Date.now();
        const durationInDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        console.log(`⏰ Duration: ${durationInDays} days\n`);

        // Step 1: Create task on blockchain
        console.log('⛓️  Creating task on blockchain...');
        const blockchainResult = await blockchainService.createTask(
            taskData.paymentAmount.toString(),
            durationInDays
        );
        console.log(`✅ Blockchain task created!`);
        console.log(`   Contract Task ID: ${blockchainResult.taskId}`);
        console.log(`   Transaction Hash: ${blockchainResult.txHash}\n`);

        // Step 2: Store in database
        console.log('💾 Storing task in database...');
        const task = await prisma.task.create({
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

        console.log(`✅ Task created in database!`);
        console.log(`   Task ID: ${task.id}`);
        console.log(`   Contract Task ID: ${task.contractTaskId}\n`);

        // Update user stats
        await prisma.user.update({
            where: { id: requester.id },
            data: {
                totalTasksCreated: {
                    increment: 1,
                },
            },
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCESS! Task created with blockchain integration!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📋 Task Summary:');
        console.log(`   Database ID: ${task.id}`);
        console.log(`   Blockchain Contract ID: ${task.contractTaskId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Payment Amount: ${task.paymentAmount} cUSD`);
        console.log(`   Transaction Hash: ${blockchainResult.txHash}\n`);

        console.log('🎯 Next Steps:');
        console.log('1. View this task at: http://localhost:3000/tasks');
        console.log(`2. Submit work to task ID: ${task.id}`);
        console.log('3. Verification will run automatically');
        console.log('4. Payment will be released on approval! 🎉\n');

        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Error creating task:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createTaskDirectly();
