/**
 * Helper utility for Cloudflare Workers AI execution with model normalization,
 * automatic fallback handling, and robust response parsing.
 */

export const DEFAULT_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export const FALLBACK_AI_MODELS = [
	'@cf/meta/llama-3.1-8b-instruct',
	'@cf/meta/llama-3-8b-instruct',
	'@cf/meta/llama-3.2-3b-instruct',
	'@cf/meta/llama-3.1-8b-instruct-fp8'
];

/**
 * Normalizes invalid or legacy model names (such as accidental -fast suffixes on Llama 3.1)
 */
export function normalizeAiModel(modelName) {
	if (!modelName || typeof modelName !== 'string') {
		return DEFAULT_AI_MODEL;
	}
	const trimmed = modelName.trim();
	// Fix accidental -fast suffix on Llama 3.1 8B
	if (trimmed === '@cf/meta/llama-3.1-8b-instruct-fast') {
		return '@cf/meta/llama-3.1-8b-instruct';
	}
	return trimmed;
}

/**
 * Executes a prompt against Cloudflare Workers AI with fallback models
 */
export async function runAiWithFallback(ai, preferredModel, payload) {
	if (!ai || typeof ai.run !== 'function') {
		throw new Error('Cloudflare Workers AI binding is not available');
	}

	const normalizedPreferred = normalizeAiModel(preferredModel);
	const modelsToTry = [
		normalizedPreferred,
		...FALLBACK_AI_MODELS.filter(m => m !== normalizedPreferred)
	];

	let lastError = null;

	for (const model of modelsToTry) {
		try {
			const result = await ai.run(model, payload);
			if (result) {
				return { result, modelUsed: model };
			}
		} catch (err) {
			lastError = err;
			console.warn(`Workers AI call failed for model ${model}:`, err.message || err);
			// Continue to next fallback model
		}
	}

	throw lastError || new Error('All AI models failed to execute');
}

/**
 * Parses subject line recommendations from raw AI output
 */
export function parseSubjectLines(rawOutput) {
	if (!rawOutput) return [];
	const text = typeof rawOutput === 'string' ? rawOutput : (rawOutput?.response || '');

	// Attempt JSON extraction first
	const jsonMatch = text.match(/\[[\s\S]*?\]/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed
					.map(s => String(s).replace(/^["']|["']$/g, '').trim())
					.filter(s => s.length >= 3 && s.length <= 120)
					.slice(0, 5);
			}
		} catch (e) {
			// Fallback to line parsing
		}
	}

	// Line-based extraction
	return text.split('\n')
		.map(line => line.replace(/^\s*(?:[-*•]|\d+[\.\)])\s*/, '').replace(/^["']|["']$/g, '').trim())
		.filter(line => line.length >= 5 && line.length <= 120 && !line.startsWith('Here are') && !line.startsWith('Sure'))
		.slice(0, 5);
}

/**
 * Strips HTML tags and normalizes whitespace for cleaner AI context
 */
export function stripHtmlForAi(htmlOrText) {
	if (!htmlOrText || typeof htmlOrText !== 'string') return '';
	return htmlOrText
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export default {
	DEFAULT_AI_MODEL,
	FALLBACK_AI_MODELS,
	normalizeAiModel,
	runAiWithFallback,
	parseSubjectLines,
	stripHtmlForAi
};
