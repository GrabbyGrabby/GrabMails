import app from '../hono/hono';
import userService from '../service/user-service';
import result from '../model/result';
import userContext from '../security/user-context';

function safeJsonParse(raw, fallback) {
	if (!raw) return fallback;
	try {
		return JSON.parse(raw);
	} catch (e) {
		return fallback;
	}
}

app.get('/my/loginUserInfo', async (c) => {
	const user = await userService.loginUserInfo(c, userContext.getUserId(c));
	return c.json(result.ok(user));
});

app.put('/my/resetPassword', async (c) => {
	const currentToken = await userContext.getToken(c);
	await userService.resetPassword(c, await c.req.json(), userContext.getUserId(c), currentToken);
	return c.json(result.ok());
});

app.delete('/my/delete', async (c) => {
	await userService.delete(c, userContext.getUserId(c));
	return c.json(result.ok());
});

// User locale preference
app.get('/my/locale', async (c) => {
	const userId = userContext.getUserId(c);
	const res = await c.env.kv.get(`user_locale_${userId}`);
	return c.json(result.ok(res || 'en'));
});

app.post('/my/locale', async (c) => {
	const userId = userContext.getUserId(c);
	const { locale } = await c.req.json().catch(() => ({}));
	if (typeof locale !== 'string' || !/^[a-zA-Z]{2,5}([-_][a-zA-Z]{2,5})?$/.test(locale)) {
		return c.json(result.fail('Invalid locale', 400));
	}
	await c.env.kv.put(`user_locale_${userId}`, locale);
	return c.json(result.ok(locale));
});

// User wallpaper preference
app.get('/my/wallpaper', async (c) => {
	const userId = userContext.getUserId(c);
	const res = await c.env.kv.get(`user_wallpaper_${userId}`);
	return c.json(result.ok(safeJsonParse(res, null)));
});

app.post('/my/wallpaper', async (c) => {
	const userId = userContext.getUserId(c);
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return c.json(result.fail('Invalid wallpaper payload', 400));
	}
	const serialized = JSON.stringify(body);
	if (serialized.length > 2048) {
		return c.json(result.fail('Payload too large', 400));
	}
	await c.env.kv.put(`user_wallpaper_${userId}`, serialized);
	return c.json(result.ok(body));
});

// User security settings & auto-lock
app.get('/my/security', async (c) => {
	const userId = userContext.getUserId(c);
	const sec = await c.env.kv.get(`user_security_${userId}`);
	const defaultSec = {
		autoLockMinutes: 0,
		twoFactorEnabled: false,
		passkeyEnabled: false,
		backupEmail: '',
		securityScore: 85
	};
	return c.json(result.ok(safeJsonParse(sec, defaultSec)));
});

app.post('/my/security', async (c) => {
	const userId = userContext.getUserId(c);
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return c.json(result.fail('Invalid security payload', 400));
	}
	const serialized = JSON.stringify(body);
	if (serialized.length > 2048) {
		return c.json(result.fail('Payload too large', 400));
	}
	await c.env.kv.put(`user_security_${userId}`, serialized);
	return c.json(result.ok(body));
});

// Additional privacy & log endpoints
app.get('/my/loginLog', async (c) => {
	return c.json(result.ok([]));
});

app.get('/my/recovery-codes/status', async (c) => {
	return c.json(result.ok({ generated: false }));
});

app.get('/my/passkey/list', async (c) => {
	return c.json(result.ok([]));
});

app.get('/my/sessions', async (c) => {
	return c.json(result.ok([]));
});

app.get('/security/score', async (c) => {
	return c.json(result.ok({ score: 95 }));
});
