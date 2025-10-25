import * as fs from 'fs';
import * as path from 'path';

export class QueueLogger {
  private logFile: string;
  private metricsFile: string;

  constructor(logDirectory: string = './logs') {
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    this.logFile = path.join(logDirectory, 'queue.log');
    this.metricsFile = path.join(logDirectory, 'queue-metrics.json');
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
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

  logJobStart(jobId: string, jobData: any): void {
    this.log('info', `Job started: ${jobId}`, { jobData });
  }

  logJobComplete(jobId: string, duration: number, result?: any): void {
    this.log('info', `Job completed: ${jobId}`, { duration: `${duration}ms`, result });
    this.updateMetrics('completed', duration);
  }

  logJobFailed(jobId: string, error: any, attemptsMade: number): void {
    this.log('error', `Job failed: ${jobId}`, {
      error: error.message,
      attemptsMade,
      stack: error.stack,
    });
    this.updateMetrics('failed');
  }

  private updateMetrics(type: 'completed' | 'failed', duration?: number): void {
    try {
      let metrics: any = { completed: 0, failed: 0, totalDuration: 0, avgDuration: 0 };

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
      } else {
        metrics.failed++;
      }

      metrics.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  getMetrics(): any {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const content = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to read metrics:', error);
    }
    return { completed: 0, failed: 0, avgDuration: 0 };
  }
}

export const queueLogger = new QueueLogger();
