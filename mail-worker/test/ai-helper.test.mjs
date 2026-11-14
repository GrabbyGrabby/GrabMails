import test from 'node:test';
import assert from 'node:assert/strict';
import {
	normalizeAiModel,
	runAiWithFallback,
	parseSubjectLines,
	stripHtmlForAi,
	DEFAULT_AI_MODEL
} from '../src/utils/ai-helper.js';

test('normalizeAiModel fixes invalid -fast suffix on Llama 3.1 8B', () => {
	assert.equal(
		normalizeAiModel('@cf/meta/llama-3.1-8b-instruct-fast'),
		'@cf/meta/llama-3.1-8b-instruct'
	);
	assert.equal(
		normalizeAiModel('@cf/meta/llama-3.1-8b-instruct'),
		'@cf/meta/llama-3.1-8b-instruct'
	);
	assert.equal(
		normalizeAiModel(''),
		DEFAULT_AI_MODEL
	);
	assert.equal(
		normalizeAiModel(null),
		DEFAULT_AI_MODEL
	);
});

test('parseSubjectLines parses JSON and bulleted lists', () => {
	const jsonOutput = '["Weekly Product Updates", "Exciting News Inside", "Don\'t Miss Out", "Your Digest"]';
	const parsedJson = parseSubjectLines(jsonOutput);
	assert.deepEqual(parsedJson, [
		"Weekly Product Updates",
		"Exciting News Inside",
		"Don't Miss Out",
		"Your Digest"
	]);

	const markdownOutput = `Here are 4 subject lines:
1. "Weekly Product Updates"
2. Exciting News Inside
* Don't Miss Out
- Your Digest`;
	const parsedMd = parseSubjectLines(markdownOutput);
	assert.equal(parsedMd.length, 4);
	assert.equal(parsedMd[0], "Weekly Product Updates");
	assert.equal(parsedMd[1], "Exciting News Inside");
});

test('stripHtmlForAi removes HTML tags, styles, and scripts', () => {
	const rawHtml = '<style>.btn{color:red;}</style><h1>Welcome</h1><p>Hello <b>World</b>!&nbsp;</p><script>alert(1)</script>';
	const stripped = stripHtmlForAi(rawHtml);
	assert.equal(stripped, 'Welcome Hello World !');
});

test('runAiWithFallback seamlessly falls back when primary model fails', async () => {
	const attemptedModels = [];
	const mockAi = {
		async run(model, payload) {
			attemptedModels.push(model);
			if (model === '@cf/meta/llama-3.1-8b-instruct-fast' || model === '@cf/meta/llama-3.1-8b-instruct') {
				throw new Error('Model not available in current region');
			}
			return { response: 'Fallback model output' };
		}
	};

	const { result, modelUsed } = await runAiWithFallback(
		mockAi,
		'@cf/meta/llama-3.1-8b-instruct-fast',
		{ messages: [{ role: 'user', content: 'test' }] }
	);

	assert.equal(result.response, 'Fallback model output');
	assert.equal(modelUsed, '@cf/meta/llama-3-8b-instruct');
	assert.equal(attemptedModels.includes('@cf/meta/llama-3.1-8b-instruct'), true);
	assert.equal(attemptedModels.includes('@cf/meta/llama-3-8b-instruct'), true);
});
