import 'dotenv/config';
import { prisma } from './src/database/connections';

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...\n');

    // Delete submissions for tasks without contracts
    const deletedSubmissions = await prisma.submission.deleteMany({
        where: {
            task: {
                contractTaskId: null,
            },
        },
    });
    console.log(`✅ Deleted ${deletedSubmissions.count} submissions for tasks without contracts`);

    // Delete payments for tasks without contracts
    const deletedPayments = await prisma.payment.deleteMany({
        where: {
            task: {
                contractTaskId: null,
            },
        },
    });
    console.log(`✅ Deleted ${deletedPayments.count} payments for tasks without contracts`);

    // Delete tasks without contracts
    const deletedTasks = await prisma.task.deleteMany({
        where: {
            contractTaskId: null,
        },
    });
    console.log(`✅ Deleted ${deletedTasks.count} tasks without blockchain contracts`);

    console.log('\n✅ Cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Create a new task through the API with a REAL wallet address');
    console.log('2. Make sure you have cUSD in your wallet');
    console.log('3. Submit work to the task');
    console.log('4. Watch the payment process automatically!');

    process.exit(0);
}

cleanupTestData().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
