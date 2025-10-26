import { PROMPTS } from '../config/ai.config';
import {
  GeminiResponse,
  ImageVerificationInput,
  TextVerificationInput,
  VerificationResult,
} from '../types/ai.types';
import { cacheService } from './cache.service';
import { geminiService } from './gemini.service';

export class AIVerificationService {
  /**
   * Verify text-based task submission
   */
  async verifyTextTask(input: TextVerificationInput): Promise<VerificationResult> {
    console.log('\n🔍 Starting text verification...');
    console.log(`Task Type: ${input.taskType || 'generic'}`);

    // Check cache first
    const cacheKey = cacheService.generateKey('text_verification', input);
    const cached = await cacheService.get<VerificationResult>(cacheKey);

    if (cached) {
      console.log('✅ Returning cached verification result');
      return cached;
    }

    try {
      // Build prompt from template
      const prompt = PROMPTS.TEXT_VERIFICATION
        .replace('{verificationCriteria}', input.verificationCriteria)
        .replace('{submissionText}', input.submissionText);

      // Call Gemini API
      console.log('📤 Sending prompt to Gemini...');
      const responseText = await geminiService.generateText(prompt);
      console.log('📥 Received response from Gemini');
      console.log('Response length:', responseText.length, 'chars');

      // Parse JSON response
      let geminiResponse: GeminiResponse;
      try {
        geminiResponse = geminiService.parseJsonResponse<GeminiResponse>(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse failed, attempting recovery...');

        // Attempt to extract key information from text response
        const approved = /approved['":\s]+true/i.test(responseText);
        const scoreMatch = responseText.match(/score['":\s]+(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

        geminiResponse = {
          approved,
          score,
          reasoning: 'Auto-extracted from malformed response: ' + responseText.substring(0, 200),
          violations: [],
        };

        console.log('⚠️ Using fallback parsing:', geminiResponse);
      }

      // Build verification result
      const result: VerificationResult = {
        approved: geminiResponse.approved,
        score: geminiResponse.score,
        reasoning: geminiResponse.reasoning,
        violations: geminiResponse.violations || [],
        timestamp: new Date().toISOString(),
        geminiResponse: responseText,
      };

      // Cache the result
      await cacheService.set(cacheKey, result);

      console.log('✅ Text verification completed');
      console.log(`Result: ${result.approved ? 'APPROVED' : 'REJECTED'} (Score: ${result.score})`);

      return result;
    } catch (error) {
      console.error('❌ Text verification failed:', error);
      throw new Error(`Text verification failed: ${error}`);
    }
  }

  /**
   * Verify image-based task submission
   */
  async verifyImageTask(input: ImageVerificationInput): Promise<VerificationResult> {
    console.log('\n🔍 Starting image verification...');
    console.log(`Image URL: ${input.imageUrl}`);

    // Check cache first
    const cacheKey = cacheService.generateKey('image_verification', input);
    const cached = await cacheService.get<VerificationResult>(cacheKey);

    if (cached) {
      console.log('✅ Returning cached verification result');
      return cached;
    }

    try {
      // Validate image URL
      if (!this.isValidImageUrl(input.imageUrl)) {
        throw new Error('Invalid image URL');
      }

      // Build prompt from template
      const prompt = PROMPTS.IMAGE_VERIFICATION
        .replace('{taskDescription}', input.taskDescription)
        .replace('{verificationCriteria}', input.verificationCriteria);

      // Call Gemini Vision API
      const responseText = await geminiService.generateFromImage(
        prompt,
        input.imageUrl
      );

      // Parse JSON response
      const geminiResponse = geminiService.parseJsonResponse<GeminiResponse>(responseText);

      // Build verification result
      const result: VerificationResult = {
        approved: geminiResponse.approved,
        score: geminiResponse.score,
        reasoning: geminiResponse.reasoning,
        issues: geminiResponse.issues || [],
        imageQuality: geminiResponse.imageQuality || 'good',
        timestamp: new Date().toISOString(),
        geminiResponse: responseText,
      };

      // Cache the result
      await cacheService.set(cacheKey, result);

      console.log('✅ Image verification completed');
      console.log(`Result: ${result.approved ? 'APPROVED' : 'REJECTED'} (Score: ${result.score})`);
      console.log(`Image Quality: ${result.imageQuality}`);

      return result;
    } catch (error) {
      console.error('❌ Image verification failed:', error);
      throw new Error(`Image verification failed: ${error}`);
    }
  }

  /**
   * Verify survey submission (convenience method)
   */
  async verifySurveySubmission(
    answers: Record<string, any>,
    expectedFormat: string
  ): Promise<VerificationResult> {
    return this.verifyTextTask({
      submissionText: JSON.stringify(answers, null, 2),
      verificationCriteria: `Survey must follow this format: ${expectedFormat}. Check if all required questions are answered and responses are valid.`,
      taskType: 'survey',
    });
  }

  /**
   * Verify content moderation task
   */
  async verifyContentModeration(
    content: string,
    moderationGuidelines: string
  ): Promise<VerificationResult> {
    return this.verifyTextTask({
      submissionText: content,
      verificationCriteria: `Moderation Guidelines: ${moderationGuidelines}. Check if the content violates any guidelines. Be thorough in identifying harmful, inappropriate, or spam content.`,
      taskType: 'content_moderation',
    });
  }

  /**
   * Batch verify multiple submissions (cost-optimized)
   */
  async batchVerify(
    submissions: Array<TextVerificationInput | ImageVerificationInput>
  ): Promise<VerificationResult[]> {
    console.log(`\n📦 Batch verifying ${submissions.length} submissions...`);

    const results: VerificationResult[] = [];

    for (const submission of submissions) {
      try {
        let result: VerificationResult;

        if ('imageUrl' in submission) {
          result = await this.verifyImageTask(submission);
        } else {
          result = await this.verifyTextTask(submission);
        }

        results.push(result);
      } catch (error) {
        console.error('Batch verification error:', error);
        // Push failed result
        results.push({
          approved: false,
          score: 0,
          reasoning: `Verification failed: ${error}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`✅ Batch verification completed: ${results.length} results`);
    return results;
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    const rateLimitStatus = geminiService.getRateLimitStatus();
    const cacheStats = cacheService.getStats();

    return {
      status: 'healthy',
      rateLimit: rateLimitStatus,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper: Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      return (
        validProtocols.includes(parsed.protocol) &&
        validExtensions.some((ext) => parsed.pathname.toLowerCase().endsWith(ext))
      );
    } catch {
      return false;
    }
  }
}

export const aiVerificationService = new AIVerificationService();
