import { AIServiceConfig } from '../types/ai.types';

export const aiConfig: AIServiceConfig = {
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBUjw754YS4sZZEWNYk9z2sC30YfiwubQI',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  temperature: 0, // Consistent results
  maxOutputTokens: 1024,
  
  cache: {
    enabled: process.env.REDIS_URL ? true : false,
    ttl: 3600, // 1 hour cache
  },
  
  retry: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
  },
  
  rateLimit: {
    maxRequests: 60, // 60 requests per minute
    windowMs: 60 * 1000, // 1 minute
  },
};

// Prompt templates
export const PROMPTS = {
  TEXT_VERIFICATION: `You are a task verification assistant. Analyze the following submission against the criteria.

VERIFICATION CRITERIA:
{verificationCriteria}

USER SUBMISSION:
{submissionText}

TASK:
1. Check if the submission meets ALL criteria
2. Provide a verification score (0-100)
3. List any violations or issues
4. Give approval recommendation (APPROVE/REJECT)

OUTPUT FORMAT (JSON only):
{
  "approved": boolean,
  "score": number,
  "violations": string[],
  "reasoning": string
}

Be strict but fair. Only approve submissions that clearly meet criteria. Return ONLY valid JSON, no markdown or additional text.`,

  IMAGE_VERIFICATION: `You are an image verification expert. Analyze this image against the task requirements.

TASK DESCRIPTION:
{taskDescription}

VERIFICATION CRITERIA:
{verificationCriteria}

Analyze the image and determine:
1. Does it match the task requirements?
2. Is the image quality acceptable (not blurry, proper lighting)?
3. Are there any inappropriate or irrelevant elements?
4. Quality score (0-100)

OUTPUT FORMAT (JSON only):
{
  "approved": boolean,
  "score": number,
  "image_quality": "excellent" | "good" | "poor",
  "issues": string[],
  "reasoning": string
}

Return ONLY valid JSON, no markdown or additional text.`,
};
