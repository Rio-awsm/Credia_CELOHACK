"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_types_1 = require("../types/database.types");
const connections_1 = require("./connections");
async function main() {
    console.log('🌱 Seeding database...');
    // Create test users
    const requester = await connections_1.prisma.user.create({
        data: {
            walletAddress: '0x1234567890123456789012345678901234567890',
            role: database_types_1.UserRole.REQUESTER,
            reputationScore: 100,
        },
    });
    const worker = await connections_1.prisma.user.create({
        data: {
            walletAddress: '0x0987654321098765432109876543210987654321',
            role: database_types_1.UserRole.WORKER,
            reputationScore: 50,
            totalEarnings: 100.50,
        },
    });
    // Create test task
    const task = await connections_1.prisma.task.create({
        data: {
            requesterId: requester.id,
            title: 'Label 100 images of cats and dogs',
            description: 'Please identify if the image contains a cat or dog',
            taskType: database_types_1.TaskType.IMAGE_LABELING,
            paymentAmount: 5.0,
            status: database_types_1.TaskStatus.OPEN,
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
    await connections_1.prisma.$disconnect();
});
