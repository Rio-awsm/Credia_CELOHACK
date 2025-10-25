'use client';

import { formatCurrency, formatTimeRemaining } from '@/lib/utils';
import { Task, TaskType } from '@/types';
import Link from 'next/link';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const taskTypeLabels: Record<TaskType, string> = {
    [TaskType.TEXT_VERIFICATION]: 'Text',
    [TaskType.IMAGE_LABELING]: 'Image',
    [TaskType.SURVEY]: 'Survey',
    [TaskType.CONTENT_MODERATION]: 'Moderation',
  };

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {task.title}
          </h3>
          {task.paymentAmount >= 5 && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              💰 High
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="font-semibold text-green-600">
            {formatCurrency(task.paymentAmount)}
          </span>
          <span className="text-gray-500">
            {task.spotsRemaining}/{task.maxSubmissions} spots
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
            {taskTypeLabels[task.taskType]}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimeRemaining(task.expiresAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
