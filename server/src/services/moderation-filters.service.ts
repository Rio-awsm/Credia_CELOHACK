import { ALLOWLIST_PATTERNS, BLOCKLIST_PATTERNS } from '../config/moderation.config';
import {
    CategoryDetection,
    ModerationAction,
    ModerationCategories,
    ModerationResult,
    ModerationSeverity,
} from '../types/moderation.types';

export class ModerationFiltersService {
  /**
   * Check if content matches allowlist (safe content, skip AI check)
   */
  isAllowlisted(content: string): boolean {
    const trimmed = content.trim();
    return ALLOWLIST_PATTERNS.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Check if content matches blocklist (instant rejection)
   */
  checkBlocklist(content: string): ModerationResult | null {
    for (const rule of BLOCKLIST_PATTERNS) {
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
  private createBlocklistResult(
    category: string,
    severity: ModerationSeverity,
    matches: RegExpMatchArray
  ): ModerationResult {
    const categories: ModerationCategories = {
      spam: this.createEmptyDetection(),
      toxic: this.createEmptyDetection(),
      hate_speech: this.createEmptyDetection(),
      fraud: this.createEmptyDetection(),
      inappropriate: this.createEmptyDetection(),
    };

    // Set the matched category
    if (category in categories) {
      categories[category as keyof ModerationCategories] = {
        detected: true,
        confidence: 100,
        severity,
        examples: matches.slice(0, 3), // Max 3 examples
      };
    }

    return {
      flagged: true,
      categories,
      action:
        severity === ModerationSeverity.CRITICAL
          ? ModerationAction.AUTO_REJECT
          : ModerationAction.FLAG_REVIEW,
      explanation: `Blocklist match: ${category} (${severity}). Matched pattern in content.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create empty category detection
   */
  private createEmptyDetection(): CategoryDetection {
    return {
      detected: false,
      confidence: 0,
      severity: ModerationSeverity.NONE,
    };
  }

  /**
   * Add custom blocklist pattern
   */
  addBlocklistPattern(pattern: RegExp, category: string, severity: ModerationSeverity): void {
    BLOCKLIST_PATTERNS.push({
      pattern,
      category,
      severity,
    });
    console.log(`✅ Added blocklist pattern for ${category}`);
  }

  /**
   * Add custom allowlist pattern
   */
  addAllowlistPattern(pattern: RegExp): void {
    ALLOWLIST_PATTERNS.push(pattern);
    console.log(`✅ Added allowlist pattern`);
  }
}

export const moderationFiltersService = new ModerationFiltersService();
