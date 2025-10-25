import { addVerificationJob } from './src/queues/verification.queue';

async function testQueue() {
  const job = await addVerificationJob({
    submissionId: 'test-submission-id',
    taskId: 'test-task-id',
    workerId: 'test-worker-id',
    submissionData: {
      text: 'This is a test submission',
    },
    verificationCriteria: {
      requiredFields: ['text'],
      aiPrompt: 'Verify the submission is valid',
    },
    taskType: 'text_verification',
  });

  console.log('Test job added:', job.id);
}

testQueue();
