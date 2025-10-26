'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { VerificationStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SubmissionStatusPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.submissions.getStatus(submissionId),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const submission = data?.data?.submission;
  const task = data?.data?.task;
  const payment = data?.data?.payment;

  if (!submission) {
    return <div className="text-center py-12">Submission not found</div>;
  }

  const statusConfig = {
    [VerificationStatus.PENDING]: {
      color: 'yellow',
      icon: '⏳',
      title: 'Verification in Progress',
      description: 'AI is verifying your submission. This usually takes 1-2 minutes.',
    },
    [VerificationStatus.APPROVED]: {
      color: 'green',
      icon: '✓',
      title: 'Submission Approved!',
      description: 'Your submission has been approved and payment has been sent to your wallet.',
    },
    [VerificationStatus.REJECTED]: {
      color: 'red',
      icon: '✗',
      title: 'Submission Rejected',
      description: 'Your submission did not meet the verification criteria.',
    },
  };

  const config = statusConfig[submission.status as VerificationStatus];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Status Card */}
      <div className={`bg-${config.color}-50 border-2 border-${config.color}-200 rounded-lg p-8 mb-6`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-700 mt-2">{config.description}</p>
          </div>
        </div>

        {/* Progress Bar for Pending */}
        {submission.status === VerificationStatus.PENDING && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Estimated time: 1-2 minutes</p>
          </div>
        )}
      </div>

      {/* Task Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Task:</span>
            <span className="font-medium text-gray-900">{task?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(task?.paymentAmount || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Submitted:</span>
            <span className="font-medium text-gray-900">
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Results */}
      {submission.verificationResult && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Results</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Score:</span>
              <span className="font-bold text-gray-900">
                {submission.verificationResult.score}/100
              </span>
            </div>
            {submission.verificationResult.reasoning && (
              <div>
                <span className="text-gray-600 block mb-2">AI Reasoning:</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {submission.verificationResult.reasoning}
                </p>
              </div>
            )}
            {submission.verificationResult.error && (
              <div className="mt-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">Error:</p>
                  <p className="text-sm text-red-700">
                    {submission.verificationResult.error}
                  </p>
                  {submission.verificationResult.blockchainError && (
                    <p className="text-xs text-red-600 mt-2">
                      Blockchain: {submission.verificationResult.blockchainError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Info - Only show if payment exists and has transaction hash */}
      {payment && payment.transactionHash && payment.transactionHash !== 'pending' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Payment Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(payment.amount)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 block mb-2">Transaction Hash:</span>
              <a
                href={`https://sepolia.celoscan.io/tx/${payment.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-blue-600 hover:underline break-all"
              >
                {payment.transactionHash}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payment */}
      {submission.status === VerificationStatus.APPROVED && (!payment || !payment.transactionHash || payment.transactionHash === 'pending') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Payment Processing</h2>
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-700">
              Payment is being processed on the blockchain. This may take a few moments...
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/tasks"
          className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
        >
          Browse More Tasks
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-6 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-center font-medium"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  );
}
