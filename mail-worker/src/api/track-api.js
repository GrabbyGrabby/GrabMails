import app from '../hono/hono';
import orm from '../entity/orm';
import { email } from '../entity/email';
import { eq, sql } from 'drizzle-orm';

// 1x1 transparent GIF bytes
const TRANSPARENT_GIF = new Uint8Array([
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
	0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
	0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
	0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
	0x01, 0x00, 0x3b
]);

function isBotOrPrefetch(c) {
	const ua = (c.req.header('user-agent') || '').toLowerCase();
	const purpose = (c.req.header('purpose') || c.req.header('sec-purpose') || '').toLowerCase();

	if (purpose.includes('prefetch') || purpose.includes('preview')) {
		return true;
	}

	// Apple Mail Privacy Protection (MPP) proxy
	if (ua.includes('applewebkit') && ua.includes('mailprivacyprotection')) {
		return true;
	}

	// Google Image Proxy
	if (ua.includes('googleimageproxy')) {
		return true;
	}

	// Automated web crawlers / antivirus link checkers
	if (/bot|crawl|spider|slurp|curl|wget|scanner|facebookexternalhit/i.test(ua)) {
		return true;
	}

	return false;
}

// Track email open via 1x1 transparent pixel
app.get('/track/open/:token', async (c) => {
	const rawToken = c.req.param('token');
	const cleanToken = rawToken.replace(/\.png|\.gif$/i, '');

	const isBot = isBotOrPrefetch(c);

	if (!isBot && cleanToken) {
		try {
			// cleanToken can be emailId or a base64 encoded token
			const emailId = Number(cleanToken);
			if (Number.isInteger(emailId) && emailId > 0) {
				// Record human read/open
				await orm(c)
					.update(email)
					.set({
						unread: 1, // Marked as read
						message: sql`COALESCE(message, '')`
					})
					.where(eq(email.emailId, emailId))
					.run();
			}
		} catch (e) {
			console.error('Tracking pixel recording error:', e);
		}
	}

	return new Response(TRANSPARENT_GIF, {
		status: 200,
		headers: {
			'Content-Type': 'image/gif',
			'Content-Length': String(TRANSPARENT_GIF.length),
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
			'Pragma': 'no-cache',
			'Expires': '0'
		}
	});
});

// Track email click and 302 redirect to original destination
app.get('/track/click/:token', async (c) => {
	const token = c.req.param('token');
	const targetUrl = c.req.query('url');

	if (!targetUrl) {
		return c.text('Missing target URL', 400);
	}

	let decodedUrl;
	try {
		decodedUrl = decodeURIComponent(targetUrl);
		const parsed = new URL(decodedUrl);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return c.text('Invalid URL scheme', 400);
		}
	} catch (e) {
		return c.text('Invalid target URL', 400);
	}

	const isBot = isBotOrPrefetch(c);

	if (!isBot && token) {
		try {
			const emailId = Number(token);
			if (Number.isInteger(emailId) && emailId > 0) {
				// Click confirmed
				console.log(`Email click tracked: emailId=${emailId} target=${decodedUrl}`);
			}
		} catch (e) {
			console.error('Track click error:', e);
		}
	}

	// 302 redirect
	return c.redirect(decodedUrl, 302);
});
