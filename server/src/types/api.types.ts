import { Request } from 'express';
import { TaskStatus, TaskType } from './database.types';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
    userId?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Task DTOs
export interface CreateTaskDto {
  title: string;
  description: string;
  taskType: TaskType;
  paymentAmount: number;
  verificationCriteria: {
    requiredFields: string[];
    aiPrompt: string;
    minConfidenceScore?: number;
  };
  maxSubmissions: number;
  expiresAt: string; // ISO date string
}

export interface TaskListQuery {
  status?: TaskStatus;
  taskType?: TaskType;
  limit?: number;
  offset?: number;
  sortBy?: 'payment' | 'createdAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

// Submission DTOs
export interface CreateSubmissionDto {
  taskId: string;
  submissionData: {
    text?: string;
    imageUrls?: string[];
    answers?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

export interface VerificationWebhookDto {
  submissionId: string;
  verificationResult: {
    approved: boolean;
    score: number;
    reasoning: string;
    violations?: string[];
  };
}

// User DTOs
export interface RegisterUserDto {
  walletAddress: string;
  phoneNumber?: string;
  role: 'requester' | 'worker';
}

// Wallet signature verification
export interface SignatureVerificationDto {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: number;
}
