"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryError = void 0;
exports.withRetry = withRetry;
class RetryError extends Error {
    constructor(message, attempts, lastError) {
        super(message);
        this.attempts = attempts;
        this.lastError = lastError;
        this.name = 'RetryError';
    }
}
exports.RetryError = RetryError;
async function withRetry(fn, config, context = 'operation') {
    let lastError = null;
    let delay = config.initialDelay;
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            console.warn(`${context} failed (attempt ${attempt}/${config.maxRetries}):`, error instanceof Error ? error.message : error);
            // Don't retry on certain errors
            if (isNonRetryableError(error)) {
                throw error;
            }
            if (attempt < config.maxRetries) {
                console.log(`Retrying ${context} in ${delay}ms...`);
                await sleep(delay);
                delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
            }
        }
    }
    throw new RetryError(`${context} failed after ${config.maxRetries} attempts`, config.maxRetries, lastError);
}
function isNonRetryableError(error) {
    const nonRetryableMessages = [
        'invalid api key',
        'authentication failed',
        'not found',
        'bad request',
    ];
    const errorMessage = error?.message?.toLowerCase() || '';
    return nonRetryableMessages.some((msg) => errorMessage.includes(msg));
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
