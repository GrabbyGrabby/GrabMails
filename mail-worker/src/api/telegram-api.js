import app from '../hono/hono';
import telegramService from '../service/telegram-service';

app.get('/telegram/getEmail/:token', async (c) => {
	const { html, nonce } = await telegramService.getEmailContent(c, c.req.param());
	c.header('Cache-Control', 'private, no-store');
	c.header(
		'Content-Security-Policy',
		nonce
			? `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src https: http: data:; font-src https: data:;`
			: `default-src 'none'; style-src 'unsafe-inline';`
	);
	return c.html(html);
});
