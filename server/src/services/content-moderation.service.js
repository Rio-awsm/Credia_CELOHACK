"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentModerationService = exports.ContentModerationService = void 0;
const moderation_config_1 = require("../config/moderation.config");
const moderation_types_1 = require("../types/moderation.types");
const moderation_logger_1 = require("../utils/moderation-logger");
const cache_service_1 = require("./cache.service");
const gemini_service_1 = require("./gemini.service");
const moderation_filters_service_1 = require("./moderation-filters.service");
class ContentModerationService {
    /**
     * Main moderation function
     */
    async moderateSubmission(input) {
        console.log('\n🛡️  Starting content moderation...');
        const content = input.content.trim();
        // Check cache first
        const cacheKey = cache_service_1.cacheService.generateKey('moderation', { content });
        const cached = await cache_service_1.cacheService.get(cacheKey);
        if (cached) {
            console.log('✅ Returning cached moderation result');
            return cached;
        }
        // Step 1: Check allowlist (instant approval)
        if (moderation_config_1.moderationConfig.enablePreFiltering && moderation_filters_service_1.moderationFiltersService.isAllowlisted(content)) {
            console.log('✅ Content is allowlisted - instant approval');
            const result = this.createSafeResult();
            await this.logAndCache(input, result, cacheKey);
            return result;
        }
        // Step 2: Check blocklist (instant rejection/flag)
        if (moderation_config_1.moderationConfig.enablePreFiltering) {
            const blocklistResult = moderation_filters_service_1.moderationFiltersService.checkBlocklist(content);
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
        }
        catch (error) {
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
    async moderateWithAI(content, input) {
        const prompt = `${moderation_config_1.MODERATION_SYSTEM_PROMPT}

CONTENT TO MODERATE:
"""
${content}
"""

${input.context ? `CONTEXT: Task Type: ${input.context.taskType}, Previous Violations: ${input.context.previousViolations || 0}` : ''}

Analyze this content and return your moderation decision in the specified JSON format.`;
        // Call Gemini API
        const responseText = await gemini_service_1.geminiService.generateText(prompt);
        // Parse response
        const geminiResponse = gemini_service_1.geminiService.parseJsonResponse(responseText);
        // Convert to our format
        const result = this.convertGeminiResponse(geminiResponse, responseText);
        console.log(`🤖 AI Moderation: ${result.action} (flagged: ${result.flagged})`);
        return result;
    }
    /**
     * Convert Gemini response to our ModerationResult format
     */
    convertGeminiResponse(response, rawResponse) {
        // Convert categories
        const categories = {
            spam: this.convertCategory(response.categories.spam),
            toxic: this.convertCategory(response.categories.toxic),
            hate_speech: this.convertCategory(response.categories.hate_speech),
            fraud: this.convertCategory(response.categories.fraud),
            inappropriate: this.convertCategory(response.categories.inappropriate),
        };
        // Determine action based on confidence and severity
        let action;
        const hasCritical = Object.values(categories).some((cat) => cat.severity === moderation_types_1.ModerationSeverity.CRITICAL);
        const highConfidence = Object.values(categories).some((cat) => cat.detected && cat.confidence >= moderation_config_1.moderationConfig.autoRejectThreshold);
        if (hasCritical && highConfidence) {
            action = moderation_types_1.ModerationAction.AUTO_REJECT;
        }
        else if (response.flagged) {
            action = moderation_types_1.ModerationAction.FLAG_REVIEW;
        }
        else {
            action = moderation_types_1.ModerationAction.APPROVE;
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
    convertCategory(category) {
        return {
            detected: category.detected,
            confidence: category.confidence,
            severity: this.parseSeverity(category.severity),
        };
    }
    /**
     * Parse severity string to enum
     */
    parseSeverity(severity) {
        const normalized = severity.toUpperCase();
        return (moderation_types_1.ModerationSeverity[normalized] ||
            moderation_types_1.ModerationSeverity.NONE);
    }
    /**
     * Create safe result (no violations)
     */
    createSafeResult() {
        return {
            flagged: false,
            categories: {
                spam: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                toxic: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                hate_speech: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                fraud: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                inappropriate: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
            },
            action: moderation_types_1.ModerationAction.APPROVE,
            explanation: 'Content is safe and approved.',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Create fallback result on error
     */
    createFallbackResult(error) {
        return {
            flagged: true,
            categories: {
                spam: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                toxic: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                hate_speech: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                fraud: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
                inappropriate: { detected: false, confidence: 0, severity: moderation_types_1.ModerationSeverity.NONE },
            },
            action: moderation_types_1.ModerationAction.FLAG_REVIEW,
            explanation: `Moderation failed due to error. Flagged for manual review. Error: ${error.message}`,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Log and cache result
     */
    async logAndCache(input, result, cacheKey) {
        // Log decision
        if (moderation_config_1.moderationConfig.enableLogging) {
            moderation_logger_1.moderationLogger.log(input, result);
        }
        // Cache result
        await cache_service_1.cacheService.set(cacheKey, result, 3600); // 1 hour cache
    }
    /**
     * Batch moderate multiple submissions
     */
    async batchModerate(inputs) {
        console.log(`\n🛡️  Batch moderating ${inputs.length} submissions...`);
        const results = [];
        for (const input of inputs) {
            try {
                const result = await this.moderateSubmission(input);
                results.push(result);
            }
            catch (error) {
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
        return moderation_logger_1.moderationLogger.getStats();
    }
    /**
     * Add custom blocklist pattern
     */
    addBlocklistPattern(pattern, category, severity) {
        moderation_filters_service_1.moderationFiltersService.addBlocklistPattern(pattern, category, severity);
    }
    /**
     * Add custom allowlist pattern
     */
    addAllowlistPattern(pattern) {
        moderation_filters_service_1.moderationFiltersService.addAllowlistPattern(pattern);
    }
}
exports.ContentModerationService = ContentModerationService;
exports.contentModerationService = new ContentModerationService();
