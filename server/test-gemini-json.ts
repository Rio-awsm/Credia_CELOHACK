import 'dotenv/config';
import { geminiService } from './src/services/gemini.service';
import { PROMPTS } from './src/config/ai.config';

async function testGeminiJson() {
    try {
        console.log('🧪 Testing Gemini JSON Response...\n');

        const testPrompt = PROMPTS.TEXT_VERIFICATION
            .replace('{verificationCriteria}', 'The text should be meaningful and make sense')
            .replace('{submissionText}', 'The quick brown fox jumps over the lazy dog');

        console.log('📤 Sending test prompt...\n');
        const response = await geminiService.generateText(testPrompt);

        console.log('📥 Raw Response:');
        console.log('─'.repeat(60));
        console.log(response);
        console.log('─'.repeat(60));
        console.log();

        console.log('🔧 Parsing JSON...');
        const parsed = geminiService.parseJsonResponse(response);

        console.log('✅ Parsed successfully!');
        console.log(JSON.stringify(parsed, null, 2));
        console.log();

        console.log('📊 Response Analysis:');
        console.log(`   Approved: ${parsed.approved}`);
        console.log(`   Score: ${parsed.score}`);
        console.log(`   Reasoning: ${parsed.reasoning}`);
        console.log(`   Violations: ${parsed.violations?.length || 0}`);

        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    }
}

testGeminiJson();
