// Enums
export enum UserRole {
  REQUESTER = 'requester',
  WORKER = 'worker',
}

export enum TaskType {
  TEXT_VERIFICATION = 'text_verification',
  IMAGE_LABELING = 'image_labeling',
  SURVEY = 'survey',
  CONTENT_MODERATION = 'content_moderation',
}

export enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// User Interface
export interface User {
  id: string;
  walletAddress: string;
  phoneNumber?: string | null;
  role: UserRole;
  reputationScore: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task Interface
export interface Task {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  taskType: TaskType;
  paymentAmount: number;
  status: TaskStatus;
  verificationCriteria: VerificationCriteria;
  maxSubmissions: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Verification Criteria (stored as JSONB)
export interface VerificationCriteria {
  requiredFields: string[];
  aiPrompt: string;
  minConfidenceScore?: number;
  customRules?: Record<string, any>;
}

// Submission Interface
export interface Submission {
  id: string;
  taskId: string;
  workerId: string;
  submissionData: SubmissionData;
  aiVerificationResult?: AIVerificationResult | null;
  verificationStatus: VerificationStatus;
  paymentTransactionHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Submission Data (stored as JSONB - flexible structure)
export interface SubmissionData {
  text?: string;
  imageUrls?: string[];
  answers?: Record<string, any>;
  metadata?: Record<string, any>;
}

// AI Verification Result (Gemini API response)
export interface AIVerificationResult {
  verified: boolean;
  confidenceScore: number;
  reasoning: string;
  geminiResponse: string;
  timestamp: string;
}

// Payment Interface
export interface Payment {
  id: string;
  taskId: string;
  workerId: string;
  amount: number;
  transactionHash: string;
  status: PaymentStatus;
  createdAt: Date;
}

// DTOs (Data Transfer Objects) for API

export interface CreateUserDto {
  walletAddress: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface CreateTaskDto {
  requesterId: string;
  title: string;
  description: string;
  taskType: TaskType;
  paymentAmount: number;
  verificationCriteria: VerificationCriteria;
  maxSubmissions: number;
  expiresAt: Date;
}

export interface CreateSubmissionDto {
  taskId: string;
  workerId: string;
  submissionData: SubmissionData;
}

export interface CreatePaymentDto {
  taskId: string;
  workerId: string;
  amount: number;
  transactionHash: string;
}

// Query Filter Types
export interface TaskFilters {
  status?: TaskStatus;
  taskType?: TaskType;
  requesterId?: string;
}

export interface SubmissionFilters {
  taskId?: string;
  workerId?: string;
  verificationStatus?: VerificationStatus;
}
