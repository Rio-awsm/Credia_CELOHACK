import 'dotenv/config';
import { prisma } from './src/database/connections';

async function testDatabaseSync() {
    try {
        console.log('🔍 Testing database connection...\n');

        // Test 1: Check database connection
        const userCount = await prisma.user.count();
        console.log(`✅ Database connected. Users in DB: ${userCount}`);

        // Test 2: Find or create admin user
        let adminUser = await prisma.user.findFirst({
            where: { walletAddress: '0xadmin_blockchain' },
        });

        if (!adminUser) {
            console.log('📝 Creating admin user...');
            adminUser = await prisma.user.create({
                data: {
                    walletAddress: '0xadmin_blockchain',
                    role: 'requester',
                    reputationScore: 100,
                },
            });
        }

        console.log(`✅ Admin user: ${adminUser.id}`);

        // Test 3: Create a test task
        console.log('\n📝 Creating test task...');
        const testTask = await prisma.task.create({
            data: {
                requesterId: adminUser.id,
                title: 'Test Blockchain Task',
                description: 'Testing sync from admin dashboard',
                taskType: 'text_verification',
                paymentAmount: 0.01,
                maxSubmissions: 10,
                contractTaskId: 999,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                verificationCriteria: {
                    transactionHash: '0x12345',
                    blockchainCreated: true,
                },
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        walletAddress: true,
                    },
                },
            },
        });

        console.log(`✅ Task created successfully!`);
        console.log(`   ID: ${testTask.id}`);
        console.log(`   Contract ID: ${testTask.contractTaskId}`);
        console.log(`   Title: ${testTask.title}`);
        console.log(`   Requester: ${testTask.requester.walletAddress}`);

        // Test 4: Query the task
        console.log('\n🔍 Verifying task...');
        const foundTask = await prisma.task.findUnique({
            where: { id: testTask.id },
        });

        if (foundTask) {
            console.log(`✅ Task verified in database!`);
        } else {
            console.log(`❌ Task not found in database!`);
        }

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseSync();
