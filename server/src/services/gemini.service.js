"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const ai_config_1 = require("../config/ai.config");
const rate_limiter_1 = require("../utils/rate-limiter");
const retry_1 = require("../utils/retry");
class GeminiService {
    constructor() {
        if (!ai_config_1.aiConfig.apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(ai_config_1.aiConfig.apiKey);
        this.rateLimiter = new rate_limiter_1.RateLimiter(ai_config_1.aiConfig.rateLimit);
    }
    async generateText(prompt) {
        // Check rate limit
        await this.rateLimiter.checkLimit();
        return (0, retry_1.withRetry)(async () => {
            const model = this.genAI.getGenerativeModel({
                model: ai_config_1.aiConfig.model,
                generationConfig: {
                    temperature: ai_config_1.aiConfig.temperature,
                    maxOutputTokens: ai_config_1.aiConfig.maxOutputTokens,
                },
            });
            console.log(`🤖 Calling Gemini API (${ai_config_1.aiConfig.model})...`);
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            console.log(`✅ Gemini API response received (${text.length} chars)`);
            return text;
        }, ai_config_1.aiConfig.retry, 'Gemini API call');
    }
    async generateFromImage(prompt, imageUrl) {
        // Check rate limit
        await this.rateLimiter.checkLimit();
        return (0, retry_1.withRetry)(async () => {
            // Use vision model for image analysis
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    temperature: ai_config_1.aiConfig.temperature,
                    maxOutputTokens: ai_config_1.aiConfig.maxOutputTokens,
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
        }, ai_config_1.aiConfig.retry, 'Gemini Vision API call');
    }
    parseJsonResponse(responseText) {
        try {
            // Remove markdown code blocks if present
            let cleaned = responseText.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            }
            else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }
            return JSON.parse(cleaned);
        }
        catch (error) {
            console.error('Failed to parse JSON response:', responseText);
            throw new Error(`Invalid JSON response from Gemini: ${error}`);
        }
    }
    getRateLimitStatus() {
        return this.rateLimiter.getStatus();
    }
}
exports.GeminiService = GeminiService;
exports.geminiService = new GeminiService();
