"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationLogger = exports.ModerationLogger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ModerationLogger {
    constructor(logDirectory = './logs') {
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }
        this.logFile = path.join(logDirectory, 'moderation.log');
    }
    /**
     * Log moderation decision
     */
    log(input, result) {
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
    consoleLog(result) {
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
    sanitizeContent(content) {
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
    getRecentLogs(limit = 100) {
        try {
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.trim().split('\n').slice(-limit);
            return lines.map((line) => JSON.parse(line));
        }
        catch (error) {
            console.error('Error reading logs:', error);
            return [];
        }
    }
    /**
     * Get moderation statistics
     */
    getStats() {
        const logs = this.getRecentLogs(1000);
        const stats = {
            total: logs.length,
            approved: logs.filter((log) => log.action === 'APPROVE').length,
            flagged: logs.filter((log) => log.action === 'FLAG_REVIEW').length,
            rejected: logs.filter((log) => log.action === 'AUTO_REJECT').length,
            byCategory: {},
        };
        // Count by category
        logs.forEach((log) => {
            Object.entries(log.categories).forEach(([category, detection]) => {
                if (detection.detected) {
                    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
                }
            });
        });
        return stats;
    }
}
exports.ModerationLogger = ModerationLogger;
exports.moderationLogger = new ModerationLogger();
