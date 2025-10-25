'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useWalletConnection } from '@/hooks/useWalletConnection'; // Changed import
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { VerificationStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isConnected, address, connect } = useWalletConnection(); // Use useWalletConnection

  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.users.getProfile(),
    enabled: isConnected,
  });

  const { data: submissionsData, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.submissions.mySubmissions(),
    enabled: isConnected,
  });

  // Refetch when wallet connects
  useEffect(() => {
    if (isConnected) {
      refetchProfile();
      refetchSubmissions();
    }
  }, [isConnected, refetchProfile, refetchSubmissions]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 mb-8">
          Please connect your wallet to view your dashboard
        </p>
        <button
          onClick={connect}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (profileLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const profile = profileData?.data;
  const submissions = submissionsData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Wallet Address */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Connected: <span className="font-mono">{address}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(profile?.totalEarnings || 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Completed Tasks</div>
          <div className="text-3xl font-bold text-gray-900">
            {profile?.stats?.submissionsApproved || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Approval Rate</div>
          <div className="text-3xl font-bold text-blue-600">
            {profile?.stats?.approvalRate || 0}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Reputation</div>
          <div className="text-3xl font-bold text-gray-900">
            ⭐ {profile?.reputationScore || 0}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Recent Submissions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission: any) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.task.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(submission.task.paymentAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        submission.verificationStatus === VerificationStatus.APPROVED
                          ? 'bg-green-100 text-green-800'
                          : submission.verificationStatus === VerificationStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {submission.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/submissions/${submission.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {submissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No submissions yet</p>
              <Link
                href="/tasks"
                className="text-blue-600 hover:underline font-medium"
              >
                Browse tasks to get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
