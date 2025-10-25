import * as fs from 'fs';
import * as path from 'path';
import { ModerationInput, ModerationResult } from '../types/moderation.types';

export class ModerationLogger {
  private logFile: string;

  constructor(logDirectory: string = './logs') {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    this.logFile = path.join(logDirectory, 'moderation.log');
  }

  /**
   * Log moderation decision
   */
  log(input: ModerationInput, result: ModerationResult): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      submissionId: input.submissionId,
      action: result.action,
      flagged: result.flagged,
      categories: result.categories,
      contentPreview: this.sanitizeContent(input.content),
      explanation: result.explanation,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // Append to log file
    fs.appendFileSync(this.logFile, logLine, 'utf8');

    // Also log to console
    this.consoleLog(result);
  }

  /**
   * Console log with colors
   */
  private consoleLog(result: ModerationResult): void {
    const emoji = result.flagged ? '🚨' : '✅';
    const action = result.action;

    console.log(`\n${emoji} Moderation Result: ${action}`);
    
    if (result.flagged) {
      console.log('📋 Violations detected:');
      Object.entries(result.categories).forEach(([category, detection]) => {
        if (detection.detected) {
          console.log(`  - ${category}: ${detection.severity} (${detection.confidence}% confidence)`);
        }
      });
    }
    
    console.log(`💬 ${result.explanation}\n`);
  }

  /**
   * Sanitize content for logging (hide sensitive info)
   */
  private sanitizeContent(content: string): string {
    // Truncate to 100 chars
    const truncated = content.substring(0, 100);
    
    // Remove emails and URLs
    return truncated
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]');
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): any[] {
    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      return lines.map((line) => JSON.parse(line));
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }

  /**
   * Get moderation statistics
   */
  getStats(): any {
    const logs = this.getRecentLogs(1000);
    
    const stats = {
      total: logs.length,
      approved: logs.filter((log) => log.action === 'APPROVE').length,
      flagged: logs.filter((log) => log.action === 'FLAG_REVIEW').length,
      rejected: logs.filter((log) => log.action === 'AUTO_REJECT').length,
      byCategory: {} as Record<string, number>,
    };

    // Count by category
    logs.forEach((log) => {
      Object.entries(log.categories).forEach(([category, detection]: [string, any]) => {
        if (detection.detected) {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        }
      });
    });

    return stats;
  }
}

export const moderationLogger = new ModerationLogger();
