import { expect } from 'chai';
import { contentModerationService } from '../src/services/content-moderation.service';
import { ModerationAction } from '../src/types/moderation.types';

describe('ContentModerationService', function () {
  this.timeout(60000); // Increase timeout for API calls

  describe('Safe Content', function () {
    it('should approve clean, normal content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'This is a helpful and constructive comment about the task.',
      });

      expect(result.flagged).to.be.false;
      expect(result.action).to.equal(ModerationAction.APPROVE);
    });

    it('should approve simple responses', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Yes',
      });

      expect(result.action).to.equal(ModerationAction.APPROVE);
    });
  });

  describe('Spam Detection', function () {
    it('should detect repetitive spam content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Buy now! Click here! Limited time offer! Buy now! Act fast!',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.spam.detected).to.be.true;
    });

    it('should detect bot-generated nonsense', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'asdfghjkl qwertyuiop zxcvbnm asdfghjkl qwertyuiop',
      });

      expect(result.flagged).to.be.true;
    });

    it('should detect character repetition spam', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'aaaaaaaaaaaaaaaaaa',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.spam.detected).to.be.true;
    });
  });

  describe('Toxic Content Detection', function () {
    it('should detect offensive language', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'You are stupid and worthless, idiot!',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.toxic.detected).to.be.true;
    });

    it('should detect aggressive language', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'I hate you so much, you are the worst person ever.',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.toxic.detected).to.be.true;
    });
  });

  describe('Hate Speech Detection', function () {
    it('should detect discriminatory content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'All [ethnic group] are criminals and should be deported.',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.hate_speech.detected).to.be.true;
    });
  });

  describe('Fraud Detection', function () {
    it('should detect fake data attempts', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Random answer random answer random answer to get paid quickly.',
      });

      expect(result.flagged).to.be.true;
    });

    it('should detect copy-paste attempts', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum.',
      });

      expect(result.flagged).to.be.true;
    });
  });

  describe('Inappropriate Content Detection', function () {
    it('should detect sexual content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Explicit sexual content here [inappropriate text]',
      });

      expect(result.flagged).to.be.true;
      expect(result.categories.inappropriate.detected).to.be.true;
    });

    it('should detect violent content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Detailed description of violence and harm to others.',
      });

      expect(result.flagged).to.be.true;
    });
  });

  describe('Edge Cases', function () {
    it('should handle sarcasm appropriately', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Oh great, another wonderful task. How amazing!',
        context: {
          taskType: 'survey',
        },
      });

      // Sarcasm might be flagged but should not be auto-rejected
      if (result.flagged) {
        expect(result.action).to.not.equal(ModerationAction.AUTO_REJECT);
      }
    });

    it('should handle educational content about sensitive topics', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'This historical article discusses discrimination in the 1960s.',
      });

      // Educational content should be approved or flagged for review, not auto-rejected
      expect(result.action).to.not.equal(ModerationAction.AUTO_REJECT);
    });

    it('should handle quotes and citations', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'As quoted in the article: "controversial statement here"',
      });

      // Quotes should be evaluated in context
      expect(result).to.have.property('action');
    });

    it('should handle empty content', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: '',
      });

      expect(result.flagged).to.be.true;
    });

    it('should handle very long content', async function () {
      const longContent = 'This is a test. '.repeat(100);
      
      const result = await contentModerationService.moderateSubmission({
        content: longContent,
      });

      expect(result).to.have.property('action');
    });
  });

  describe('Blocklist Functionality', function () {
    it('should instantly reject blocklisted pharmaceutical spam', async function () {
      const result = await contentModerationService.moderateSubmission({
        content: 'Buy cheap viagra online now!',
      });

      expect(result.flagged).to.be.true;
      expect(result.action).to.equal(ModerationAction.AUTO_REJECT);
    });
  });

  describe('Batch Moderation', function () {
    it('should moderate multiple submissions', async function () {
      const inputs = [
        { content: 'This is safe content' },
        { content: 'This is spam spam spam spam' },
        { content: 'Another safe comment' },
      ];

      const results = await contentModerationService.batchModerate(inputs);

      expect(results).to.have.lengthOf(3);
      expect(results[0].action).to.equal(ModerationAction.APPROVE);
      expect(results[1].flagged).to.be.true;
      expect(results[2].action).to.equal(ModerationAction.APPROVE);
    });
  });

  describe('Statistics', function () {
    it('should return moderation statistics', function () {
      const stats = contentModerationService.getStats();

      expect(stats).to.have.property('total');
      expect(stats).to.have.property('approved');
      expect(stats).to.have.property('flagged');
      expect(stats).to.have.property('rejected');
      expect(stats).to.have.property('byCategory');
    });
  });
});
