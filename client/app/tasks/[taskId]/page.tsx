'use client';

import { api } from '@/lib/api';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Award, CheckCircle2, Clock, Sparkles, Users, Wallet } from 'lucide-react';
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  const task = data?.data;

  if (!task) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ top: "20%", left: "10%" }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Task Not Found</h2>
            <p className="text-foreground/60 mb-8">This task may have been removed or doesn't exist.</p>
            <Link href="/tasks">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tasks
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const progressPercentage = ((task.maxSubmissions - task.spotsRemaining) / task.maxSubmissions) * 100;

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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 pt-32">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-8 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-background/80 backdrop-blur-md rounded-3xl border border-orange-500/20 overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-8 border-b border-orange-500/10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
                >
                  {task.title}
                </motion.h1>
                
                <div className="flex flex-wrap gap-3">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-500 rounded-full text-sm font-semibold"
                  >
                    {task.taskType.replace('_', ' ')}
                  </motion.span>
                  
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm font-bold flex items-center gap-1"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                    {formatCurrency(task.paymentAmount)}
                  </motion.span>
                  
                  {task.isExpiringSoon && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-full text-sm font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-4 h-4" />
                      Expiring Soon
                    </motion.span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-foreground/60">
                <span>{task.maxSubmissions - task.spotsRemaining} completed</span>
                <span>{task.spotsRemaining} spots left</span>
              </div>
              <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Description
              </h2>
              <p className="text-foreground/70 leading-relaxed text-lg">{task.description}</p>
            </motion.div>

            {/* Requirements */}
            {task.verificationCriteria?.requiredFields && task.verificationCriteria.requiredFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  Requirements
                </h2>
                <ul className="space-y-3">
                  {task.verificationCriteria.requiredFields.map((field: string, index: number) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3 text-foreground/70"
                    >
                      <div className="mt-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex-shrink-0" />
                      <span>{field}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: Wallet, label: 'Payment', value: formatCurrency(task.paymentAmount), color: 'from-orange-500 to-orange-600' },
                { icon: Users, label: 'Spots Left', value: `${task.spotsRemaining}/${task.maxSubmissions}`, color: 'from-orange-600 to-orange-700' },
                { icon: Clock, label: 'Time Left', value: formatTimeRemaining(task.expiresAt), color: 'from-orange-400 to-orange-500' },
                { icon: Award, label: 'Submissions', value: task.submissionCount.toString(), color: 'from-orange-500 to-orange-600' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-4 text-center"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${stat.color} rounded-xl mb-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs text-foreground/60 mb-1">{stat.label}</div>
                  <div className="text-lg font-bold text-foreground">{stat.value}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Requester Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-foreground/60 mb-1">Posted by</div>
                  <div className="font-mono text-sm text-foreground bg-background/50 px-3 py-2 rounded-lg break-all mb-2">
                    {task.requester.walletAddress}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground/60">Reputation:</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-orange-500">{task.requester.reputationScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link href={`/tasks/${taskId}/submit`}>
                <motion.button
                  whileHover={task.spotsRemaining > 0 && task.canSubmit ? { scale: 1.02 } : {}}
                  whileTap={task.spotsRemaining > 0 && task.canSubmit ? { scale: 0.98 } : {}}
                  disabled={task.spotsRemaining === 0 || !task.canSubmit}
                  className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 disabled:shadow-none"
                >
                  {task.spotsRemaining === 0 ? 'No Spots Available' : !task.canSubmit ? 'Cannot Submit' : 'Submit Task'}
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}