'use client';


import { TaskCard } from '@/components/tasks/TaskCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { api } from '@/lib/api';
import { TaskStatus, TaskType } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function TasksPage() {
  const [filters, setFilters] = useState({
    status: TaskStatus.OPEN,
    taskType: undefined as TaskType | undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.list(filters),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tasks = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Tasks</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={filters.taskType || ''}
              onChange={(e) =>
                setFilters({ ...filters, taskType: e.target.value as TaskType || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value={TaskType.TEXT_VERIFICATION}>Text Verification</option>
              <option value={TaskType.IMAGE_LABELING}>Image Labeling</option>
              <option value={TaskType.SURVEY}>Survey</option>
              <option value={TaskType.CONTENT_MODERATION}>Content Moderation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task: any) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No tasks available at the moment
        </div>
      )}
    </div>
  );
}
