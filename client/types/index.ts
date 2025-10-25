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

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  paymentAmount: number;
  status: TaskStatus;
  verificationCriteria: any;
  maxSubmissions: number;
  submissionCount: number;
  spotsRemaining: number;
  expiresAt: string;
  timeRemaining: number;
  isExpiringSoon: boolean;
  requester: {
    walletAddress: string;
    reputationScore: number;
  };
}

export interface Submission {
  id: string;
  taskId: string;
  verificationStatus: VerificationStatus;
  submissionData: any;
  aiVerificationResult?: any;
  paymentTransactionHash?: string;
  createdAt: string;
  task: {
    title: string;
    paymentAmount: number;
  };
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  totalEarnings: number;
  reputationScore: number;
  stats: {
    submissionsTotal: number;
    submissionsApproved: number;
    submissionsRejected: number;
    approvalRate: string;
  };
}
