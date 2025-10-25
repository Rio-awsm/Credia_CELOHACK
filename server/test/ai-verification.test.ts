import { expect } from 'chai';
import { AIVerificationService } from '../src/services/ai-verification.service';
import { TextVerificationInput } from '../src/types/ai.types';

describe('AIVerificationService', function () {
  this.timeout(30000); // Increase timeout for API calls

  let aiService: AIVerificationService;

  before(() => {
    aiService = new AIVerificationService();
  });

  describe('Text Verification', function () {
    it('should verify a valid text submission', async function () {
      const input: TextVerificationInput = {
        submissionText: 'The sky is blue because of Rayleigh scattering of sunlight.',
        verificationCriteria: 'Answer must explain why the sky is blue with scientific reasoning.',
        taskType: 'text_verification',
      };

      const result = await aiService.verifyTextTask(input);

      expect(result).to.have.property('approved');
      expect(result).to.have.property('score');
      expect(result).to.have.property('reasoning');
      expect(result.score).to.be.a('number');
      expect(result.score).to.be.greaterThan(0);
      expect(result.score).to.be.lessThanOrEqual(100);
    });

    it('should reject invalid text submission', async function () {
      const input: TextVerificationInput = {
        submissionText: 'I like pizza',
        verificationCriteria: 'Answer must explain photosynthesis in plants.',
        taskType: 'text_verification',
      };

      const result = await aiService.verifyTextTask(input);

      expect(result.approved).to.be.false;
      expect(result.score).to.be.lessThan(50);
    });

    it('should cache repeated verification requests', async function () {
      const input: TextVerificationInput = {
        submissionText: 'Test caching',
        verificationCriteria: 'Must contain the word test',
        taskType: 'text_verification',
      };

      const result1 = await aiService.verifyTextTask(input);
      const result2 = await aiService.verifyTextTask(input);

      expect(result1.timestamp).to.equal(result2.timestamp);
    });
  });

  describe('Survey Verification', function () {
    it('should verify survey submissions', async function () {
      const answers = {
        question1: 'Answer 1',
        question2: 'Answer 2',
        question3: 'Answer 3',
      };

      const result = await aiService.verifySurveySubmission(
        answers,
        'Must contain answers for question1, question2, and question3'
      );

      expect(result).to.have.property('approved');
      expect(result).to.have.property('score');
    });
  });

  describe('Content Moderation', function () {
    it('should detect inappropriate content', async function () {
      const result = await aiService.verifyContentModeration(
        'This is spam spam spam',
        'Flag content that appears to be spam or repetitive'
      );

      expect(result).to.have.property('approved');
      expect(result).to.have.property('score');
    });

    it('should approve clean content', async function () {
      const result = await aiService.verifyContentModeration(
        'This is a helpful and constructive comment.',
        'Flag harmful, abusive, or spam content'
      );

      expect(result.approved).to.be.true;
    });
  });

  describe('Health Status', function () {
    it('should return service health status', async function () {
      const health = await aiService.getHealthStatus();

      expect(health).to.have.property('status');
      expect(health).to.have.property('rateLimit');
      expect(health).to.have.property('cache');
      expect(health.status).to.equal('healthy');
    });
  });

  describe('Batch Verification', function () {
    it('should batch verify multiple submissions', async function () {
      const submissions: TextVerificationInput[] = [
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

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(2);
      results.forEach((result) => {
        expect(result).to.have.property('approved');
        expect(result).to.have.property('score');
      });
    });
  });
});
