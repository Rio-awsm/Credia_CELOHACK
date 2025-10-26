'use client';

import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { VerificationStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Sparkles, TrendingUp, Wallet, XCircle } from 'lucide-react';
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  const submission = data?.data?.submission;
  const task = data?.data?.task;
  const payment = data?.data?.payment;

  if (!submission) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ top: "20%", left: "10%" }}
          />
        </div>
        <div className="relative z-10 text-center py-32">
          <h2 className="text-2xl font-bold text-foreground">Submission not found</h2>
        </div>
      </div>
    );
  }

  const statusConfig = {
    [VerificationStatus.PENDING]: {
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
      icon: Clock,
      iconColor: 'text-orange-500',
      title: 'Verification in Progress',
      description: 'AI is verifying your submission. This usually takes 1-2 minutes.',
    },
    [VerificationStatus.APPROVED]: {
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/30',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      title: 'Submission Approved!',
      description: 'Your submission has been approved and payment has been sent to your wallet.',
    },
    [VerificationStatus.REJECTED]: {
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/30',
      icon: XCircle,
      iconColor: 'text-red-500',
      title: 'Submission Rejected',
      description: 'Your submission did not meet the verification criteria.',
    },
  };

  const config = statusConfig[submission.status as VerificationStatus];
  const StatusIcon = config.icon;

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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 pt-32">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`bg-gradient-to-br ${config.bgGradient} backdrop-blur-md rounded-3xl border ${config.border} p-8 mb-8`}
        >
          <div className="flex items-start gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className={`w-20 h-20 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center flex-shrink-0`}
            >
              <StatusIcon className="w-10 h-10 text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-foreground mb-2"
              >
                {config.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-foreground/70 text-lg"
              >
                {config.description}
              </motion.p>

              {/* Progress Bar for Pending */}
              {submission.status === VerificationStatus.PENDING && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6"
                >
                  <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                      animate={{ width: ["40%", "70%", "40%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-sm text-foreground/60 mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Estimated time: 1-2 minutes
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Task Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-background/80 backdrop-blur-md rounded-3xl border border-orange-500/20 p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Task Details</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-xl">
              <span className="text-foreground/60">Task:</span>
              <span className="font-semibold text-foreground">{task?.title}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-xl">
              <span className="text-foreground/60">Payment:</span>
              <span className="font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {formatCurrency(task?.paymentAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-foreground/5 rounded-xl">
              <span className="text-foreground/60">Submitted:</span>
              <span className="font-medium text-foreground">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Verification Results */}
        {submission.verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-background/80 backdrop-blur-md rounded-3xl border border-orange-500/20 p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Verification Results</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/20">
                <span className="text-foreground/60 font-medium">Score:</span>
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                    className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
                  >
                    {submission.verificationResult.score}
                  </motion.span>
                  <span className="text-foreground/60">/100</span>
                </div>
              </div>
              {submission.verificationResult.reasoning && (
                <div>
                  <span className="text-foreground/60 block mb-2 font-medium">AI Reasoning:</span>
                  <div className="bg-foreground/5 border border-orange-500/20 p-4 rounded-xl">
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {submission.verificationResult.reasoning}
                    </p>
                  </div>
                </div>
              )}
              {submission.verificationResult.error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-600 mb-1">Error:</p>
                      <p className="text-sm text-red-600/80">
                        {submission.verificationResult.error}
                      </p>
                      {submission.verificationResult.blockchainError && (
                        <p className="text-xs text-red-600/70 mt-2">
                          Blockchain: {submission.verificationResult.blockchainError}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Payment Info */}
        {payment && payment.transactionHash && payment.transactionHash !== 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-md rounded-3xl border border-green-500/30 p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center"
              >
                <Wallet className="w-5 h-5 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">💰 Payment Details</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-background/50 rounded-xl">
                <span className="text-foreground/60">Amount:</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
              <div className="p-3 bg-background/50 rounded-xl">
                <span className="text-foreground/60 block mb-2">Transaction Hash:</span>
                <a
                  href={`https://sepolia.celoscan.io/tx/${payment.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-orange-500 hover:text-orange-600 break-all flex items-center gap-2 transition-colors"
                >
                  {payment.transactionHash}
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Payment */}
        {submission.status === VerificationStatus.APPROVED && (!payment || !payment.transactionHash || payment.transactionHash === 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-md rounded-3xl border border-orange-500/30 p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">💰 Payment Processing</h2>
            </div>
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-orange-500" />
              </motion.div>
              <p className="text-sm text-foreground/70">
                Payment is being processed on the blockchain. This may take a few moments...
              </p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/tasks" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg shadow-orange-500/25"
            >
              Browse More Tasks
            </motion.button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-background/80 backdrop-blur-sm text-orange-500 border-2 border-orange-500/50 rounded-xl hover:border-orange-500 hover:bg-orange-500/10 transition-all font-bold"
            >
              View Dashboard
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}