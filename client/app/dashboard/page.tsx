'use client';

import { useWalletConnection } from '@/hooks/useWalletConnection';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { VerificationStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, Clock, ExternalLink, Lock, Sparkles, TrendingUp, Wallet, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const earningsData = [
  { day: "Mon", earnings: 12.5 },
  { day: "Tue", earnings: 18.3 },
  { day: "Wed", earnings: 15.7 },
  { day: "Thu", earnings: 22.1 },
  { day: "Fri", earnings: 25.4 },
  { day: "Sat", earnings: 19.8 },
  { day: "Sun", earnings: 28.6 },
]

const tasksData = [
  { day: "Mon", completed: 4 },
  { day: "Tue", completed: 6 },
  { day: "Wed", completed: 5 },
  { day: "Thu", completed: 7 },
  { day: "Fri", completed: 8 },
  { day: "Sat", completed: 6 },
  { day: "Sun", completed: 9 },
]

export default function DashboardPage() {
  const { isConnected, address, connect } = useWalletConnection();

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
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            style={{ top: "10%", left: "-10%" }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-600/10 to-orange-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            style={{ bottom: "10%", right: "-10%" }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full mb-6"
            >
              <Lock className="w-12 h-12 text-orange-500" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Connect Your Wallet
              </span>
            </h2>
            <p className="text-foreground/60 mb-8 text-lg">
              Please connect your wallet to view your dashboard and track your earnings
            </p>
            <motion.button
              onClick={connect}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-lg shadow-lg shadow-orange-500/25 inline-flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (profileLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  const profile = profileData?.data;
  const submissions = submissionsData?.data || [];

  const stats = [
    {
      icon: Wallet,
      label: 'Total Earnings',
      value: formatCurrency(profile?.totalEarnings || 0),
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/30',
    },
    {
      icon: CheckCircle2,
      label: 'Completed Tasks',
      value: profile?.stats?.submissionsApproved || 0,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
    },
    {
      icon: TrendingUp,
      label: 'Approval Rate',
      value: `${profile?.stats?.approvalRate || 0}%`,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/30',
    },
    {
      icon: Award,
      label: 'Reputation',
      value: `⭐ ${profile?.reputationScore || 0}`,
      gradient: 'from-orange-400 to-orange-500',
      bgGradient: 'from-orange-400/10 to-orange-500/5',
      border: 'border-orange-400/30',
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', text: 'Approved' };
      case VerificationStatus.REJECTED:
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Rejected' };
      default:
        return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', text: 'Pending' };
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{ top: "10%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-600/10 to-orange-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          style={{ bottom: "10%", right: "-10%" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <Wallet className="w-4 h-4" />
                <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Active Worker
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-md rounded-2xl border ${stat.border} p-6 group cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  className={`w-2 h-2 bg-gradient-to-r ${stat.gradient} rounded-full`}
                />
              </div>
              <div className="text-sm text-foreground/60 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-background/80 backdrop-blur-md rounded-3xl border border-orange-500/20 overflow-hidden"
        >
          <div className="p-6 border-b border-orange-500/10">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              Recent Submissions
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl mb-4"
              >
                <Sparkles className="w-10 h-10 text-orange-500" />
              </motion.div>
              <p className="text-foreground/60 mb-6 text-lg">No submissions yet</p>
              <Link href="/tasks">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold inline-flex items-center gap-2"
                >
                  Browse Tasks
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground/60 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-500/10">
                  {submissions.map((submission: any, index: number) => {
                    const statusConfig = getStatusConfig(submission.verificationStatus);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <motion.tr
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-orange-500/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-foreground">
                            {submission.task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                            {formatCurrency(submission.task.paymentAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/60">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/submissions/${submission.id}`}
                            className="text-sm text-orange-500 hover:text-orange-600 font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            View Details
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
          {/* Earnings Chart */}
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/40 transition-colors">
            <h3 className="font-semibold text-lg mb-4">Weekly Earnings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff8c00" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffa500" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,140,0,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 15, 0.95)",
                    border: "1px solid rgba(255,140,0,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="earnings" fill="url(#colorEarnings)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks Chart */}
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/40 transition-colors">
            <h3 className="font-semibold text-lg mb-4">Tasks Completed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tasksData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff8c00" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ffa500" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,140,0,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 15, 15, 0.95)",
                    border: "1px solid rgba(255,140,0,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="url(#colorTasks)"
                  strokeWidth={3}
                  dot={{ fill: "#ff8c00", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}