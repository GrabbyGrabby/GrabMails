import app from '../hono/hono';
import result from '../model/result';
import BizError from '../error/biz-error';
import { runAiWithFallback, stripHtmlForAi, parseSubjectLines } from '../utils/ai-helper';

app.post('/ai/subjectLines', async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { content, topic } = body;

	const cleanContent = stripHtmlForAi(content || topic || '');
	if (!cleanContent) {
		throw new BizError('Please provide content or a topic to generate subject lines', 400);
	}

	const ai = c.env.ai;
	if (!ai) {
		throw new BizError('Workers AI binding not configured in environment', 503);
	}

	const promptText = `Generate 4 compelling, deliverability-friendly email subject lines based on the following email content/topic.
Rules:
- High open rate and engaging
- No spam-trigger words (avoid excessive punctuation, avoid ALL CAPS, avoid "FREE $$$")
- Return ONLY a JSON array of strings, like ["Subject 1", "Subject 2", "Subject 3", "Subject 4"]. No explanation.

Email content:
${cleanContent.slice(0, 3000)}`;

	try {
		const { result: aiResp } = await runAiWithFallback(ai, c.env.ai_model, {
			messages: [
				{
					role: 'system',
					content: 'You are an expert email marketer specializing in high open rates and spam avoidance. Always respond strictly with a valid JSON array of strings.'
				},
				{
					role: 'user',
					content: promptText
				}
			],
			temperature: 0.7,
			max_tokens: 256
		});

		const rawOutput = typeof aiResp === 'string' ? aiResp : (aiResp?.response || '');
		let subjects = parseSubjectLines(rawOutput);

		if (subjects.length === 0) {
			subjects = [
				`Update: ${cleanContent.slice(0, 40)}`,
				`Important details regarding ${cleanContent.slice(0, 30)}`,
				`Quick overview inside`,
				`New update for you`
			];
		}

		return c.json(result.ok(subjects));
	} catch (err) {
		console.error('AI subject line generation error:', err);
		throw new BizError('Failed to generate subject lines: ' + (err.message || 'AI error'), 500);
	}
});

app.post('/ai/assist', async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { text, action = 'polish' } = body;

	const cleanText = stripHtmlForAi(text || '');
	if (!cleanText) {
		throw new BizError('Please provide text to process', 400);
	}

	const ai = c.env.ai;
	if (!ai) {
		throw new BizError('Workers AI binding not configured in environment', 503);
	}

	const actionPrompts = {
		polish: 'Improve clarity, flow, and fix any grammatical or spelling issues while preserving meaning.',
		shorten: 'Make this concise, punchy, and clear for a quick email read.',
		expand: 'Expand on these key points with professional detail and context suitable for a newsletter.',
		professional: 'Rewrite this with a polished, confident, professional business tone.',
		summarize: 'Summarize the key message and action items of this email clearly in 2-3 bullet points.'
	};

	const instruction = actionPrompts[action] || actionPrompts.polish;

	try {
		const { result: aiResp } = await runAiWithFallback(ai, c.env.ai_model, {
			messages: [
				{
					role: 'system',
					content: `You are an expert editor and email copywriter. ${instruction} Output only the revised text without preamble or commentary.`
				},
				{
					role: 'user',
					content: cleanText.slice(0, 4000)
				}
			],
			temperature: 0.3,
			max_tokens: 1024
		});

		const revisedText = typeof aiResp === 'string' ? aiResp : (aiResp?.response || '');
		return c.json(result.ok({ text: revisedText.trim() }));
	} catch (err) {
		console.error('AI assistant error:', err);
		throw new BizError('Failed to process text with AI: ' + (err.message || 'AI error'), 500);
	}
});

app.post('/ai/compose', async (c) => {
	const body = await c.req.json().catch(() => ({}));
	const { prompt, tone = 'professional', context = '' } = body;

	const cleanPrompt = stripHtmlForAi(prompt || '');
	if (!cleanPrompt) {
		throw new BizError('Please provide a prompt or description for the email to compose', 400);
	}

	const ai = c.env.ai;
	if (!ai) {
		throw new BizError('Workers AI binding not configured in environment', 503);
	}

	const toneMap = {
		professional: 'polite, clear, respectful and business-ready',
		friendly: 'warm, welcoming, conversational and upbeat',
		direct: 'concise, action-driven, and straight to the point',
		persuasive: 'compelling, value-focused, and persuasive without spam triggers'
	};
	const toneStyle = toneMap[tone] || toneMap.professional;

	try {
		const { result: aiResp } = await runAiWithFallback(ai, c.env.ai_model, {
			messages: [
				{
					role: 'system',
					content: `You are an elite email copywriter. Compose an email based on the prompt.
Tone: ${toneStyle}.
Deliverability Rules:
- No spam-trigger words, no ALL CAPS, no excessive exclamation marks
- Deliver clear formatting with paragraph breaks
Return ONLY a valid JSON object with keys "subject" and "body".
Format example:
{"subject": "Follow up regarding project proposal", "body": "Hi there,\\n\\nI wanted to follow up..."}`
				},
				{
					role: 'user',
					content: `Prompt: ${cleanPrompt}${context ? `\nAdditional Context: ${stripHtmlForAi(context).slice(0, 1000)}` : ''}`
				}
			],
			temperature: 0.6,
			max_tokens: 1024
		});

		const rawOutput = typeof aiResp === 'string' ? aiResp : (aiResp?.response || '');
		let subject = '';
		let content = '';

		try {
			const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				subject = parsed.subject || '';
				content = parsed.body || parsed.content || '';
			}
		} catch (e) {
			// fall through to text parsing
		}

		if (!content) {
			// If not strict JSON, treat lines
			const lines = rawOutput.split('\n').filter(Boolean);
			if (lines.length > 1 && (lines[0].toLowerCase().startsWith('subject:') || lines[0].startsWith('#'))) {
				subject = lines[0].replace(/^subject:\s*|^#+\s*/i, '').trim();
				content = lines.slice(1).join('\n').trim();
			} else {
				subject = cleanPrompt.slice(0, 50);
				content = rawOutput.replace(/^```json\s*|```$/g, '').trim();
			}
		}

		return c.json(result.ok({
			subject: subject || cleanPrompt.slice(0, 50),
			body: content || cleanPrompt
		}));
	} catch (err) {
		console.error('AI compose error:', err);
		throw new BizError('Failed to compose email with AI: ' + (err.message || 'AI error'), 500);
	}
});
