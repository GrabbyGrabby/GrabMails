import resendService from '../service/resend-service';
import app from '../hono/hono';

app.post('/webhooks', async (c) => {
	try {
		const rawBody = await c.req.text();
		const headers = {
			svixId: c.req.header('svix-id'),
			svixTimestamp: c.req.header('svix-timestamp'),
			svixSignature: c.req.header('svix-signature')
		};
		const verified = await resendService.verifyWebhookSignature(c, rawBody, headers);
		if (!verified) {
			return c.text('Unauthorized', 401);
		}
		const body = JSON.parse(rawBody);
		await resendService.webhooks(c, body);
		return c.text('success', 200);
	} catch (e) {
		console.error('Resend webhook error:', e);
		return c.text('Webhook error', 500);
	}
});
