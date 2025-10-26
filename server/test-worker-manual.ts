import 'dotenv/config';
import { prisma } from './src/database/connections';
import { startVerificationWorker } from './src/workers/verification.worker';
import { addVerificationJob } from './src/queues/verification.queue';

async function testWorker() {
    console.log('🧪 Manual Worker Test Started');

    // Start the worker
    console.log('Starting worker...');
    startVerificationWorker();

    // Wait a bit for worker to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find a pending submission
    const pendingSubmission = await prisma.submission.findFirst({
        where: {
            verificationStatus: 'pending',
        },
        include: {
            task: true,
        },
    });

    if (!pendingSubmission) {
        console.log('❌ No pending submissions found');
        process.exit(0);
    }

    console.log(`\n📋 Found pending submission: ${pendingSubmission.id}`);
    console.log(`   Task: ${pendingSubmission.task.title}`);
    console.log(`   Worker ID: ${pendingSubmission.workerId}`);

    // Add job to queue
    console.log('\n➕ Adding job to queue...');
    await addVerificationJob({
        submissionId: pendingSubmission.id,
        taskId: pendingSubmission.taskId,
        workerId: pendingSubmission.workerId,
        submissionData: pendingSubmission.submissionData,
        verificationCriteria: pendingSubmission.task.verificationCriteria,
        taskType: pendingSubmission.task.taskType,
    });

    console.log('\n⏳ Waiting for job to process...');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check result
    const updatedSubmission = await prisma.submission.findUnique({
        where: { id: pendingSubmission.id },
    });

    console.log(`\n📊 Final status: ${updatedSubmission?.verificationStatus}`);

    process.exit(0);
}

testWorker().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
