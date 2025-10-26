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
        title: 'Verify Text - Grammar and Clarity 2',
        description: 'Check if the provided text is grammatically correct and clear.',
        taskType: TaskType.TEXT_VERIFICATION,
        paymentAmount: 0.01,
        verificationCriteria: {
          aiPrompt: 'Check text grammar and clarity.',
          requiredFields: ['text'],
        },
        maxSubmissions: 1,
        expiresAt: new Date('2025-11-05T00:00:00Z'),
      },
      {
        title: 'Image Labeling - Identify Objects 2',
        description: 'Label all visible objects in the provided image.',
        taskType: TaskType.IMAGE_LABELING,
        paymentAmount: 0.02,
        verificationCriteria: {
          aiPrompt: 'Label objects in the image accurately.',
          requiredFields: ['image', 'labels'],
        },
        maxSubmissions: 3,
        expiresAt: new Date('2025-11-10T00:00:00Z'),
      },
      {
        title: 'Survey - User Experience Feedback 2',
        description: 'Answer short questions about app usability.',
        taskType: TaskType.SURVEY,
        paymentAmount: 0.015,
        verificationCriteria: {
          aiPrompt: 'Ensure responses are complete and relevant.',
          requiredFields: ['answers'],
        },
        maxSubmissions: 10,
        expiresAt: new Date('2025-11-15T00:00:00Z'),
      },
      {
        title: 'Content Moderation - Comment Review 2',
        description: 'Flag inappropriate or spammy comments.',
        taskType: TaskType.CONTENT_MODERATION,
        paymentAmount: 0.025,
        verificationCriteria: {
          aiPrompt: 'Determine if the content violates community rules.',
          requiredFields: ['comment', 'decision'],
        },
        maxSubmissions: 5,
        expiresAt: new Date('2025-11-20T00:00:00Z'),
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
