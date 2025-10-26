"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ai_verification_service_1 = require("../src/services/ai-verification.service");
describe('AIVerificationService', function () {
    this.timeout(30000); // Increase timeout for API calls
    let aiService;
    before(() => {
        aiService = new ai_verification_service_1.AIVerificationService();
    });
    describe('Text Verification', function () {
        it('should verify a valid text submission', async function () {
            const input = {
                submissionText: 'The sky is blue because of Rayleigh scattering of sunlight.',
                verificationCriteria: 'Answer must explain why the sky is blue with scientific reasoning.',
                taskType: 'text_verification',
            };
            const result = await aiService.verifyTextTask(input);
            (0, chai_1.expect)(result).to.have.property('approved');
            (0, chai_1.expect)(result).to.have.property('score');
            (0, chai_1.expect)(result).to.have.property('reasoning');
            (0, chai_1.expect)(result.score).to.be.a('number');
            (0, chai_1.expect)(result.score).to.be.greaterThan(0);
            (0, chai_1.expect)(result.score).to.be.lessThanOrEqual(100);
        });
        it('should reject invalid text submission', async function () {
            const input = {
                submissionText: 'I like pizza',
                verificationCriteria: 'Answer must explain photosynthesis in plants.',
                taskType: 'text_verification',
            };
            const result = await aiService.verifyTextTask(input);
            (0, chai_1.expect)(result.approved).to.be.false;
            (0, chai_1.expect)(result.score).to.be.lessThan(50);
        });
        it('should cache repeated verification requests', async function () {
            const input = {
                submissionText: 'Test caching',
                verificationCriteria: 'Must contain the word test',
                taskType: 'text_verification',
            };
            const result1 = await aiService.verifyTextTask(input);
            const result2 = await aiService.verifyTextTask(input);
            (0, chai_1.expect)(result1.timestamp).to.equal(result2.timestamp);
        });
    });
    describe('Survey Verification', function () {
        it('should verify survey submissions', async function () {
            const answers = {
                question1: 'Answer 1',
                question2: 'Answer 2',
                question3: 'Answer 3',
            };
            const result = await aiService.verifySurveySubmission(answers, 'Must contain answers for question1, question2, and question3');
            (0, chai_1.expect)(result).to.have.property('approved');
            (0, chai_1.expect)(result).to.have.property('score');
        });
    });
    describe('Content Moderation', function () {
        it('should detect inappropriate content', async function () {
            const result = await aiService.verifyContentModeration('This is spam spam spam', 'Flag content that appears to be spam or repetitive');
            (0, chai_1.expect)(result).to.have.property('approved');
            (0, chai_1.expect)(result).to.have.property('score');
        });
        it('should approve clean content', async function () {
            const result = await aiService.verifyContentModeration('This is a helpful and constructive comment.', 'Flag harmful, abusive, or spam content');
            (0, chai_1.expect)(result.approved).to.be.true;
        });
    });
    describe('Health Status', function () {
        it('should return service health status', async function () {
            const health = await aiService.getHealthStatus();
            (0, chai_1.expect)(health).to.have.property('status');
            (0, chai_1.expect)(health).to.have.property('rateLimit');
            (0, chai_1.expect)(health).to.have.property('cache');
            (0, chai_1.expect)(health.status).to.equal('healthy');
        });
    });
    describe('Batch Verification', function () {
        it('should batch verify multiple submissions', async function () {
            const submissions = [
                {
                    submissionText: 'Valid answer 1',
                    verificationCriteria: 'Must be a valid answer',
                },
                {
                    submissionText: 'Valid answer 2',
                    verificationCriteria: 'Must be a valid answer',
                },
            ];
            const results = await aiService.batchVerify(submissions);
            (0, chai_1.expect)(results).to.be.an('array');
            (0, chai_1.expect)(results).to.have.lengthOf(2);
            results.forEach((result) => {
                (0, chai_1.expect)(result).to.have.property('approved');
                (0, chai_1.expect)(result).to.have.property('score');
            });
        });
    });
});
