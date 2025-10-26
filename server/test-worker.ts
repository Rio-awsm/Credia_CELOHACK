/**
 * Test script to verify worker setup
 * Run with: npx ts-node test-worker.ts
 */

import 'dotenv/config';
import { startVerificationWorker, stopVerificationWorker } from './src/workers';
import { addVerificationJob, getQueueStats } from './src/queues/verification.queue';

async function testWorker() {
    console.log('🧪 Testing Verification Worker Setup\n');

    try {
        // Start worker
        console.log('1️⃣  Starting worker...');
        startVerificationWorker();
        console.log('✅ Worker started\n');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check queue stats
        console.log('2️⃣  Checking queue stats...');
        const stats = await getQueueStats();
        console.log('📊 Queue Statistics:');
        console.log(`   - Waiting: ${stats.waiting}`);
        console.log(`   - Active: ${stats.active}`);
        console.log(`   - Completed: ${stats.completed}`);
        console.log(`   - Failed: ${stats.failed}`);
        console.log(`   - Total: ${stats.total}\n`);

        // Add a test job
        console.log('3️⃣  Adding a test job...');
        const testJob = await addVerificationJob({
            submissionId: 'test-submission-id',
            taskId: 'test-task-id',
            workerId: 'test-worker-id',
            submissionData: { test: 'data' },
            verificationCriteria: { test: 'criteria' },
            taskType: 'text_verification',
        });
        console.log(`✅ Test job added: ${testJob.id}\n`);

        // Wait for processing
        console.log('4️⃣  Waiting for job to process (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check final stats
        const finalStats = await getQueueStats();
        console.log('\n📊 Final Queue Statistics:');
        console.log(`   - Waiting: ${finalStats.waiting}`);
        console.log(`   - Active: ${finalStats.active}`);
        console.log(`   - Completed: ${finalStats.completed}`);
        console.log(`   - Failed: ${finalStats.failed}`);
        console.log(`   - Total: ${finalStats.total}\n`);

        console.log('✅ Worker test completed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Stop worker
        console.log('🛑 Stopping worker...');
        await stopVerificationWorker();
        console.log('✅ Worker stopped\n');
        process.exit(0);
    }
}

testWorker();
