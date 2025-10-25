import { MODERATION_SYSTEM_PROMPT, moderationConfig } from '../config/moderation.config';
import {
    CategoryDetection,
    GeminiModerationResponse,
    ModerationAction,
    ModerationCategories,
    ModerationInput,
    ModerationResult,
    ModerationSeverity,
} from '../types/moderation.types';
import { moderationLogger } from '../utils/moderation-logger';
import { cacheService } from './cache.service';
import { geminiService } from './gemini.service';
import { moderationFiltersService } from './moderation-filters.service';

export class ContentModerationService {
  /**
   * Main moderation function
   */
  async moderateSubmission(input: ModerationInput): Promise<ModerationResult> {
    console.log('\n🛡️  Starting content moderation...');
    
    const content = input.content.trim();

    // Check cache first
    const cacheKey = cacheService.generateKey('moderation', { content });
    const cached = await cacheService.get<ModerationResult>(cacheKey);
    
    if (cached) {
      console.log('✅ Returning cached moderation result');
      return cached;
    }

    // Step 1: Check allowlist (instant approval)
    if (moderationConfig.enablePreFiltering && moderationFiltersService.isAllowlisted(content)) {
      console.log('✅ Content is allowlisted - instant approval');
      const result = this.createSafeResult();
      await this.logAndCache(input, result, cacheKey);
      return result;
    }

    // Step 2: Check blocklist (instant rejection/flag)
    if (moderationConfig.enablePreFiltering) {
      const blocklistResult = moderationFiltersService.checkBlocklist(content);
      if (blocklistResult) {
        await this.logAndCache(input, blocklistResult, cacheKey);
        return blocklistResult;
      }
    }

    // Step 3: AI-based moderation with Gemini
    try {
      const result = await this.moderateWithAI(content, input);
      await this.logAndCache(input, result, cacheKey);
      return result;
    } catch (error) {
      console.error('❌ Moderation error:', error);
      
      // Fallback: flag for manual review on error
      const fallbackResult = this.createFallbackResult(error);
      await this.logAndCache(input, fallbackResult, cacheKey);
      return fallbackResult;
    }
  }

  /**
   * Moderate content using Gemini AI
   */
  private async moderateWithAI(content: string, input: ModerationInput): Promise<ModerationResult> {
    const prompt = `${MODERATION_SYSTEM_PROMPT}

CONTENT TO MODERATE:
"""
${content}
"""

${input.context ? `CONTEXT: Task Type: ${input.context.taskType}, Previous Violations: ${input.context.previousViolations || 0}` : ''}

Analyze this content and return your moderation decision in the specified JSON format.`;

    // Call Gemini API
    const responseText = await geminiService.generateText(prompt);

    // Parse response
    const geminiResponse = geminiService.parseJsonResponse<GeminiModerationResponse>(responseText);

    // Convert to our format
    const result = this.convertGeminiResponse(geminiResponse, responseText);

    console.log(`🤖 AI Moderation: ${result.action} (flagged: ${result.flagged})`);

    return result;
  }

  /**
   * Convert Gemini response to our ModerationResult format
   */
  private convertGeminiResponse(
    response: GeminiModerationResponse,
    rawResponse: string
  ): ModerationResult {
    // Convert categories
    const categories: ModerationCategories = {
      spam: this.convertCategory(response.categories.spam),
      toxic: this.convertCategory(response.categories.toxic),
      hate_speech: this.convertCategory(response.categories.hate_speech),
      fraud: this.convertCategory(response.categories.fraud),
      inappropriate: this.convertCategory(response.categories.inappropriate),
    };

    // Determine action based on confidence and severity
    let action: ModerationAction;
    
    const hasCritical = Object.values(categories).some(
      (cat) => cat.severity === ModerationSeverity.CRITICAL
    );
    
    const highConfidence = Object.values(categories).some(
      (cat) => cat.detected && cat.confidence >= moderationConfig.autoRejectThreshold
    );

    if (hasCritical && highConfidence) {
      action = ModerationAction.AUTO_REJECT;
    } else if (response.flagged) {
      action = ModerationAction.FLAG_REVIEW;
    } else {
      action = ModerationAction.APPROVE;
    }

    return {
      flagged: response.flagged,
      categories,
      action,
      explanation: response.explanation,
      timestamp: new Date().toISOString(),
      geminiResponse: rawResponse,
    };
  }

  /**
   * Convert individual category from Gemini format
   */
  private convertCategory(category: {
    detected: boolean;
    confidence: number;
    severity: string;
  }): CategoryDetection {
    return {
      detected: category.detected,
      confidence: category.confidence,
      severity: this.parseSeverity(category.severity),
    };
  }

  /**
   * Parse severity string to enum
   */
  private parseSeverity(severity: string): ModerationSeverity {
    const normalized = severity.toUpperCase();
    return (
      ModerationSeverity[normalized as keyof typeof ModerationSeverity] ||
      ModerationSeverity.NONE
    );
  }

  /**
   * Create safe result (no violations)
   */
  private createSafeResult(): ModerationResult {
    return {
      flagged: false,
      categories: {
        spam: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        toxic: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        hate_speech: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        fraud: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        inappropriate: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
      },
      action: ModerationAction.APPROVE,
      explanation: 'Content is safe and approved.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create fallback result on error
   */
  private createFallbackResult(error: any): ModerationResult {
    return {
      flagged: true,
      categories: {
        spam: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        toxic: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        hate_speech: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        fraud: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
        inappropriate: { detected: false, confidence: 0, severity: ModerationSeverity.NONE },
      },
      action: ModerationAction.FLAG_REVIEW,
      explanation: `Moderation failed due to error. Flagged for manual review. Error: ${error.message}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log and cache result
   */
  private async logAndCache(
    input: ModerationInput,
    result: ModerationResult,
    cacheKey: string
  ): Promise<void> {
    // Log decision
    if (moderationConfig.enableLogging) {
      moderationLogger.log(input, result);
    }

    // Cache result
    await cacheService.set(cacheKey, result, 3600); // 1 hour cache
  }

  /**
   * Batch moderate multiple submissions
   */
  async batchModerate(inputs: ModerationInput[]): Promise<ModerationResult[]> {
    console.log(`\n🛡️  Batch moderating ${inputs.length} submissions...`);

    const results: ModerationResult[] = [];

    for (const input of inputs) {
      try {
        const result = await this.moderateSubmission(input);
        results.push(result);
      } catch (error) {
        console.error('Batch moderation error:', error);
        results.push(this.createFallbackResult(error));
      }
    }

    return results;
  }

  /**
   * Get moderation statistics
   */
  getStats() {
    return moderationLogger.getStats();
  }

  /**
   * Add custom blocklist pattern
   */
  addBlocklistPattern(pattern: RegExp, category: string, severity: ModerationSeverity): void {
    moderationFiltersService.addBlocklistPattern(pattern, category, severity);
  }

  /**
   * Add custom allowlist pattern
   */
  addAllowlistPattern(pattern: RegExp): void {
    moderationFiltersService.addAllowlistPattern(pattern);
  }
}

export const contentModerationService = new ContentModerationService();
