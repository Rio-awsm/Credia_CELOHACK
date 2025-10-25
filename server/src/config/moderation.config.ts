import { ModerationSeverity } from '../types/moderation.types';

export const moderationConfig = {
  // Confidence threshold for auto-rejection
  autoRejectThreshold: 85,
  
  // Confidence threshold for flagging
  flagThreshold: 60,
  
  // Enable pre-filtering (blocklist/allowlist)
  enablePreFiltering: true,
  
  // Log all moderation decisions
  enableLogging: true,
  
  // Safety settings for Gemini
  safetySettings: {
    HARM_CATEGORY_HARASSMENT: 'BLOCK_NONE',
    HARM_CATEGORY_HATE_SPEECH: 'BLOCK_NONE',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'BLOCK_NONE',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'BLOCK_NONE',
  },
};

// System prompt for content moderation
export const MODERATION_SYSTEM_PROMPT = `You are a content moderation AI. Your task is to detect violations in user submissions for a micro-task platform.

MODERATION CATEGORIES:
1. Spam: Repetitive, nonsensical, or bot-generated content
2. Toxic: Rude, disrespectful, offensive language
3. Hate Speech: Targets protected characteristics (race, religion, gender, etc.)
4. Fraud: Attempts to game the system or provide fake data
5. Inappropriate: Sexual, violent, or illegal content

ANALYSIS STEPS:
1. Classify the content across all categories
2. Assign severity: LOW/MEDIUM/HIGH/CRITICAL
3. For CRITICAL violations, auto-reject immediately
4. For MEDIUM/HIGH, flag for manual review
5. For LOW, approve with warning

SEVERITY GUIDELINES:
- NONE: No violation detected
- LOW: Minor violation, acceptable with warning
- MEDIUM: Moderate violation, needs review
- HIGH: Serious violation, likely rejection
- CRITICAL: Severe violation, immediate auto-reject

CONFIDENCE LEVELS:
- >85%: High confidence, can take automated action
- 60-85%: Medium confidence, flag for review
- <60%: Low confidence, approve but log

OUTPUT FORMAT (JSON only):
{
  "flagged": boolean,
  "categories": {
    "spam": {"detected": boolean, "confidence": number (0-100), "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "examples": ["specific phrase 1"]},
    "toxic": {"detected": boolean, "confidence": number, "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "examples": []},
    "hate_speech": {"detected": boolean, "confidence": number, "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "examples": []},
    "fraud": {"detected": boolean, "confidence": number, "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "examples": []},
    "inappropriate": {"detected": boolean, "confidence": number, "severity": "NONE|LOW|MEDIUM|HIGH|CRITICAL", "examples": []}
  },
  "action": "APPROVE" | "FLAG_REVIEW" | "AUTO_REJECT",
  "explanation": "Brief explanation of the decision"
}

IMPORTANT:
- Be precise and accurate
- High confidence (>85%) is required for auto-rejection
- Consider context (sarcasm, educational content, quotes)
- Return ONLY valid JSON, no markdown or additional text`;

// Blocklist patterns (instant rejection)
export const BLOCKLIST_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  severity: ModerationSeverity;
}> = [
  {
    pattern: /\b(viagra|cialis|pharmacy)\b/gi,
    category: 'spam',
    severity: ModerationSeverity.CRITICAL,
  },
  {
    pattern: /\b(click here|buy now|limited time|act now)\b.*\b(http|www)\b/gi,
    category: 'spam',
    severity: ModerationSeverity.HIGH,
  },
  {
    pattern: /(.)\1{10,}/g, // Repeated characters (10+)
    category: 'spam',
    severity: ModerationSeverity.MEDIUM,
  },
  {
    pattern: /\b(kill yourself|kys)\b/gi,
    category: 'toxic',
    severity: ModerationSeverity.CRITICAL,
  },
];

// Allowlist patterns (skip AI check if matched)
export const ALLOWLIST_PATTERNS: RegExp[] = [
  /^(yes|no|maybe|ok|okay)$/i,
  /^\d+$/, // Just numbers
  /^[a-z]{1,3}$/i, // Single letters or short codes
];
