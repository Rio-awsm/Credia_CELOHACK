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
exports.queueLogger = exports.QueueLogger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class QueueLogger {
    constructor(logDirectory = './logs') {
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }
        this.logFile = path.join(logDirectory, 'queue.log');
        this.metricsFile = path.join(logDirectory, 'queue-metrics.json');
    }
    log(level, message, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(data && { data }),
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logFile, logLine, 'utf8');
        // Console log with colors
        const emoji = {
            info: '📘',
            warn: '⚠️',
            error: '❌',
        }[level];
        console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '');
    }
    logJobStart(jobId, jobData) {
        this.log('info', `Job started: ${jobId}`, { jobData });
    }
    logJobComplete(jobId, duration, result) {
        this.log('info', `Job completed: ${jobId}`, { duration: `${duration}ms`, result });
        this.updateMetrics('completed', duration);
    }
    logJobFailed(jobId, error, attemptsMade) {
        this.log('error', `Job failed: ${jobId}`, {
            error: error.message,
            attemptsMade,
            stack: error.stack,
        });
        this.updateMetrics('failed');
    }
    updateMetrics(type, duration) {
        try {
            let metrics = { completed: 0, failed: 0, totalDuration: 0, avgDuration: 0 };
            if (fs.existsSync(this.metricsFile)) {
                const content = fs.readFileSync(this.metricsFile, 'utf8');
                metrics = JSON.parse(content);
            }
            if (type === 'completed') {
                metrics.completed++;
                if (duration) {
                    metrics.totalDuration += duration;
                    metrics.avgDuration = metrics.totalDuration / metrics.completed;
                }
            }
            else {
                metrics.failed++;
            }
            metrics.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
        }
        catch (error) {
            console.error('Failed to update metrics:', error);
        }
    }
    getMetrics() {
        try {
            if (fs.existsSync(this.metricsFile)) {
                const content = fs.readFileSync(this.metricsFile, 'utf8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.error('Failed to read metrics:', error);
        }
        return { completed: 0, failed: 0, avgDuration: 0 };
    }
}
exports.QueueLogger = QueueLogger;
exports.queueLogger = new QueueLogger();
