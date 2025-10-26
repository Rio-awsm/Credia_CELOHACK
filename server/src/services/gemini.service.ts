import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig } from '../config/ai.config';
import { RateLimiter } from '../utils/rate-limiter';
import { withRetry } from '../utils/retry';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private rateLimiter: RateLimiter;

  constructor() {
    if (!aiConfig.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(aiConfig.apiKey);
    this.rateLimiter = new RateLimiter(aiConfig.rateLimit);
  }

  async generateText(prompt: string): Promise<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit();

    return withRetry(
      async () => {
        const model = this.genAI.getGenerativeModel({
          model: aiConfig.model,
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxOutputTokens,
            responseMimeType: "application/json", // Force JSON response
          },
        });

        console.log(`🤖 Calling Gemini API (${aiConfig.model})...`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log(`✅ Gemini API response received (${text.length} chars)`);
        return text;
      },
      aiConfig.retry,
      'Gemini API call'
    );
  }

  async generateFromImage(
    prompt: string,
    imageUrl: string
  ): Promise<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit();

    return withRetry(
      async () => {
        // Use vision model for image analysis
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxOutputTokens,
            responseMimeType: "application/json", // Force JSON response
          },
        });

        console.log(`🖼️  Calling Gemini Vision API...`);

        // Fetch image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        // Get mime type
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        console.log(`✅ Gemini Vision API response received`);
        return text;
      },
      aiConfig.retry,
      'Gemini Vision API call'
    );
  }

  parseJsonResponse<T>(responseText: string): T {
    try {
      // Remove markdown code blocks if present
      let cleaned = responseText.trim();

      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      // Try to extract JSON object if there's extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      // Additional cleanup - remove any trailing commas before closing braces
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(cleaned);

      // Validate that we got an object back
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Response is not a valid JSON object');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse JSON response. Raw response:', responseText);
      console.error('Parse error:', error);

      // Log the first 500 chars for debugging
      console.error('Response preview:', responseText.substring(0, 500));

      throw new Error(`Invalid JSON response from Gemini: ${error}`);
    }
  }

  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }
}

export const geminiService = new GeminiService();