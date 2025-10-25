// Verification result interfaces
export interface VerificationResult {
  approved: boolean;
  score: number;
  reasoning: string;
  violations?: string[];
  issues?: string[];
  imageQuality?: 'excellent' | 'good' | 'poor';
  timestamp: string;
  geminiResponse?: string;
}

// Text verification input
export interface TextVerificationInput {
  submissionText: string;
  verificationCriteria: string;
  taskType?: string;
}

// Image verification input
export interface ImageVerificationInput {
  imageUrl: string;
  taskDescription: string;
  verificationCriteria: string;
  submissionData?: any;
}

// Gemini API response structure
export interface GeminiResponse {
  approved: boolean;
  score: number;
  violations?: string[];
  issues?: string[];
  reasoning: string;
  imageQuality?: 'excellent' | 'good' | 'poor';
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// AI Service configuration
export interface AIServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  cache: CacheConfig;
  retry: RetryConfig;
  rateLimit: RateLimitConfig;
}
