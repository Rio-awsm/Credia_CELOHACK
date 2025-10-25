// Severity levels
export enum ModerationSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Moderation actions
export enum ModerationAction {
  APPROVE = 'APPROVE',
  FLAG_REVIEW = 'FLAG_REVIEW',
  AUTO_REJECT = 'AUTO_REJECT',
}

// Category detection result
export interface CategoryDetection {
  detected: boolean;
  confidence: number; // 0-100
  severity: ModerationSeverity;
  examples?: string[]; // Specific examples found
}

// All moderation categories
export interface ModerationCategories {
  spam: CategoryDetection;
  toxic: CategoryDetection;
  hate_speech: CategoryDetection;
  fraud: CategoryDetection;
  inappropriate: CategoryDetection;
}

// Main moderation result
export interface ModerationResult {
  flagged: boolean;
  categories: ModerationCategories;
  action: ModerationAction;
  explanation: string;
  timestamp: string;
  submissionId?: string;
  geminiResponse?: string;
}

// Input for moderation
export interface ModerationInput {
  content: string;
  contentType?: 'text' | 'image' | 'mixed';
  context?: {
    taskType?: string;
    userId?: string;
    previousViolations?: number;
  };
  submissionId?: string;
}

// Gemini moderation response structure
export interface GeminiModerationResponse {
  flagged: boolean;
  categories: {
    spam: { detected: boolean; confidence: number; severity: string };
    toxic: { detected: boolean; confidence: number; severity: string };
    hate_speech: { detected: boolean; confidence: number; severity: string };
    fraud: { detected: boolean; confidence: number; severity: string };
    inappropriate: { detected: boolean; confidence: number; severity: string };
  };
  action: 'APPROVE' | 'FLAG_REVIEW' | 'AUTO_REJECT';
  explanation: string;
}

// Filter rules
export interface FilterRule {
  pattern: string | RegExp;
  category: keyof ModerationCategories;
  severity: ModerationSeverity;
  description: string;
}

// Moderation statistics
export interface ModerationStats {
  totalChecks: number;
  approved: number;
  flagged: number;
  rejected: number;
  byCategory: Record<keyof ModerationCategories, number>;
}
