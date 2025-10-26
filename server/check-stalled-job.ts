import 'dotenv/config';
import { prisma } from './src/database/connections';
import { verificationQueue } from './src/queues/verification.queue';

async function checkStalledJob() {
    console.log('🔍 Checking for stalled jobs...\n');

    const submissionId = '337c16f7-081e-4b3c-8aee-4d9ffa0e3682';

    // Check submission status
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            task: true,
        },
    });

    if (!submission) {
        console.log('❌ Submission not found');
        return;
    }

    console.log(`📋 Submission: ${submission.id}`);
    console.log(`   Status: ${submission.verificationStatus}`);
    console.log(`   Task: ${submission.task.title}`);
    console.log(`   Contract Task ID: ${submission.task.contractTaskId}`);

    // Check queue jobs
    const jobs = await verificationQueue.getJobs(['active', 'waiting', 'delayed', 'failed', 'completed']);
    const jobForSubmission = jobs.find(j => j.data.submissionId === submissionId);

    if (jobForSubmission) {
        console.log(`\n📊 Job found: ${jobForSubmission.id}`);
        console.log(`   State: ${await jobForSubmission.getState()}`);
        console.log(`   Attempts: ${jobForSubmission.attemptsMade}`);
        console.log(`   Data:`, jobForSubmission.data);

        // Get job state
        const state = await jobForSubmission.getState();

        if (state === 'failed') {
            console.log(`\n❌ Job failed. Error:`, jobForSubmission.failedReason);
            console.log('\n🔄 Retrying job...');
            await jobForSubmission.retry();
            console.log('✅ Job retried');
        } else if (state === 'completed') {
            console.log('\n✅ Job completed');
            console.log('Result:', jobForSubmission.returnvalue);
        } else {
            console.log(`\n⚠️  Job in state: ${state}`);
        }
    } else {
        console.log('\n❌ No job found in queue for this submission');
    }

    // Queue stats
    const stats = await verificationQueue.getJobCounts();
    console.log('\n📊 Queue Stats:', stats);

    process.exit(0);
}

checkStalledJob().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
