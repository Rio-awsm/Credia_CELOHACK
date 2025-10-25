import { TaskStatus, TaskType, UserRole } from '../types/database.types';
import { prisma } from './connections';

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const requester = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      role: UserRole.REQUESTER,
      reputationScore: 100,
    },
  });

  const worker = await prisma.user.create({
    data: {
      walletAddress: '0x0987654321098765432109876543210987654321',
      role: UserRole.WORKER,
      reputationScore: 50,
      totalEarnings: 100.50,
    },
  });

  // Create test task
  const task = await prisma.task.create({
    data: {
      requesterId: requester.id,
      title: 'Label 100 images of cats and dogs',
      description: 'Please identify if the image contains a cat or dog',
      taskType: TaskType.IMAGE_LABELING,
      paymentAmount: 5.0,
      status: TaskStatus.OPEN,
      verificationCriteria: {
        requiredFields: ['label', 'confidence'],
        aiPrompt: 'Verify if the labeled animal matches the image',
        minConfidenceScore: 0.8,
      },
      maxSubmissions: 10,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  console.log('✅ Seed data created');
  console.log({ requester, worker, task });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
