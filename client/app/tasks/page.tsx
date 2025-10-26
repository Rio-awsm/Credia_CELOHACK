"use client";

import { api } from "@/lib/api";
import { formatCurrency, formatTimeRemaining } from "@/lib/utils";
import { Task, TaskStatus, TaskType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function TaskCard({ task, index }: { task: Task; index: number }) {
  const taskTypeLabels: Record<TaskType, string> = {
    [TaskType.TEXT_VERIFICATION]: "Text",
    [TaskType.IMAGE_LABELING]: "Image",
    [TaskType.SURVEY]: "Survey",
    [TaskType.CONTENT_MODERATION]: "Moderation",
  };

  const taskTypeColors: Record<TaskType, string> = {
    [TaskType.TEXT_VERIFICATION]: "from-orange-500 to-orange-600",
    [TaskType.IMAGE_LABELING]: "from-orange-600 to-orange-700",
    [TaskType.SURVEY]: "from-orange-400 to-orange-500",
    [TaskType.CONTENT_MODERATION]: "from-orange-500 to-orange-700",
  };

  return (
    <Link href={`/tasks/${task.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="relative group cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative bg-background/80 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-6 hover:border-orange-500/40 transition-all duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
              {task.title}
            </h3>
            {task.paymentAmount >= 5 && (
              <motion.span
                className="ml-2 text-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-full font-semibold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💰 High
              </motion.span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
            {task.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                {formatCurrency(task.paymentAmount)}
              </span>
            </div>
            <span className="text-sm text-foreground/60">
              <span className="font-semibold text-foreground">
                {task.spotsRemaining}
              </span>
              /{task.maxSubmissions} spots
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-foreground/10 rounded-full h-1.5 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${
                  ((task.maxSubmissions - task.spotsRemaining) /
                    task.maxSubmissions) *
                  100
                }%`,
              }}
              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
            <span
              className={`text-xs px-3 py-1.5 bg-gradient-to-r ${
                taskTypeColors[task.taskType]
              } text-white rounded-full font-semibold`}
            >
              {taskTypeLabels[task.taskType]}
            </span>
            <span className="text-xs text-foreground/50 font-medium">
              ⏰ {formatTimeRemaining(task.expiresAt)}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function TasksPage() {
  const [filters, setFilters] = useState({
    status: TaskStatus.OPEN,
    taskType: undefined as TaskType | undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.tasks.list(filters),
  });

  const tasks = data?.data || [];

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
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
            </motion.div>
            <span className="text-sm font-semibold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              {tasks.length} Tasks Available
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Available Tasks
            </span>
          </h1>
          <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
            Complete AI-verified tasks and earn cUSD instantly on Celo Sepolia
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-background/60 backdrop-blur-md rounded-2xl border border-orange-500/20 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Filter Tasks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Task Type
              </label>
              <select
                value={filters.taskType || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    taskType: (e.target.value as TaskType) || undefined,
                  })
                }
                className="w-full px-4 py-3 bg-background/80 border border-orange-500/30 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-foreground backdrop-blur-sm transition-all"
              >
                <option value="">All Types</option>
                <option value={TaskType.TEXT_VERIFICATION}>
                  Text Verification
                </option>
                <option value={TaskType.IMAGE_LABELING}>Image Labeling</option>
                <option value={TaskType.SURVEY}>Survey</option>
                <option value={TaskType.CONTENT_MODERATION}>
                  Content Moderation
                </option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Task Grid */}
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task: Task, index: number) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No tasks available
            </h3>
            <p className="text-foreground/60">
              Check back soon for new opportunities!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
