"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookEvent = void 0;
const axios_1 = __importDefault(require("axios"));
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["PAYMENT_COMPLETED"] = "payment.completed";
    WebhookEvent["PAYMENT_FAILED"] = "payment.failed";
    WebhookEvent["SUBMISSION_APPROVED"] = "submission.approved";
    WebhookEvent["SUBMISSION_REJECTED"] = "submission.rejected";
    WebhookEvent["TASK_COMPLETED"] = "task.completed";
    WebhookEvent["WORKER_ASSIGNED"] = "worker.assigned";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
const MAX_WEBHOOK_RETRIES = 3;
const WEBHOOK_TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 5000;
/**
 * Webhook Service
 * Handles outbound webhooks for payment and submission events
 */
class WebhookService {
    /**
     * Send webhook with retry logic
     */
    static async sendWebhook(event, data, webhookUrl) {
        // Get webhook URL from environment or parameter
        const url = webhookUrl || process.env.WEBHOOK_ENDPOINT || process.env.NOTIFICATION_WEBHOOK_URL;
        if (!url) {
            console.warn("⚠️  No webhook URL configured, skipping webhook");
            return {
                success: true,
                attempts: 0,
            };
        }
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_WEBHOOK_RETRIES; attempt++) {
            try {
                console.log(`🪝 Sending webhook [${event}] (Attempt ${attempt}/${MAX_WEBHOOK_RETRIES})`);
                const response = await this.client.post(url, {
                    ...payload,
                    attemptNumber: attempt,
                });
                if (response.status >= 200 && response.status < 300) {
                    console.log(`✅ Webhook sent successfully: ${response.status}`);
                    return {
                        success: true,
                        attempts: attempt,
                    };
                }
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            catch (error) {
                lastError = error;
                console.error(`⚠️  Webhook attempt ${attempt} failed:`, lastError.message);
                // If not the last attempt, wait before retrying
                if (attempt < MAX_WEBHOOK_RETRIES) {
                    console.log(`⏳ Retrying in ${RETRY_DELAY_MS}ms...`);
                    await this.sleep(RETRY_DELAY_MS);
                }
            }
        }
        console.error(`❌ Webhook failed after ${MAX_WEBHOOK_RETRIES} attempts: ${lastError?.message}`);
        return {
            success: false,
            attempts: MAX_WEBHOOK_RETRIES,
            error: lastError?.message,
        };
    }
    /**
     * Send payment completed webhook
     */
    static async sendPaymentCompleted(data) {
        try {
            await this.sendWebhook(WebhookEvent.PAYMENT_COMPLETED, data);
        }
        catch (error) {
            console.error("Failed to send payment completed webhook:", error);
            // Don't throw - webhooks are non-critical
        }
    }
    /**
     * Send payment failed webhook
     */
    static async sendPaymentFailed(data) {
        try {
            await this.sendWebhook(WebhookEvent.PAYMENT_FAILED, data);
        }
        catch (error) {
            console.error("Failed to send payment failed webhook:", error);
        }
    }
    /**
     * Send submission approved webhook
     */
    static async sendSubmissionApproved(data) {
        try {
            await this.sendWebhook(WebhookEvent.SUBMISSION_APPROVED, data);
        }
        catch (error) {
            console.error("Failed to send submission approved webhook:", error);
        }
    }
    /**
     * Send submission rejected webhook
     */
    static async sendSubmissionRejected(data) {
        try {
            await this.sendWebhook(WebhookEvent.SUBMISSION_REJECTED, data);
        }
        catch (error) {
            console.error("Failed to send submission rejected webhook:", error);
        }
    }
    /**
     * Send task completed webhook
     */
    static async sendTaskCompleted(data) {
        try {
            await this.sendWebhook(WebhookEvent.TASK_COMPLETED, data);
        }
        catch (error) {
            console.error("Failed to send task completed webhook:", error);
        }
    }
    /**
     * Send worker assigned webhook
     */
    static async sendWorkerAssigned(data) {
        try {
            await this.sendWebhook(WebhookEvent.WORKER_ASSIGNED, data);
        }
        catch (error) {
            console.error("Failed to send worker assigned webhook:", error);
        }
    }
    /**
     * Sleep helper
     */
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
WebhookService.client = axios_1.default.create({
    timeout: WEBHOOK_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
        "User-Agent": "TaskEscrow-WebhookService/1.0",
    },
});
exports.webhookService = WebhookService;
