"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const content_moderation_service_1 = require("../src/services/content-moderation.service");
const moderation_types_1 = require("../src/types/moderation.types");
describe('ContentModerationService', function () {
    this.timeout(60000); // Increase timeout for API calls
    describe('Safe Content', function () {
        it('should approve clean, normal content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'This is a helpful and constructive comment about the task.',
            });
            (0, chai_1.expect)(result.flagged).to.be.false;
            (0, chai_1.expect)(result.action).to.equal(moderation_types_1.ModerationAction.APPROVE);
        });
        it('should approve simple responses', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Yes',
            });
            (0, chai_1.expect)(result.action).to.equal(moderation_types_1.ModerationAction.APPROVE);
        });
    });
    describe('Spam Detection', function () {
        it('should detect repetitive spam content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Buy now! Click here! Limited time offer! Buy now! Act fast!',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.spam.detected).to.be.true;
        });
        it('should detect bot-generated nonsense', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'asdfghjkl qwertyuiop zxcvbnm asdfghjkl qwertyuiop',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
        });
        it('should detect character repetition spam', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'aaaaaaaaaaaaaaaaaa',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.spam.detected).to.be.true;
        });
    });
    describe('Toxic Content Detection', function () {
        it('should detect offensive language', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'You are stupid and worthless, idiot!',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.toxic.detected).to.be.true;
        });
        it('should detect aggressive language', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'I hate you so much, you are the worst person ever.',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.toxic.detected).to.be.true;
        });
    });
    describe('Hate Speech Detection', function () {
        it('should detect discriminatory content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'All [ethnic group] are criminals and should be deported.',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.hate_speech.detected).to.be.true;
        });
    });
    describe('Fraud Detection', function () {
        it('should detect fake data attempts', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Random answer random answer random answer to get paid quickly.',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
        });
        it('should detect copy-paste attempts', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum.',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
        });
    });
    describe('Inappropriate Content Detection', function () {
        it('should detect sexual content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Explicit sexual content here [inappropriate text]',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.categories.inappropriate.detected).to.be.true;
        });
        it('should detect violent content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Detailed description of violence and harm to others.',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
        });
    });
    describe('Edge Cases', function () {
        it('should handle sarcasm appropriately', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Oh great, another wonderful task. How amazing!',
                context: {
                    taskType: 'survey',
                },
            });
            // Sarcasm might be flagged but should not be auto-rejected
            if (result.flagged) {
                (0, chai_1.expect)(result.action).to.not.equal(moderation_types_1.ModerationAction.AUTO_REJECT);
            }
        });
        it('should handle educational content about sensitive topics', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'This historical article discusses discrimination in the 1960s.',
            });
            // Educational content should be approved or flagged for review, not auto-rejected
            (0, chai_1.expect)(result.action).to.not.equal(moderation_types_1.ModerationAction.AUTO_REJECT);
        });
        it('should handle quotes and citations', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'As quoted in the article: "controversial statement here"',
            });
            // Quotes should be evaluated in context
            (0, chai_1.expect)(result).to.have.property('action');
        });
        it('should handle empty content', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: '',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
        });
        it('should handle very long content', async function () {
            const longContent = 'This is a test. '.repeat(100);
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: longContent,
            });
            (0, chai_1.expect)(result).to.have.property('action');
        });
    });
    describe('Blocklist Functionality', function () {
        it('should instantly reject blocklisted pharmaceutical spam', async function () {
            const result = await content_moderation_service_1.contentModerationService.moderateSubmission({
                content: 'Buy cheap viagra online now!',
            });
            (0, chai_1.expect)(result.flagged).to.be.true;
            (0, chai_1.expect)(result.action).to.equal(moderation_types_1.ModerationAction.AUTO_REJECT);
        });
    });
    describe('Batch Moderation', function () {
        it('should moderate multiple submissions', async function () {
            const inputs = [
                { content: 'This is safe content' },
                { content: 'This is spam spam spam spam' },
                { content: 'Another safe comment' },
            ];
            const results = await content_moderation_service_1.contentModerationService.batchModerate(inputs);
            (0, chai_1.expect)(results).to.have.lengthOf(3);
            (0, chai_1.expect)(results[0].action).to.equal(moderation_types_1.ModerationAction.APPROVE);
            (0, chai_1.expect)(results[1].flagged).to.be.true;
            (0, chai_1.expect)(results[2].action).to.equal(moderation_types_1.ModerationAction.APPROVE);
        });
    });
    describe('Statistics', function () {
        it('should return moderation statistics', function () {
            const stats = content_moderation_service_1.contentModerationService.getStats();
            (0, chai_1.expect)(stats).to.have.property('total');
            (0, chai_1.expect)(stats).to.have.property('approved');
            (0, chai_1.expect)(stats).to.have.property('flagged');
            (0, chai_1.expect)(stats).to.have.property('rejected');
            (0, chai_1.expect)(stats).to.have.property('byCategory');
        });
    });
});
