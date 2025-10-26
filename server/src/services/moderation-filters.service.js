"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationFiltersService = exports.ModerationFiltersService = void 0;
const moderation_config_1 = require("../config/moderation.config");
const moderation_types_1 = require("../types/moderation.types");
class ModerationFiltersService {
    /**
     * Check if content matches allowlist (safe content, skip AI check)
     */
    isAllowlisted(content) {
        const trimmed = content.trim();
        return moderation_config_1.ALLOWLIST_PATTERNS.some((pattern) => pattern.test(trimmed));
    }
    /**
     * Check if content matches blocklist (instant rejection)
     */
    checkBlocklist(content) {
        for (const rule of moderation_config_1.BLOCKLIST_PATTERNS) {
            const matches = content.match(rule.pattern);
            if (matches) {
                console.log(`🚫 Blocklist match: ${rule.category} (${rule.severity})`);
                return this.createBlocklistResult(rule.category, rule.severity, matches);
            }
        }
        return null;
    }
    /**
     * Create moderation result for blocklist match
     */
    createBlocklistResult(category, severity, matches) {
        const categories = {
            spam: this.createEmptyDetection(),
            toxic: this.createEmptyDetection(),
            hate_speech: this.createEmptyDetection(),
            fraud: this.createEmptyDetection(),
            inappropriate: this.createEmptyDetection(),
        };
        // Set the matched category
        if (category in categories) {
            categories[category] = {
                detected: true,
                confidence: 100,
                severity,
                examples: matches.slice(0, 3), // Max 3 examples
            };
        }
        return {
            flagged: true,
            categories,
            action: severity === moderation_types_1.ModerationSeverity.CRITICAL
                ? moderation_types_1.ModerationAction.AUTO_REJECT
                : moderation_types_1.ModerationAction.FLAG_REVIEW,
            explanation: `Blocklist match: ${category} (${severity}). Matched pattern in content.`,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Create empty category detection
     */
    createEmptyDetection() {
        return {
            detected: false,
            confidence: 0,
            severity: moderation_types_1.ModerationSeverity.NONE,
        };
    }
    /**
     * Add custom blocklist pattern
     */
    addBlocklistPattern(pattern, category, severity) {
        moderation_config_1.BLOCKLIST_PATTERNS.push({
            pattern,
            category,
            severity,
        });
        console.log(`✅ Added blocklist pattern for ${category}`);
    }
    /**
     * Add custom allowlist pattern
     */
    addAllowlistPattern(pattern) {
        moderation_config_1.ALLOWLIST_PATTERNS.push(pattern);
        console.log(`✅ Added allowlist pattern`);
    }
}
exports.ModerationFiltersService = ModerationFiltersService;
exports.moderationFiltersService = new ModerationFiltersService();
