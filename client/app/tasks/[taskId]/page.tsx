'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.tasks.getById(taskId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const task = data?.data;

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/tasks"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        ← Back to Tasks
      </Link>

      {/* Task Details Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {task.taskType.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {formatCurrency(task.paymentAmount)}
            </span>
            {task.isExpiringSoon && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                ⏰ Expiring Soon
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed">{task.description}</p>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Requirements</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {task.verificationCriteria?.requiredFields?.map((field: string, index: number) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600 mb-1">Payment</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(task.paymentAmount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Spots Remaining</div>
            <div className="text-xl font-bold text-gray-900">
              {task.spotsRemaining}/{task.maxSubmissions}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
            <div className="text-xl font-bold text-gray-900">
              {formatTimeRemaining(task.expiresAt)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Submissions</div>
            <div className="text-xl font-bold text-gray-900">{task.submissionCount}</div>
          </div>
        </div>

        {/* Requester Info */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Posted by</div>
          <div className="font-mono text-sm text-gray-900">
            {task.requester.walletAddress}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Reputation: ⭐ {task.requester.reputationScore}
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/tasks/${taskId}/submit`}>
          <button
            disabled={task.spotsRemaining === 0 || !task.canSubmit}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {task.spotsRemaining === 0 ? 'No Spots Available' : 'Submit Task'}
          </button>
        </Link>
      </div>
    </div>
  );
}
